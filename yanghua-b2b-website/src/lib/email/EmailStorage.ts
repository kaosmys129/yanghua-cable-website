import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

/**
 * 邮件记录接口
 */
export interface EmailRecord {
  id: string;
  type: 'contact' | 'inquiry' | 'notification' | 'marketing';
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  locale: string;
  templateId?: string;
  templateData?: string; // JSON string
  messageId?: string;
  errorMessage?: string;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: string; // JSON string for additional data
}

/**
 * 邮件模板接口
 */
export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'contact' | 'inquiry' | 'notification' | 'marketing';
  locale: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string; // JSON array of variable names
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 邮件统计接口
 */
export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  byType: Record<string, number>;
  byLocale: Record<string, number>;
  byStatus: Record<string, number>;
}

/**
 * 查询选项接口
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: {
    type?: string;
    status?: string;
    locale?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

/**
 * 邮件存储服务类
 * 负责邮件数据的持久化存储和管理
 */
export class EmailStorage {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'emails.db');
    // 确保数据库所在的目录存在
    const dir = path.dirname(this.dbPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[EmailStorage] Created database directory: ${dir}`);
      }
    } catch (dirError) {
      console.error('[EmailStorage] Failed to ensure database directory exists:', dirError);
      // 继续尝试初始化数据库，但记录错误以便诊断
    }

    this.db = new Database(this.dbPath);
    this.initializeDatabase();
  }

  /**
   * 初始化数据库表结构
   */
  private initializeDatabase(): void {
    // 创建邮件记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        cc_address TEXT,
        bcc_address TEXT,
        subject TEXT NOT NULL,
        html_content TEXT,
        text_content TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        locale TEXT NOT NULL DEFAULT 'en',
        template_id TEXT,
        template_data TEXT,
        message_id TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'normal',
        scheduled_at DATETIME,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    // 创建邮件模板表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        locale TEXT NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT NOT NULL,
        variables TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引以提高查询性能
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_emails_type ON emails(type);
      CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
      CREATE INDEX IF NOT EXISTS idx_emails_locale ON emails(locale);
      CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);
      CREATE INDEX IF NOT EXISTS idx_templates_type_locale ON email_templates(type, locale);
    `);

    console.log('Email database initialized successfully');
  }

  /**
   * 保存邮件记录
   */
  async saveEmail(email: Omit<EmailRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO emails (
        id, type, from_address, to_address, cc_address, bcc_address,
        subject, html_content, text_content, status, locale,
        template_id, template_data, message_id, error_message,
        retry_count, priority, scheduled_at, sent_at, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      email.type,
      email.from,
      email.to,
      email.cc || null,
      email.bcc || null,
      email.subject,
      email.htmlContent || null,
      email.textContent || null,
      email.status,
      email.locale,
      email.templateId || null,
      email.templateData || null,
      email.messageId || null,
      email.errorMessage || null,
      email.retryCount,
      email.priority,
      email.scheduledAt?.toISOString() || null,
      email.sentAt?.toISOString() || null,
      now,
      now,
      email.metadata || null
    );

    return id;
  }

  /**
   * 更新邮件记录
   */
  async updateEmail(id: string, updates: Partial<EmailRecord>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'id' || key === 'createdAt') return; // 不允许更新这些字段

      const dbField = this.camelToSnake(key);
      fields.push(`${dbField} = ?`);
      
      if (value instanceof Date) {
        values.push(value.toISOString());
      } else if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE emails SET ${fields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * 获取邮件记录
   */
  async getEmail(id: string): Promise<EmailRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM emails WHERE id = ?');
    const row = stmt.get(id) as any;
    
    return row ? this.mapRowToEmailRecord(row) : null;
  }

  /**
   * 查询邮件记录列表
   */
  async getEmails(options: QueryOptions = {}): Promise<{
    emails: EmailRecord[];
    total: number;
  }> {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      filters = {}
    } = options;

    // 构建WHERE子句
    const whereConditions: string[] = [];
    const whereValues: any[] = [];

    if (filters.type) {
      whereConditions.push('type = ?');
      whereValues.push(filters.type);
    }

    if (filters.status) {
      whereConditions.push('status = ?');
      whereValues.push(filters.status);
    }

    if (filters.locale) {
      whereConditions.push('locale = ?');
      whereValues.push(filters.locale);
    }

    if (filters.dateFrom) {
      whereConditions.push('created_at >= ?');
      whereValues.push(filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      whereConditions.push('created_at <= ?');
      whereValues.push(filters.dateTo.toISOString());
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // 获取总数
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as total FROM emails ${whereClause}
    `);
    const { total } = countStmt.get(...whereValues) as { total: number };

    // 获取数据
    const dataStmt = this.db.prepare(`
      SELECT * FROM emails ${whereClause}
      ORDER BY ${this.camelToSnake(sortBy)} ${sortOrder}
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(...whereValues, limit, offset) as any[];

    const emails = rows.map(row => this.mapRowToEmailRecord(row));

    return { emails, total };
  }

  /**
   * 删除邮件记录
   */
  async deleteEmail(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM emails WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 保存邮件模板
   */
  async saveTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO email_templates (
        id, name, description, type, locale, subject,
        html_content, text_content, variables, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      template.name,
      template.description || null,
      template.type,
      template.locale,
      template.subject,
      template.htmlContent,
      template.textContent,
      template.variables,
      template.isActive ? 1 : 0,
      now,
      now
    );

    return id;
  }

  /**
   * 获取邮件模板
   */
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const stmt = this.db.prepare('SELECT * FROM email_templates WHERE id = ?');
    const row = stmt.get(id) as any;
    
    return row ? this.mapRowToEmailTemplate(row) : null;
  }

  /**
   * 根据类型和语言获取模板
   */
  async getTemplateByTypeAndLocale(type: string, locale: string): Promise<EmailTemplate | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM email_templates 
      WHERE type = ? AND locale = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const row = stmt.get(type, locale) as any;
    
    return row ? this.mapRowToEmailTemplate(row) : null;
  }

  /**
   * 获取邮件统计信息
   */
  async getStats(): Promise<EmailStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 基础统计
    const totalSent = this.db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'sent'").get() as { count: number };
    const totalFailed = this.db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'failed'").get() as { count: number };
    const totalPending = this.db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'pending'").get() as { count: number };

    // 时间范围统计
    const sentToday = this.db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'sent' AND created_at >= ?").get(today.toISOString()) as { count: number };
    const sentThisWeek = this.db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'sent' AND created_at >= ?").get(thisWeek.toISOString()) as { count: number };
    const sentThisMonth = this.db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'sent' AND created_at >= ?").get(thisMonth.toISOString()) as { count: number };

    // 按类型统计
    const byTypeRows = this.db.prepare("SELECT type, COUNT(*) as count FROM emails GROUP BY type").all() as Array<{ type: string; count: number }>;
    const byType = Object.fromEntries(byTypeRows.map(row => [row.type, row.count]));

    // 按语言统计
    const byLocaleRows = this.db.prepare("SELECT locale, COUNT(*) as count FROM emails GROUP BY locale").all() as Array<{ locale: string; count: number }>;
    const byLocale = Object.fromEntries(byLocaleRows.map(row => [row.locale, row.count]));

    // 按状态统计
    const byStatusRows = this.db.prepare("SELECT status, COUNT(*) as count FROM emails GROUP BY status").all() as Array<{ status: string; count: number }>;
    const byStatus = Object.fromEntries(byStatusRows.map(row => [row.status, row.count]));

    return {
      totalSent: totalSent.count,
      totalFailed: totalFailed.count,
      totalPending: totalPending.count,
      sentToday: sentToday.count,
      sentThisWeek: sentThisWeek.count,
      sentThisMonth: sentThisMonth.count,
      byType,
      byLocale,
      byStatus,
    };
  }

  /**
   * 清理旧的邮件记录
   */
  async cleanupOldEmails(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const stmt = this.db.prepare(`
      DELETE FROM emails 
      WHERE created_at < ? AND status IN ('sent', 'failed')
    `);
    
    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  /**
   * 将数据库行映射为EmailRecord对象
   */
  private mapRowToEmailRecord(row: any): EmailRecord {
    return {
      id: row.id,
      type: row.type,
      from: row.from_address,
      to: row.to_address,
      cc: row.cc_address,
      bcc: row.bcc_address,
      subject: row.subject,
      htmlContent: row.html_content,
      textContent: row.text_content,
      status: row.status,
      locale: row.locale,
      templateId: row.template_id,
      templateData: row.template_data,
      messageId: row.message_id,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      priority: row.priority,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      metadata: row.metadata,
    };
  }

  /**
   * 将数据库行映射为EmailTemplate对象
   */
  private mapRowToEmailTemplate(row: any): EmailTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      locale: row.locale,
      subject: row.subject,
      htmlContent: row.html_content,
      textContent: row.text_content,
      variables: row.variables,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * 将驼峰命名转换为下划线命名
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

/**
 * 默认邮件存储实例
 */
export const defaultEmailStorage = new EmailStorage();