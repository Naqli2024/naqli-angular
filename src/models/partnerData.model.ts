import { Operator } from './operator.model';
import { Notification } from './notification.model';
import { BookingRequest } from './bookingRequest.model';
import { ExtraOperator } from './extraOperators.model';


export interface PartnerResponse {
    partner: {
      type: string;
      partnerName: string;
      mobileNo: string;
      email: string;
      password: string;
      resetOTP: string;
      otpExpiry: string;
      isAdmin: boolean;
      isVerified: boolean;
      operators: any[]; 
      _id: string;
    };
}

export interface Partner {
  _id: string;
  type: string;
  partnerName: string;
  mobileNo: string;
  email: string;
  isAdmin: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  isSuspended: boolean;
  operators: Operator[];
  notifications: Notification[];
  lastNotification: Notification | null;
  createdAt: string;
  updatedAt: string;
  selected?:boolean;
  bookingRequest: BookingRequest[];
  extraOperators: ExtraOperator[]; 
  partnerProfile: {
    contentType: string;
    fileName: string;
  }
}
