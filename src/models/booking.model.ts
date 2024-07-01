export interface Booking {
    _id: string;
    name: string;
    type: any[]; 
    image: string;
    pickup: string;
    dropPoints: string[];
    productValue: number;
    date: string;
    time: string;
    additionalLabour: number;
    user: string; 
    paymentAmount: number;
    paymentStatus: string;
    remainingBalance?: number;
    address: string;
    zipCode: string;
    cityName: string;
    fromTime: string;
    toTime: string;
  }

  