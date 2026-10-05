export type NotificationReadItem = { id: string; read: boolean }

export function unreadNotificationCount<T extends NotificationReadItem>(notifications: readonly T[]): number {
  return notifications.reduce((count, notification) => count + Number(!notification.read), 0)
}

export function setNotificationRead<T extends NotificationReadItem>(
  notifications: readonly T[],
  notificationId: string,
  read: boolean,
): T[] {
  return notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, read } : notification,
  )
}
