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