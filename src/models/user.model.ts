import { Notification } from './notification.model';

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    contactNumber: number;
    alternateNumber?: number;
    address1: string;
    address2?: string;
    city: string;
    accountType: string;
    govtId: string;
    idNumber: number;
    resetOTP?: string;
    otpExpiry?: Date;
    isAdmin: boolean;
    isBlocked: boolean;
    isSuspended: boolean;
    isVerified: boolean;
    notifications: Notification[];
    lastNotification:  Notification | null;
    createdAt: string;
    updatedAt: string;
    selected?:boolean
  }
