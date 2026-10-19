import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';

export const JWT_SECRET = process.env.JWT_SECRET || 'cfd-production-secret-auth-key-2026';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  department: string;
  role: 'admin' | 'manager' | 'user';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Generate signed JWT token (expires in 7 days)
 */
export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Authentication Middleware: Validates JWT token from Bearer header or Cookie
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: '尚未登入或憑證已過期，請重新登入系統',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Verify user still exists in database and is active
    const userRow = db
      .prepare('SELECT id, email, name, department, role, status FROM users WHERE id = ?')
      .get(decoded.id) as any;

    if (!userRow || userRow.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: '該使用者帳號無效或已被停用',
        code: 'USER_INACTIVE',
      });
    }

    req.user = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      department: userRow.department,
      role: userRow.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: '登入驗證無效或憑證已過期，請重新登入',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Optional Authentication Middleware: populates req.user if token is present, but allows visitors through
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      const userRow = db
        .prepare('SELECT id, email, name, department, role, status FROM users WHERE id = ?')
        .get(decoded.id) as any;

      if (userRow && userRow.status === 'active') {
        req.user = {
          id: userRow.id,
          email: userRow.email,
          name: userRow.name,
          department: userRow.department,
          role: userRow.role,
        };
      }
    } catch {
      // Ignore invalid token in optional auth
    }
  }

  next();
}

/**
 * Role-Based Access Control (RBAC) Middleware: Enforces permissions on backend
 */
export function requireRole(allowedRoles: ('admin' | 'manager' | 'user')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '請先登入後再進行操作',
        code: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `權限不足：此項操作僅限【${allowedRoles.join(' 或 ')}】執行`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

/**
 * Record system Audit Log for critical operations
 */
export function recordAuditLog(
  req: Request,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, any>
) {
  try {
    const user = req.user || {
      id: 'system',
      name: '系統訪客',
      role: 'user',
    };

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, user_id, user_name, user_role, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      action,
      entityType,
      entityId,
      user.id,
      user.name,
      user.role,
      JSON.stringify(details),
      ip,
      new Date().toISOString()
    );
  } catch (e) {
    console.error('[Audit Log] Failed to record log:', e);
  }
}
