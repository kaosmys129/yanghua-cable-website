#!/usr/bin/env node

/**
 * SEO检查调度器
 * 实现定期自动化SEO检查和告警机制
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { batchAnalyze } = require('./seo-simple-analyzer.cjs');

// 配置
const CONFIG = {
  // 检查频率配置 (cron格式)
  schedules: {
    daily: '0 9 * * *',      // 每天上午9点
    weekly: '0 9 * * 1',     // 每周一上午9点
    monthly: '0 9 1 * *'     // 每月1号上午9点
  },
  
  // 告警配置
  alerts: {
    scoreThreshold: 70,      // 评分低于70分告警
    errorThreshold: 0,       // 错误数量超过0个告警
    warningThreshold: 10,    // 警告数量超过10个告警
    
    // 告警方式
    methods: {
      console: true,         // 控制台输出
      file: true,           // 文件记录
      email: false,         // 邮件通知 (需要配置)
      webhook: false        // Webhook通知 (需要配置)
    },
    
    // 邮件配置 (如果启用)
    email: {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.SMTP_FROM || 'seo-monitor@company.com',
      to: process.env.ALERT_EMAIL || 'admin@company.com',
      subject: 'SEO检查告警通知'
    },
    
    // Webhook配置 (如果启用)
    webhook: {
      url: process.env.WEBHOOK_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  },
  
  // 性能配置
  performance: {
    maxConcurrent: 3,        // 最大并发检查数
    requestDelay: 1000,      // 请求间隔 (毫秒)
    timeout: 30000,          // 超时时间 (毫秒)
    retryAttempts: 2         // 重试次数
  },
  
  // 报告配置
  reports: {
    retention: 30,           // 报告保留天数
    formats: ['json', 'html'], // 报告格式
    compress: true           // 是否压缩旧报告
  }
};

const REPORTS_DIR = path.join(__dirname, '..', 'seo-reports');
const SCHEDULER_LOG = path.join(REPORTS_DIR, 'scheduler.log');

/**
 * 日志记录
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // 写入日志文件
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  fs.appendFileSync(SCHEDULER_LOG, logMessage + '\n');
}

/**
 * 解析cron表达式为下次执行时间
 */
function getNextRunTime(cronExpression) {
  // 简化的cron解析 (仅支持基本格式)
  const [minute, hour, day, month, weekday] = cronExpression.split(' ');
  
  const now = new Date();
  const next = new Date(now);
  
  // 设置时间
  if (hour !== '*') next.setHours(parseInt(hour));
  if (minute !== '*') next.setMinutes(parseInt(minute));
  next.setSeconds(0);
  next.setMilliseconds(0);
  
  // 如果时间已过，推到下一天
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

/**
 * 检查是否应该运行
 */
function shouldRun(cronExpression, lastRun) {
  if (!lastRun) return true;
  
  const nextRun = getNextRunTime(cronExpression);
  const now = new Date();
  
  return now >= nextRun;
}

/**
 * 发送告警
 */
async function sendAlert(report, alertType = 'warning') {
  const { alerts } = CONFIG;
  const { summary, metadata } = report;
  
  const alertData = {
    timestamp: new Date().toISOString(),
    type: alertType,
    score: summary.overallScore.score,
    grade: summary.overallScore.grade,
    issues: summary.issueStats,
    totalPages: metadata.totalPages,
    successfulPages: metadata.successfulPages,
    failedPages: metadata.failedPages,
    recommendations: summary.recommendations
  };
  
  const alertMessage = `
SEO检查告警通知

时间: ${new Date(alertData.timestamp).toLocaleString('zh-CN')}
类型: ${alertType.toUpperCase()}
总体评分: ${alertData.score} (${alertData.grade})

问题统计:
- 错误: ${alertData.issues.error || 0}
- 警告: ${alertData.issues.warning || 0}
- 建议: ${alertData.issues.info || 0}

页面统计:
- 总页面数: ${alertData.totalPages}
- 成功分析: ${alertData.successfulPages}
- 分析失败: ${alertData.failedPages}

主要建议:
${alertData.recommendations.map(rec => `- [${rec.priority.toUpperCase()}] ${rec.message}`).join('\n')}

请及时查看详细报告并处理相关问题。
  `;
  
  // 控制台告警
  if (alerts.methods.console) {
    console.log('\n' + '='.repeat(60));
    console.log('🚨 SEO自动检查告警');
    console.log('='.repeat(60));
    console.log(alertMessage);
    console.log('='.repeat(60) + '\n');
  }
  
  // 文件告警
  if (alerts.methods.file) {
    const alertLogPath = path.join(REPORTS_DIR, 'alerts.log');
    fs.appendFileSync(alertLogPath, JSON.stringify(alertData) + '\n');
    log(`告警已记录到文件: ${alertLogPath}`, 'warning');
  }
  
  // 邮件告警 (需要nodemailer)
  if (alerts.methods.email && alerts.email.smtp.auth.user) {
    try {
      // 这里需要安装nodemailer: npm install nodemailer
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransporter(alerts.email.smtp);
      // await transporter.sendMail({
      //   from: alerts.email.from,
      //   to: alerts.email.to,
      //   subject: alerts.email.subject,
      //   text: alertMessage
      // });
      log('邮件告警功能需要安装nodemailer包', 'info');
    } catch (error) {
      log(`邮件告警发送失败: ${error.message}`, 'error');
    }
  }
  
  // Webhook告警
  if (alerts.methods.webhook && alerts.webhook.url) {
    try {
      const response = await fetch(alerts.webhook.url, {
        method: alerts.webhook.method,
        headers: alerts.webhook.headers,
        body: JSON.stringify({
          ...alertData,
          message: alertMessage
        })
      });
      
      if (response.ok) {
        log('Webhook告警发送成功', 'info');
      } else {
        log(`Webhook告警发送失败: ${response.status}`, 'error');
      }
    } catch (error) {
      log(`Webhook告警发送失败: ${error.message}`, 'error');
    }
  }
}

/**
 * 检查是否需要告警
 */
function needsAlert(report) {
  const { alerts } = CONFIG;
  const { summary } = report;
  
  return (
    summary.overallScore.score < alerts.scoreThreshold ||
    summary.issueStats.error > alerts.errorThreshold ||
    summary.issueStats.warning > alerts.warningThreshold
  );
}

/**
 * 清理旧报告
 */
function cleanupOldReports() {
  try {
    const { retention } = CONFIG.reports;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retention);
    
    const files = fs.readdirSync(REPORTS_DIR);
    let cleanedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(REPORTS_DIR, file);
      const stats = fs.statSync(filePath);
      
      // 跳过最新报告和日志文件
      if (file.startsWith('latest-') || file.endsWith('.log')) {
        return;
      }
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      log(`清理了 ${cleanedCount} 个过期报告文件`);
    }
  } catch (error) {
    log(`清理旧报告时发生错误: ${error.message}`, 'error');
  }
}

/**
 * 执行SEO检查
 */
async function runSEOCheck(scheduled = false) {
  try {
    log(`开始${scheduled ? '定时' : '手动'}SEO检查`);
    
    // 执行分析
    const report = await batchAnalyze();
    
    // 检查是否需要告警
    if (needsAlert(report)) {
      await sendAlert(report, 'warning');
    } else {
      log('SEO检查完成，未发现需要告警的问题');
    }
    
    // 清理旧报告
    cleanupOldReports();
    
    // 更新最后运行时间
    const statusFile = path.join(REPORTS_DIR, 'scheduler-status.json');
    const status = {
      lastRun: new Date().toISOString(),
      lastScore: report.summary.overallScore.score,
      lastGrade: report.summary.overallScore.grade,
      totalRuns: (getSchedulerStatus().totalRuns || 0) + 1
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    
    log(`${scheduled ? '定时' : '手动'}SEO检查完成`);
    return report;
    
  } catch (error) {
    log(`SEO检查执行失败: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 获取调度器状态
 */
function getSchedulerStatus() {
  try {
    const statusFile = path.join(REPORTS_DIR, 'scheduler-status.json');
    if (fs.existsSync(statusFile)) {
      return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    }
  } catch (error) {
    log(`读取调度器状态失败: ${error.message}`, 'error');
  }
  return {};
}

/**
 * 启动调度器
 */
function startScheduler(frequency = 'daily') {
  const cronExpression = CONFIG.schedules[frequency];
  if (!cronExpression) {
    throw new Error(`不支持的频率: ${frequency}`);
  }
  
  log(`启动SEO检查调度器，频率: ${frequency} (${cronExpression})`);
  
  const status = getSchedulerStatus();
  
  // 检查间隔 (每分钟检查一次)
  const checkInterval = setInterval(async () => {
    try {
      if (shouldRun(cronExpression, status.lastRun)) {
        await runSEOCheck(true);
      }
    } catch (error) {
      log(`定时检查执行失败: ${error.message}`, 'error');
    }
  }, 60000); // 每分钟检查一次
  
  // 优雅关闭
  process.on('SIGINT', () => {
    log('收到停止信号，正在关闭调度器...');
    clearInterval(checkInterval);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('收到终止信号，正在关闭调度器...');
    clearInterval(checkInterval);
    process.exit(0);
  });
  
  log('SEO检查调度器已启动，按 Ctrl+C 停止');
  
  // 保持进程运行
  return checkInterval;
}

/**
 * 显示状态
 */
function showStatus() {
  const status = getSchedulerStatus();
  
  console.log('\n=== SEO检查调度器状态 ===');
  console.log(`最后运行时间: ${status.lastRun ? new Date(status.lastRun).toLocaleString('zh-CN') : '从未运行'}`);
  console.log(`最后评分: ${status.lastScore || 'N/A'} (${status.lastGrade || 'N/A'})`);
  console.log(`总运行次数: ${status.totalRuns || 0}`);
  
  // 显示配置
  console.log('\n=== 当前配置 ===');
  console.log(`告警评分阈值: ${CONFIG.alerts.scoreThreshold}`);
  console.log(`告警错误阈值: ${CONFIG.alerts.errorThreshold}`);
  console.log(`告警警告阈值: ${CONFIG.alerts.warningThreshold}`);
  console.log(`报告保留天数: ${CONFIG.reports.retention}`);
  
  // 显示可用频率
  console.log('\n=== 可用检查频率 ===');
  Object.entries(CONFIG.schedules).forEach(([name, cron]) => {
    console.log(`${name}: ${cron}`);
  });
  
  console.log('');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'start':
        const frequency = args[1] || 'daily';
        startScheduler(frequency);
        break;
        
      case 'run':
        await runSEOCheck(false);
        break;
        
      case 'status':
        showStatus();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        console.log(`
SEO检查调度器

用法:
  node seo-scheduler.cjs <command> [options]

命令:
  start [frequency]  启动调度器 (频率: daily, weekly, monthly)
  run               立即执行一次SEO检查
  status            显示调度器状态和配置
  help              显示帮助信息

示例:
  node seo-scheduler.cjs start daily     # 启动每日检查
  node seo-scheduler.cjs start weekly    # 启动每周检查
  node seo-scheduler.cjs run             # 立即执行检查
  node seo-scheduler.cjs status          # 查看状态

环境变量:
  SMTP_USER         SMTP用户名 (邮件告警)
  SMTP_PASS         SMTP密码 (邮件告警)
  SMTP_FROM         发件人邮箱
  ALERT_EMAIL       告警接收邮箱
  WEBHOOK_URL       Webhook告警URL
        `);
        break;
        
      default:
        console.log('未知命令，使用 --help 查看帮助');
        process.exit(1);
    }
  } catch (error) {
    log(`执行命令失败: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  startScheduler,
  runSEOCheck,
  getSchedulerStatus,
  sendAlert,
  CONFIG
};