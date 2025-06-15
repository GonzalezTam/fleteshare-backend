export type NotificationType = 'success' | 'warning' | 'info';

export interface NotificationCreateRequest {
  template: NotificationTemplate;
  userId?: string | null; // Optional, if not provided, the notification is created without a specific user
}

export interface NotificationQuery {
  userId?: string; // Optional, if not provided, the query will not filter by user
  readed?: string; // 'true' | 'false'
  page?: string | number;
  limit?: string | number;
}

export interface NotificationTemplate {
  userId?: string | null; // Optional, if not provided, the notification is created without a specific user
  subject: string;
  body: string;
  type: NotificationType;
}
