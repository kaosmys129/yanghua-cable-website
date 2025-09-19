/**
 * 环境变量安全检查和管理工具
 * 用于验证和保护敏感环境变量
 */

// 敏感环境变量模式
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /key/i,
  /token/i,
  /api_key/i,
  /private/i,
  /credential/i,
  /auth/i
];

// 必需的环境变量
const REQUIRED_ENV_VARS = {
  development: [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_STRAPI_URL'
  ],
  production: [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_STRAPI_URL',
    'JWT_SECRET',
    'DATABASE_URL'
  ]
};

// 环境变量验证规则类型
interface ValidationRule {
  pattern?: RegExp;
  minLength?: number;
  message: string;
}

// 环境变量验证规则
const ENV_VALIDATION_RULES: Record<string, ValidationRule> = {
  'NEXT_PUBLIC_SITE_URL': {
    pattern: /^https?:\/\/.+/,
    message: 'SITE_URL 必须是有效的HTTP/HTTPS URL'
  },
  'NEXT_PUBLIC_STRAPI_URL': {
    pattern: /^https?:\/\/.+/,
    message: 'STRAPI_URL 必须是有效的HTTP/HTTPS URL'
  },
  'JWT_SECRET': {
    minLength: 32,
    message: 'JWT_SECRET 长度至少32个字符'
  },
  'DATABASE_URL': {
    pattern: /^(postgresql|mysql|sqlite):\/\/.+/,
    message: 'DATABASE_URL 必须是有效的数据库连接字符串'
  }
};

interface EnvSecurityReport {
  isSecure: boolean;
  issues: string[];
  warnings: string[];
  missingRequired: string[];
  exposedSecrets: string[];
}

/**
 * 检查环境变量是否为敏感信息
 */
function isSensitiveVar(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * 验证环境变量值
 */
function validateEnvVar(key: string, value: string): string[] {
  const issues: string[] = [];
  const rule = ENV_VALIDATION_RULES[key];
  
  if (!rule) return issues;

  // 检查最小长度
  if (rule.minLength && value.length < rule.minLength) {
    issues.push(`${key}: ${rule.message}`);
  }

  // 检查模式匹配
  if (rule.pattern && !rule.pattern.test(value)) {
    issues.push(`${key}: ${rule.message}`);
  }

  return issues;
}

/**
 * 检查是否有敏感信息暴露在客户端
 */
function checkClientExposure(): string[] {
  const exposed: string[] = [];
  
  // 检查所有以 NEXT_PUBLIC_ 开头的环境变量
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_') && isSensitiveVar(key)) {
      exposed.push(key);
    }
  });

  return exposed;
}

/**
 * 检查弱密码或密钥
 */
function checkWeakSecrets(): string[] {
  const weak: string[] = [];
  const commonWeakValues = [
    'password',
    '123456',
    'secret',
    'admin',
    'test',
    'development',
    'changeme'
  ];

  Object.entries(process.env).forEach(([key, value]) => {
    if (isSensitiveVar(key) && value) {
      // 检查是否为常见弱密码
      if (commonWeakValues.includes(value.toLowerCase())) {
        weak.push(`${key}: 使用了常见弱密码`);
      }
      
      // 检查长度
      if (value.length < 8) {
        weak.push(`${key}: 密码长度过短（少于8个字符）`);
      }
      
      // 检查复杂度（对于密码类变量）
      if (key.toLowerCase().includes('password')) {
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        const complexity = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
        if (complexity < 3) {
          weak.push(`${key}: 密码复杂度不足（建议包含大小写字母、数字和特殊字符）`);
        }
      }
    }
  });

  return weak;
}

/**
 * 执行环境变量安全检查
 */
export function performSecurityCheck(): EnvSecurityReport {
  const environment = process.env.NODE_ENV || 'development';
  const requiredVars = REQUIRED_ENV_VARS[environment as keyof typeof REQUIRED_ENV_VARS] || [];
  
  const issues: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  
  // 检查必需的环境变量
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    } else {
      // 验证环境变量值
      const validationIssues = validateEnvVar(varName, process.env[varName]!);
      issues.push(...validationIssues);
    }
  });

  // 检查客户端暴露的敏感信息
  const exposedSecrets = checkClientExposure();
  
  // 检查弱密码
  const weakSecrets = checkWeakSecrets();
  warnings.push(...weakSecrets);

  // 生产环境特殊检查
  if (environment === 'production') {
    // 检查是否还在使用开发环境的默认值
    const devDefaults = [
      { key: 'JWT_SECRET', value: 'your-secret-key' },
      { key: 'DATABASE_URL', value: 'postgresql://localhost:5432/dev' }
    ];
    
    devDefaults.forEach(({ key, value }) => {
      if (process.env[key] === value) {
        issues.push(`${key}: 生产环境仍在使用开发默认值`);
      }
    });

    // 检查调试模式
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production') {
      warnings.push('生产环境检测到调试模式开启');
    }
  }

  const isSecure = issues.length === 0 && missingRequired.length === 0 && exposedSecrets.length === 0;

  return {
    isSecure,
    issues,
    warnings,
    missingRequired,
    exposedSecrets
  };
}

/**
 * 安全地获取环境变量
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`环境变量 ${key} 未设置`);
  }
  
  return value;
}

/**
 * 安全地获取敏感环境变量（不记录到日志）
 */
export function getSecretEnvVar(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`敏感环境变量 ${key} 未设置`);
  }
  
  return value;
}

/**
 * 生成环境变量安全报告
 */
export function generateSecurityReport(): string {
  const report = performSecurityCheck();
  
  let output = '\n=== 环境变量安全检查报告 ===\n';
  output += `环境: ${process.env.NODE_ENV || 'development'}\n`;
  output += `检查时间: ${new Date().toISOString()}\n`;
  output += `安全状态: ${report.isSecure ? '✅ 安全' : '❌ 存在问题'}\n\n`;
  
  if (report.missingRequired.length > 0) {
    output += '❌ 缺失必需环境变量:\n';
    report.missingRequired.forEach(var_ => {
      output += `  - ${var_}\n`;
    });
    output += '\n';
  }
  
  if (report.exposedSecrets.length > 0) {
    output += '🚨 客户端暴露的敏感信息:\n';
    report.exposedSecrets.forEach(var_ => {
      output += `  - ${var_}\n`;
    });
    output += '\n';
  }
  
  if (report.issues.length > 0) {
    output += '❌ 配置问题:\n';
    report.issues.forEach(issue => {
      output += `  - ${issue}\n`;
    });
    output += '\n';
  }
  
  if (report.warnings.length > 0) {
    output += '⚠️  安全警告:\n';
    report.warnings.forEach(warning => {
      output += `  - ${warning}\n`;
    });
    output += '\n';
  }
  
  if (report.isSecure) {
    output += '✅ 所有检查通过，环境变量配置安全。\n';
  } else {
    output += '❌ 请修复上述问题以确保安全性。\n';
  }
  
  return output;
}

/**
 * 在应用启动时执行安全检查
 */
export function initSecurityCheck(): void {
  // 只在开发环境或明确启用时执行检查
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_ENV_SECURITY_CHECK === 'true') {
    const report = performSecurityCheck();
    
    if (!report.isSecure) {
      console.warn(generateSecurityReport());
      
      // 在开发环境中，如果有严重问题可以选择退出
      if (process.env.NODE_ENV === 'development' && report.missingRequired.length > 0) {
        console.error('❌ 缺失必需环境变量，应用可能无法正常运行');
      }
    } else {
      console.log('✅ 环境变量安全检查通过');
    }
  }
}

// 在模块加载时自动执行检查
if (typeof window === 'undefined') {
  initSecurityCheck();
}