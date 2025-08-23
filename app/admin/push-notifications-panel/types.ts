// types/notification.ts
export interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface NotificationCreate {
    title: string;
    message: string;
  }
  
  export interface NotificationState extends Notification {
    isVisible: boolean;
    isClosable: boolean;
  }