export interface Operator {
  _id: string;
  unitType: string;
  unitClassification: string;
  subClassification?: string;
  plateInformation: string;
  istimaraNo: string;
  istimaraCard: {
    contentType: string;
    fileName: string;
  };
  pictureOfVehicle: {
    contentType: string;
    fileName: string;
  };
  operatorsDetail: Array<{
    firstName: string;
    lastName: string;
    email: string;
    mobileNo: string;
    iqamaNo: string;
    dateOfBirth: Date;
    panelInformation: string;
    drivingLicense: {
      contentType: string;
      fileName: string;
    };
    aramcoLicense: {
      contentType: string;
      fileName: string;
    };
    nationalID: {
      contentType: string;
      fileName: string;
    };
    status: string;
    _id: string;
  }>;
  bookingRequest: Array<{
    bookingId: string;
    quotePrice?: number;
    paymentStatus?: string;
    bookingStatus?: string;
  }>;
  }