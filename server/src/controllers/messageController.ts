import { Request, Response } from 'express';
import { Message, IMessage } from '../models/Message.js';
import { Project } from '../models/Project.js';
import { getIsConnected } from '../config/db.js';

interface IMemoryMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const memoryMessages: IMemoryMessage[] = [];

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    // Strict validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Please provide your name.' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Please provide a subject line.' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Please provide a message body.' });
      return;
    }

    const trimmedName = name.trim().slice(0, 100);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim().slice(0, 200);
    const trimmedMessage = message.trim().slice(0, 3000);
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    if (getIsConnected()) {
      const savedMessage = await Message.create({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
        ipAddress,
      });

      res.status(201).json({
        success: true,
        message: 'Thank you! Your message has been sent successfully. Kapil will get back to you soon.',
        data: {
          id: savedMessage._id,
          createdAt: savedMessage.createdAt,
        },
      });
      return;
    }

    // In-memory fallback
    const fallbackMsg: IMemoryMessage = {
      _id: `msg-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      subject: trimmedSubject,
      message: trimmedMessage,
      isRead: false,
      createdAt: new Date(),
    };

    memoryMessages.unshift(fallbackMsg);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been sent successfully. Kapil will get back to you soon.',
      data: {
        id: fallbackMsg._id,
        createdAt: fallbackMsg.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact message. Please try again.',
      error: error.message,
    });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    if (getIsConnected()) {
      const messages = await Message.find().sort({ createdAt: -1 });
      res.json({
        success: true,
        count: messages.length,
        data: messages,
      });
      return;
    }

    res.json({
      success: true,
      count: memoryMessages.length,
      data: memoryMessages,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

export const markMessageAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const msg = await Message.findById(id);
      if (!msg) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      msg.isRead = !msg.isRead;
      await msg.save();

      res.json({ success: true, message: 'Message status updated', data: msg });
      return;
    }

    const item = memoryMessages.find((m) => m._id === id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    item.isRead = !item.isRead;
    res.json({ success: true, message: 'Message status updated', data: item });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update message',
      error: error.message,
    });
  }
};

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (getIsConnected()) {
      const deleted = await Message.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
      }

      res.json({ success: true, message: 'Message deleted successfully' });
      return;
    }

    const index = memoryMessages.findIndex((m) => m._id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }

    memoryMessages.splice(index, 1);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (getIsConnected()) {
      const projectCount = await Project.countDocuments();
      const messageCount = await Message.countDocuments();
      const unreadMessageCount = await Message.countDocuments({ isRead: false });

      res.json({
        success: true,
        data: {
          totalProjects: projectCount,
          totalMessages: messageCount,
          unreadMessages: unreadMessageCount,
          databaseStatus: 'connected',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        totalProjects: 4,
        totalMessages: memoryMessages.length,
        unreadMessages: memoryMessages.filter((m) => !m.isRead).length,
        databaseStatus: 'in-memory (set MONGODB_URI for persistence)',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
};
