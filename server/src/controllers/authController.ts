import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getIsConnected } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both username and password.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_dev_secret_change_in_production';
    const cleanUsername = String(username).trim().toLowerCase();

    // 1. Check MongoDB if connected
    if (getIsConnected()) {
      const user = await User.findOne({
        $or: [{ username: cleanUsername }, { email: cleanUsername }],
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your username and password.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your username and password.',
        });
        return;
      }

      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          role: user.role,
        },
        secret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Admin authentication successful',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        },
      });
      return;
    }

    // 2. Fallback mode: Check against environment variables
    const envAdminUser = (process.env.ADMIN_USERNAME || 'kapiladmin').toLowerCase();
    const envAdminPass = process.env.ADMIN_PASSWORD || 'KapilDev@2026';

    if (cleanUsername === envAdminUser && password === envAdminPass) {
      const token = jwt.sign(
        {
          id: 'admin-mem-1',
          username: envAdminUser,
          role: 'admin',
        },
        secret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Admin authentication successful (fallback environment mode)',
        data: {
          token,
          user: {
            id: 'admin-mem-1',
            username: envAdminUser,
            email: process.env.ADMIN_EMAIL || 'kapil.shah@example.com',
            role: 'admin',
          },
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid credentials.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication error occurred',
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (getIsConnected()) {
      const user = await User.findById(req.user.id).select('-password');
      if (user) {
        res.json({ success: true, data: user });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        email: process.env.ADMIN_EMAIL || 'kapil.shah@example.com',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
    });
  }
};
