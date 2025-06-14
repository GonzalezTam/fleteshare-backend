// @/factories/notification.factory.ts

import { UserType } from '@/types/user.types';
import { NotificationTemplate } from '@/types/notification.types';

export class NotificationFactory {
  // Notificaciones de bienvenida
  static createWelcomeNotification(userRole: UserType): NotificationTemplate {
    switch (userRole) {
      case 'customer':
        return {
          subject: '¡Bienvenido a nuestra plataforma!',
          body: 'Te damos la bienvenida. Para comenzar a usar todos nuestros servicios, te recomendamos completar los datos de tu perfil desde la sección "Mi Perfil".',
          type: 'info',
        };

      case 'transporter':
        return {
          subject: '¡Cuenta creada exitosamente!',
          body: 'Tu cuenta de transportista ha sido creada y está en proceso de validación. Te notificaremos cuando haya sido aprobada y puedas comenzar a usar la plataforma.',
          type: 'info',
        };

      case 'admin':
        return {
          subject: '¡Bienvenido al panel administrativo!',
          body: 'Has accedido al backoffice administrativo. Desde aquí podrás gestionar usuarios, transportistas y todas las operaciones de la plataforma.',
          type: 'info',
        };

      default:
        throw new Error('Rol de usuario no válido para notificación de bienvenida');
    }
  }

  // Notificaciones de validación
  static createAccountValidationNotification(
    status: 'approved' | 'rejected',
    reason?: string
  ): NotificationTemplate {
    switch (status) {
      case 'approved':
        return {
          subject: '¡Cuenta validada exitosamente!',
          body: 'Tu cuenta de transportista ha sido validada correctamente. Ya puedes comenzar a usar todas las funcionalidades de la plataforma.',
          type: 'success',
        };

      case 'rejected':
        return {
          subject: 'Cuenta no validada',
          body: reason
            ? `Tu cuenta de transportista no ha sido validada. Motivo: ${reason}. Puedes contactar con soporte para más información.`
            : 'Tu cuenta de transportista no ha sido validada. Puedes contactar con soporte para más información.',
          type: 'warning',
        };

      default:
        throw new Error('Estado de validación no válido');
    }
  }
}
