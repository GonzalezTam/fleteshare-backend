import { Schema, model, Document, Types } from 'mongoose';
import { NotificationType } from '@/types/notification.types';

export interface INotification extends Document {
  subject: string;
  body: string;
  type: NotificationType;
  readed: boolean;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['success', 'warning', 'info'],
      default: 'info',
    },
    readed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null, // Puede ser null si la notificación no está asociada a un usuario específico
      index: true, // Índice para optimizar consultas por userId
      validate: {
        validator: (v: any) => {
          return v === null || Types.ObjectId.isValid(v);
        }, // Validación para permitir null o un ObjectId válido
        message: (props: any) => `${props.value} no es un ID de usuario válido`,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readed: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
