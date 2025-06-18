import { AppType } from '@/types/app.types';

// Determines the type of application based on the origin URL
export const getAppTypeFromOrigin = (origin?: string): AppType => {
  if (!origin) return 'unknown';

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backofficeUrl = process.env.BACKOFFICE_URL || 'http://localhost:5174';

  if (origin === frontendUrl) return 'main';
  if (origin === backofficeUrl) return 'backoffice';

  return 'unknown';
};

// Determines if the user's role is allowed to access the application based on its type
export const isRoleAllowedForApp = (userRole: string, appType: AppType): boolean => {
  if (appType === 'backoffice') return userRole === 'admin';
  if (appType === 'main') return userRole === 'customer' || userRole === 'transporter';
  return false;
};
