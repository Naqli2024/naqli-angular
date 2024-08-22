export interface Operator {
    unitType: string;
    unitClassification: string;
    subClassification?: string;
    plateInformation: string;
    istimaraNo: string;
    istimaraCard: {
      data: any;
      contentType: string;
    };
    pictureOfVehicle: {
      data: any;
      contentType: string;
    };
    firstName: string;
    lastName: string;
    email: string;
    mobileNo: string;
    iqamaNo: string;
    dateOfBirth: Date;
    drivingLicense: {
      data: any;
      contentType: string;
    };
    aramcoLicense: {
      data: any;
      contentType: string;
    };
    nationalID: {
      data: any;
      contentType: string;
    };
    bookingRequest: Array<{
      bookingId: string;
      quotePrice?: number;
      paymentStatus?: string;
      bookingStatus?: string;
    }>;
  }