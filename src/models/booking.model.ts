export interface Booking {
    _id: string;
    name: string;
    type: { typeName: string }; 
    image: string;
    pickup: string;
    dropPoints: string[];
    productValue: number;
    date: string;
    time: string;
    additionalLabour: number;
    bookingStatus: String;
    user: string; 
    paymentAmount: number;
    paymentStatus: string;
    remainingBalance?: number;
    address: string;
    zipCode: string;
    cityName: string;
    fromTime: string;
    toTime: string;
    unitType: string;
    partner: string;
    adminCommission: number;
    payout: number;
    initialPayout: number;
    additionalCharges: number;
    additionalChargesReason: string[];
    finalPayout: number;
    createdAt: string;
    shipmentType: string;
    shippingCondition: string;
    cargoLength: string;
    cargoBreadth: string;
    cargoHeight: string;
    cargoUnit: string;
    shipmentWeight: string,
    initialPaid: boolean,
    finalPaid: boolean
  }

  