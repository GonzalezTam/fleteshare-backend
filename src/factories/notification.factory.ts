import { UserRole } from '@/types/user.types';
import { NotificationTemplate } from '@/types/notification.types';

export class NotificationFactory {
  // Notificaciones de bienvenida
  static createWelcomeNotification(userRole: UserRole): NotificationTemplate {
    switch (userRole) {
      case 'customer':
        return {
          subject: '¡Bienvenido a nuestra plataforma!',
          body: 'Te damos la bienvenida a FleteShare. Para comenzar a usar todos nuestros servicios, debés completar tu perfil con tu dirección de origen. Podés hacerlo desde la sección "Mi Perfil". Una vez que tu perfil esté completo, podrás disfrutar de todas las funcionalidades.',
          type: 'info',
        };

      case 'transporter':
        return {
          subject: '¡Bienvenido a nuestra plataforma!',
          body: 'Te damos la bienvenida a FleteShare. Para comenzar a prestar servicios, debés completar tu perfil con las características de tu vehículo, podes hacerlo desde la sección "Mi Perfil". Además, debes esperar a que podamos validar tu licencia de conducir. Una vez que tu perfil esté completo y validado, podrás disfrutar de todas las funcionalidades.',
          type: 'info',
        };

      case 'admin':
        return {
          subject: '¡Bienvenido al panel administrativo!',
          body: 'Bienvenido al backoffice administrativo de FleteShare. Desde acá podrás ver métricas, gestionar usuarios y demas operaciones de la plataforma.',
          type: 'info',
        };

      default:
        throw new Error('Rol de usuario no válido para notificación de bienvenida');
    }
  }

  static createProfileCompletionNotification(): NotificationTemplate {
    return {
      subject: 'Perfil completado exitosamente',
      body: 'Buenísimo, ahora que completaste los datos de tu perfil ya podés disfrutar de todas las funcionalidades de la plataforma.',
      type: 'success',
    };
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
          body: 'Tu cuenta de transportista ha sido validada correctamente. Si ya completaste tu perfil, ahora podés comenzar a prestar servicios de transporte. ¡Gracias por unirte a FleteShare!',
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
