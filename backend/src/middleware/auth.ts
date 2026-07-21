import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userRepository } from '../utils/db';

const JWT_SECRET = process.env.JWT_SECRET || 'samiq-jwt-secret-key-12345';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'employee';
    name: string;
    orgId?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'admin' | 'employee';
      name: string;
      orgId?: string;
    };

    // Verify user still exists in database using repository
    const userExists = await userRepository.findById(decoded.id);
    if (!userExists) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = {
      id: userExists.id,
      email: userExists.email,
      role: userExists.role,
      name: userExists.name,
      orgId: userExists.orgId
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (role: 'admin' | 'employee') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: Access requires ${role} privileges` });
    }

    next();
  };
};
