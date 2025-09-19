/**
 * 认证和授权中间件
 * 用于API路由的权限控制和安全验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// 认证配置
const AUTH_CONFIG = {
  // API密钥前缀
  API_KEY_PREFIX: 'Bearer ',
  // 会话超时时间（毫秒）
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24小时
  // 速率限制配置
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100, // 最大请求数
    skipSuccessfulRequests: false
  },
  // 受保护的路由模式
  PROTECTED_ROUTES: [
    '/api/admin/*',
    '/api/private/*',
    '/api/user/profile',
    '/api/orders/*'
  ],
  // 公开路由（不需要认证）
  PUBLIC_ROUTES: [
    '/api/health',
    '/api/public/*',
    '/api/products',
    '/api/categories',
    '/api/contact'
  ]
};

// 用户角色定义
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// 权限级别
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

// 用户信息接口
interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  lastActivity: Date;
}

// JWT载荷接口
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

// 速率限制存储（生产环境应使用Redis）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 验证API密钥
 */
function validateApiKey(apiKey: string): boolean {
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  return validApiKeys.includes(apiKey);
}

/**
 * 验证JWT令牌
 */
async function validateJWT(token: string): Promise<JWTPayload | null> {
  try {
    // 这里应该使用实际的JWT验证库，如 jsonwebtoken
    // 为了演示，这里使用简化的验证逻辑
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET 未配置');
      return null;
    }

    // 实际项目中应该使用 jwt.verify(token, secret)
    // 这里仅作为示例
    const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
    
    // 检查令牌是否过期
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT验证失败:', error);
    return null;
  }
}

/**
 * 检查速率限制
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = AUTH_CONFIG.RATE_LIMIT.windowMs;
  const maxRequests = AUTH_CONFIG.RATE_LIMIT.maxRequests;

  const clientData = rateLimitStore.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    // 重置或初始化计数器
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (clientData.count >= maxRequests) {
    return false;
  }

  // 增加请求计数
  clientData.count++;
  rateLimitStore.set(clientId, clientData);
  return true;
}

/**
 * 获取客户端标识符
 */
function getClientId(request: NextRequest): string {
  // 优先使用真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';
  
  // 结合用户代理创建更唯一的标识符
  const userAgent = request.headers.get('user-agent') || '';
  return `${ip}-${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;
}

/**
 * 检查路由是否需要保护
 */
function isProtectedRoute(pathname: string): boolean {
  return AUTH_CONFIG.PROTECTED_ROUTES.some(pattern => {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(pathname);
  });
}

/**
 * 检查路由是否为公开路由
 */
function isPublicRoute(pathname: string): boolean {
  return AUTH_CONFIG.PUBLIC_ROUTES.some(pattern => {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(pathname);
  });
}

/**
 * 检查用户权限
 */
function hasPermission(user: JWTPayload, requiredPermission: Permission): boolean {
  // 管理员拥有所有权限
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // 检查具体权限
  return user.permissions.includes(requiredPermission);
}

/**
 * 认证中间件
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // 跳过静态资源和Next.js内部路由
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // 静态文件
  ) {
    return null;
  }

  // 公开路由直接通过
  if (isPublicRoute(pathname)) {
    return null;
  }

  // 速率限制检查
  const clientId = getClientId(request);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil(AUTH_CONFIG.RATE_LIMIT.windowMs / 1000)
      },
      { status: 429 }
    );
  }

  // 受保护路由需要认证
  if (isProtectedRoute(pathname)) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: '缺少认证信息'
        },
        { status: 401 }
      );
    }

    // 检查API密钥认证
    if (authHeader.startsWith(AUTH_CONFIG.API_KEY_PREFIX)) {
      const apiKey = authHeader.slice(AUTH_CONFIG.API_KEY_PREFIX.length);
      
      if (!validateApiKey(apiKey)) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: '无效的API密钥'
          },
          { status: 401 }
        );
      }
    }
    // 检查JWT认证
    else if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = await validateJWT(token);
      
      if (!payload) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: '无效或过期的令牌'
          },
          { status: 401 }
        );
      }

      // 检查管理员路由权限
      if (pathname.startsWith('/api/admin/') && payload.role !== UserRole.ADMIN) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: '权限不足'
          },
          { status: 403 }
        );
      }

      // 将用户信息添加到请求头中，供API路由使用
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));

      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    }
    else {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: '无效的认证格式'
        },
        { status: 401 }
      );
    }
  }

  return null;
}

/**
 * 从请求头中获取当前用户信息
 */
export async function getCurrentUser(): Promise<Partial<User> | null> {
  try {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const userRole = headersList.get('x-user-role') as UserRole;
    const userPermissions = headersList.get('x-user-permissions');

    if (!userId || !userRole) {
      return null;
    }

    return {
      id: userId,
      role: userRole,
      permissions: userPermissions ? JSON.parse(userPermissions) : []
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 权限检查装饰器
 */
export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const user = await getCurrentUser();
      
      if (!user || !hasPermission(user as JWTPayload, permission)) {
        throw new Error('权限不足');
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 清理过期的速率限制记录
 */
setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(clientId);
    }
  }
}, 5 * 60 * 1000); // 每5分钟清理一次