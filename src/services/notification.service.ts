import mongoose from 'mongoose';
import { UserType } from '@/types/user.types';
import { Notification } from '@/models/Notification.model';
import { NotificationFactory } from '@/factories/notification.factory';
import {
  NotificationTemplate,
  NotificationQuery,
  NotificationCreateRequest,
} from '@/types/notification.types';

export const getNotificationsService = async (query: NotificationQuery) => {
  const userId = query?.userId;
  if (userId && !mongoose.Types.ObjectId.isValid(userId)) throw new Error('ID de usuario inválido');
  const { readed, page, limit } = query;

  let filters: any = { userId };
  if (readed !== undefined) filters.readed = readed === 'true';

  const currentPage = parseInt(page?.toString() || '1');
  const itemsPerPage = parseInt(limit?.toString() || '10');
  const skip = (currentPage - 1) * itemsPerPage;

  const [notifications, totalItems, unreadCount, allCount] = await Promise.all([
    Notification.find(filters).sort({ createdAt: -1 }).skip(skip).limit(itemsPerPage),
    Notification.countDocuments(filters),
    Notification.countDocuments({ userId, readed: false }),
    Notification.countDocuments({ userId }),
  ]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    notifications,
    count: {
      unread: unreadCount,
      all: allCount,
    },
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
    },
  };
};

export const markNotificationAsReadService = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de notificación inválido');
  const notification = await Notification.findById(id);
  if (!notification) throw new Error('Notificación no encontrada');
  if (notification.readed) throw new Error('La notificación ya está marcada como leída');

  const updatedNotification = await Notification.findByIdAndUpdate(
    id,
    { readed: true },
    { new: true }
  );
  return updatedNotification;
};

export const deleteNotificationService = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('ID de notificación inválido');

  const notification = await Notification.findById(id);
  if (!notification) throw new Error('Notificación no encontrada');

  await Notification.findByIdAndDelete(id);
  return notification;
};

export const createNotificationService = async (data: NotificationCreateRequest) => {
  const userId = data?.userId;
  let template: NotificationTemplate = data?.template;

  if (!template || !template.subject || !template.body)
    throw new Error('Template de notificación inválido');

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error('ID de usuario inválido');
    template = {
      ...template,
      userId,
    };
  }

  const notification = new Notification(template);
  await notification.save();
  return notification;
};

export const createWelcomeNotification = async (userId: string, userRole: UserType) => {
  const template = NotificationFactory.createWelcomeNotification(userRole);
  return await createNotificationService({ template, userId });
};

export const createProfileCompletionNotification = async (userId: string) => {
  const template = NotificationFactory.createProfileCompletionNotification();
  return await createNotificationService({ template, userId });
};

export const createValidationNotification = async (
  userId: string,
  status: 'approved' | 'rejected',
  reason?: string
) => {
  const template = NotificationFactory.createAccountValidationNotification(status, reason);
  return await createNotificationService({ template, userId });
};
