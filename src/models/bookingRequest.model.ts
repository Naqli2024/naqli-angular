export interface AssignedOperator {
    unit: string;
    operatorName: string;
  }
  
  export interface BookingRequest {
    bookingId: string;
    quotePrice: number;
    _id: string;
    paymentStatus: string;
    assignedOperator: AssignedOperator;
  }