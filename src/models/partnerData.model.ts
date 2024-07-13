import { Operator } from './operator.model';

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
  operators: Operator[];
  createdAt: string;
  updatedAt: string;
}