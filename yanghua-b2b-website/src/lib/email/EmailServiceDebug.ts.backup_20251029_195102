/**
 * 邮件服务调试工具
 * 用于诊断和测试邮件服务配置问题
 */

import { createEmailService, EmailProvider } from './EmailService';

/**
 * 调试信息接口
 */
export interface DebugInfo {
  timestamp: string;
  environment: {
    nodeEnv: string;
    hasSmtpHost: boolean;
    hasSmtpUser: boolean;
    hasSmtpPass: boolean;
    hasEmailFrom: boolean;
    hasContactEmail: boolean;
  };
  config: {
    host: string;
    port: number;
    secure: boolean;
    fromName: string;
    fromAddress: string;
  };
  connectivity: {
    canCreateService: boolean;
    canVerifyConnection: boolean;
    connectionError?: string;
  };
  recommendations: string[];
}

/**
 * 邮件服务调试器类
 */
export class EmailServiceDebugger {
  
  /**
   * 执行完整的诊断检查
   */
  static async diagnose(): Promise<DebugInfo> {
    const timestamp = new Date().toISOString();
    const recommendations: string[] = [];
    
    // 检查环境变量
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      hasSmtpHost: !!process.env.SMTP_HOST,
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPass: !!process.env.SMTP_PASS,
      hasEmailFrom: !!process.env.EMAIL_FROM,
      hasContactEmail: !!process.env.CONTACT_EMAIL,
    };

    // 检查配置
    const config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      fromName: process.env.EMAIL_FROM_NAME || 'Yanghua Cable',
      fromAddress: process.env.EMAIL_FROM || 'noreply@yanghua.com',
    };

    // 检查连接性
    let connectivity = {
      canCreateService: false,
      canVerifyConnection: false,
      connectionError: undefined as string | undefined,
    };

    try {
      // 尝试创建邮件服务
      const emailService = createEmailService();
      connectivity.canCreateService = true;

      // 尝试验证连接
      try {
        const isConnected = await emailService.verifyConnection();
        connectivity.canVerifyConnection = isConnected;
        
        if (!isConnected) {
          connectivity.connectionError = 'Connection verification failed';
        }
      } catch (verifyError) {
        connectivity.connectionError = (verifyError as Error).message;
      }

      // 清理资源
      await emailService.close();
      
    } catch (serviceError) {
      connectivity.connectionError = (serviceError as Error).message;
    }

    // 生成建议
    if (!environment.hasSmtpHost) {
      recommendations.push('设置 SMTP_HOST 环境变量');
    }
    if (!environment.hasSmtpUser) {
      recommendations.push('设置 SMTP_USER 环境变量');
    }
    if (!environment.hasSmtpPass) {
      recommendations.push('设置 SMTP_PASS 环境变量');
    }
    if (!environment.hasEmailFrom) {
      recommendations.push('设置 EMAIL_FROM 环境变量');
    }
    if (!environment.hasContactEmail) {
      recommendations.push('设置 CONTACT_EMAIL 环境变量');
    }
    
    if (config.host === 'localhost') {
      recommendations.push('SMTP_HOST 设置为 localhost，请配置实际的 SMTP 服务器');
    }
    
    if (!connectivity.canCreateService) {
      recommendations.push('无法创建邮件服务，请检查依赖包是否正确安装');
    }
    
    if (!connectivity.canVerifyConnection && connectivity.connectionError) {
      if (connectivity.connectionError.includes('ENOTFOUND')) {
        recommendations.push('SMTP 服务器地址无法解析，请检查 SMTP_HOST 配置');
      } else if (connectivity.connectionError.includes('ECONNREFUSED')) {
        recommendations.push('SMTP 服务器拒绝连接，请检查端口和防火墙设置');
      } else if (connectivity.connectionError.includes('authentication')) {
        recommendations.push('SMTP 认证失败，请检查用户名和密码');
      } else {
        recommendations.push(`连接错误: ${connectivity.connectionError}`);
      }
    }

    return {
      timestamp,
      environment,
      config,
      connectivity,
      recommendations,
    };
  }

  /**
   * 测试邮件发送功能
   */
  static async testEmailSend(testEmail: string): Promise<{
    success: boolean;
    error?: string;
    messageId?: string;
    duration: number;
  }> {
    const startTime = Date.now();
    
    try {
      const emailService = createEmailService();
      
      const result = await emailService.sendEmail({
        to: testEmail,
        subject: 'Yanghua Cable - Email Service Test',
        html: `
          <h2>邮件服务测试</h2>
          <p>这是一封测试邮件，用于验证 Yanghua Cable 网站的邮件服务配置。</p>
          <p>发送时间: ${new Date().toLocaleString()}</p>
          <p>如果您收到这封邮件，说明邮件服务配置正常。</p>
        `,
        text: `
邮件服务测试

这是一封测试邮件，用于验证 Yanghua Cable 网站的邮件服务配置。
发送时间: ${new Date().toLocaleString()}
如果您收到这封邮件，说明邮件服务配置正常。
        `,
      });

      await emailService.close();
      
      return {
        success: result.success,
        error: result.error,
        messageId: result.messageId,
        duration: Date.now() - startTime,
      };
      
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 生成诊断报告
   */
  static async generateReport(): Promise<string> {
    const diagnosis = await this.diagnose();
    
    let report = `
# 邮件服务诊断报告
生成时间: ${diagnosis.timestamp}

## 环境检查
- Node.js 环境: ${diagnosis.environment.nodeEnv}
- SMTP_HOST 配置: ${diagnosis.environment.hasSmtpHost ? '✅' : '❌'}
- SMTP_USER 配置: ${diagnosis.environment.hasSmtpUser ? '✅' : '❌'}
- SMTP_PASS 配置: ${diagnosis.environment.hasSmtpPass ? '✅' : '❌'}
- EMAIL_FROM 配置: ${diagnosis.environment.hasEmailFrom ? '✅' : '❌'}
- CONTACT_EMAIL 配置: ${diagnosis.environment.hasContactEmail ? '✅' : '❌'}

## 服务配置
- SMTP 主机: ${diagnosis.config.host}
- SMTP 端口: ${diagnosis.config.port}
- 安全连接: ${diagnosis.config.secure ? '是' : '否'}
- 发送方名称: ${diagnosis.config.fromName}
- 发送方地址: ${diagnosis.config.fromAddress}

## 连接测试
- 服务创建: ${diagnosis.connectivity.canCreateService ? '✅' : '❌'}
- 连接验证: ${diagnosis.connectivity.canVerifyConnection ? '✅' : '❌'}
${diagnosis.connectivity.connectionError ? `- 连接错误: ${diagnosis.connectivity.connectionError}` : ''}

## 建议修复
${diagnosis.recommendations.length > 0 
  ? diagnosis.recommendations.map(rec => `- ${rec}`).join('\n')
  : '- 所有配置看起来都正常'
}

## 常见问题解决方案

### 1. SMTP 连接失败
- 检查 SMTP_HOST 是否正确
- 确认 SMTP_PORT 端口是否开放
- 验证防火墙设置

### 2. 认证失败
- 确认 SMTP_USER 和 SMTP_PASS 正确
- 检查邮箱是否启用了 SMTP 服务
- 某些邮件服务商需要应用专用密码

### 3. 邮件发送失败
- 检查收件人邮箱地址格式
- 确认邮件内容不包含垃圾邮件特征
- 验证发送方邮箱域名配置

### 4. Namecheap 企业邮箱配置
- SMTP_HOST: mail.privateemail.com
- SMTP_PORT: 587 (推荐) 或 465
- SMTP_SECURE: false (端口587) 或 true (端口465)
- 确保在 Namecheap 控制面板中启用了 SMTP
`;

    return report.trim();
  }
}

/**
 * 快速诊断函数
 */
export async function quickDiagnose(): Promise<DebugInfo> {
  return EmailServiceDebugger.diagnose();
}

/**
 * 快速测试函数
 */
export async function quickTest(testEmail: string) {
  return EmailServiceDebugger.testEmailSend(testEmail);
}