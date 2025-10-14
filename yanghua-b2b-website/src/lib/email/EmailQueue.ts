import { EmailService, EmailOptions, EmailResult } from './EmailService';
import { EmailStorage, defaultEmailStorage } from './EmailStorage';
import { v4 as uuidv4 } from 'uuid';

/**
 * 队列任务接口
 */
export interface QueueTask {
  id: string;
  emailId: string;
  emailOptions: EmailOptions;
  priority: 'high' | 'normal' | 'low';
  maxRetries: number;
  currentRetry: number;
  scheduledAt: Date;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  result?: EmailResult;
}

/**
 * 队列配置接口
 */
export interface QueueConfig {
  maxConcurrentJobs: number;
  retryDelay: number; // 重试延迟（毫秒）
  maxRetries: number;
  processInterval: number; // 处理间隔（毫秒）
  cleanupInterval: number; // 清理间隔（毫秒）
  maxCompletedAge: number; // 已完成任务保留时间（毫秒）
}

/**
 * 队列统计接口
 */
export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  totalProcessed: number;
  averageProcessingTime: number;
  successRate: number;
}

/**
 * 邮件队列管理器类
 */
export class EmailQueue {
  private tasks: Map<string, QueueTask> = new Map();
  private processing: Set<string> = new Set();
  private emailService: EmailService;
  private emailStorage: EmailStorage;
  private config: QueueConfig;
  private processTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    totalProcessed: 0,
    averageProcessingTime: 0,
    successRate: 0,
  };

  constructor(
    emailService: EmailService,
    emailStorage: EmailStorage = defaultEmailStorage,
    config: Partial<QueueConfig> = {}
  ) {
    this.emailService = emailService;
    this.emailStorage = emailStorage;
    this.config = {
      maxConcurrentJobs: 3,
      retryDelay: 5000, // 5秒
      maxRetries: 3,
      processInterval: 1000, // 1秒
      cleanupInterval: 60000, // 1分钟
      maxCompletedAge: 24 * 60 * 60 * 1000, // 24小时
      ...config,
    };
  }

  /**
   * 启动队列处理器
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Email queue started');

    // 启动任务处理器
    this.processTimer = setInterval(() => {
      this.processPendingTasks();
    }, this.config.processInterval);

    // 启动清理器
    this.cleanupTimer = setInterval(() => {
      this.cleanupCompletedTasks();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止队列处理器
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('Email queue stopped');

    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 添加邮件任务到队列
   */
  async addTask(
    emailId: string,
    emailOptions: EmailOptions,
    priority: 'high' | 'normal' | 'low' = 'normal',
    scheduledAt: Date = new Date(),
    maxRetries: number = this.config.maxRetries
  ): Promise<string> {
    const taskId = uuidv4();
    
    const task: QueueTask = {
      id: taskId,
      emailId,
      emailOptions,
      priority,
      maxRetries,
      currentRetry: 0,
      scheduledAt,
      createdAt: new Date(),
      status: 'pending',
    };

    this.tasks.set(taskId, task);
    this.updateStats();

    console.log(`Email task added to queue: ${taskId} (priority: ${priority})`);
    return taskId;
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): QueueTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'processing' || task.status === 'completed') {
      return false;
    }

    task.status = 'cancelled';
    this.updateStats();
    console.log(`Email task cancelled: ${taskId}`);
    return true;
  }

  /**
   * 重新排队失败的任务
   */
  requeueTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'failed') {
      return false;
    }

    task.status = 'pending';
    task.currentRetry = 0;
    task.scheduledAt = new Date();
    task.error = undefined;
    
    this.updateStats();
    console.log(`Email task requeued: ${taskId}`);
    return true;
  }

  /**
   * 处理待处理的任务
   */
  private async processPendingTasks(): Promise<void> {
    if (this.processing.size >= this.config.maxConcurrentJobs) {
      return; // 已达到最大并发数
    }

    // 获取待处理的任务，按优先级和创建时间排序
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => 
        task.status === 'pending' && 
        task.scheduledAt <= new Date() &&
        !this.processing.has(task.id)
      )
      .sort((a, b) => {
        // 优先级排序
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 创建时间排序
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    // 处理任务
    const availableSlots = this.config.maxConcurrentJobs - this.processing.size;
    const tasksToProcess = pendingTasks.slice(0, availableSlots);

    for (const task of tasksToProcess) {
      this.processTask(task);
    }
  }

  /**
   * 处理单个任务
   */
  private async processTask(task: QueueTask): Promise<void> {
    this.processing.add(task.id);
    task.status = 'processing';
    this.updateStats();

    const startTime = Date.now();
    console.log(`Processing email task: ${task.id} (attempt ${task.currentRetry + 1})`);

    try {
      // 更新数据库中的邮件状态
      await this.emailStorage.updateEmail(task.emailId, {
        status: 'pending',
        retryCount: task.currentRetry,
      });

      // 发送邮件
      const result = await this.emailService.sendEmail(task.emailOptions);
      const processingTime = Date.now() - startTime;

      if (result.success) {
        // 成功
        task.status = 'completed';
        task.result = result;
        
        await this.emailStorage.updateEmail(task.emailId, {
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date(),
        });

        console.log(`Email task completed: ${task.id} (${processingTime}ms)`);
      } else {
        // 失败，检查是否需要重试
        if (task.currentRetry < task.maxRetries) {
          task.currentRetry++;
          task.status = 'pending';
          task.scheduledAt = new Date(Date.now() + this.config.retryDelay * task.currentRetry);
          task.error = result.error;

          await this.emailStorage.updateEmail(task.emailId, {
            status: 'pending',
            errorMessage: result.error,
            retryCount: task.currentRetry,
          });

          console.log(`Email task will retry: ${task.id} (attempt ${task.currentRetry + 1}/${task.maxRetries + 1})`);
        } else {
          // 达到最大重试次数，标记为失败
          task.status = 'failed';
          task.error = result.error;

          await this.emailStorage.updateEmail(task.emailId, {
            status: 'failed',
            errorMessage: result.error,
          });

          console.log(`Email task failed permanently: ${task.id}`);
        }
      }

    } catch (error) {
      console.error(`Email task processing error: ${task.id}`, error);
      
      // 处理异常
      if (task.currentRetry < task.maxRetries) {
        task.currentRetry++;
        task.status = 'pending';
        task.scheduledAt = new Date(Date.now() + this.config.retryDelay * task.currentRetry);
        task.error = (error as Error).message;
      } else {
        task.status = 'failed';
        task.error = (error as Error).message;
        
        await this.emailStorage.updateEmail(task.emailId, {
          status: 'failed',
          errorMessage: (error as Error).message,
        });
      }
    } finally {
      this.processing.delete(task.id);
      this.updateStats();
    }
  }

  /**
   * 清理已完成的任务
   */
  private cleanupCompletedTasks(): void {
    const cutoffTime = Date.now() - this.config.maxCompletedAge;
    let cleanedCount = 0;

    for (const [taskId, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') &&
        task.createdAt.getTime() < cutoffTime
      ) {
        this.tasks.delete(taskId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old email tasks`);
      this.updateStats();
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const tasks = Array.from(this.tasks.values());
    
    this.stats.pending = tasks.filter(t => t.status === 'pending').length;
    this.stats.processing = tasks.filter(t => t.status === 'processing').length;
    this.stats.completed = tasks.filter(t => t.status === 'completed').length;
    this.stats.failed = tasks.filter(t => t.status === 'failed').length;
    this.stats.cancelled = tasks.filter(t => t.status === 'cancelled').length;
    
    this.stats.totalProcessed = this.stats.completed + this.stats.failed;
    this.stats.successRate = this.stats.totalProcessed > 0 
      ? (this.stats.completed / this.stats.totalProcessed) * 100 
      : 0;

    // 计算平均处理时间（简化版本）
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.result);
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const processingTime = task.result?.timestamp 
          ? task.result.timestamp.getTime() - task.createdAt.getTime()
          : 0;
        return sum + processingTime;
      }, 0);
      this.stats.averageProcessingTime = totalTime / completedTasks.length;
    }
  }

  /**
   * 获取队列统计信息
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): QueueTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取指定状态的任务
   */
  getTasksByStatus(status: QueueTask['status']): QueueTask[] {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.tasks.clear();
    this.processing.clear();
    this.updateStats();
    console.log('Email queue cleared');
  }

  /**
   * 获取队列配置
   */
  getConfig(): QueueConfig {
    return { ...this.config };
  }

  /**
   * 更新队列配置
   */
  updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Email queue configuration updated');
  }
}

/**
 * 创建邮件队列实例
 */
export function createEmailQueue(
  emailService: EmailService,
  emailStorage?: EmailStorage,
  config?: Partial<QueueConfig>
): EmailQueue {
  return new EmailQueue(emailService, emailStorage, config);
}