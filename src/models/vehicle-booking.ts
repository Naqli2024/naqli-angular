// vehicle.model.ts

export interface TypeOfLoad {
    load: string;
  }
  
  export interface VehicleType {
    typeName: string;
    typeImage: string;
    typeOfLoad: TypeOfLoad[];
    scale?: string;
  }
  
  export interface Vehicle {
    unitType: string;
    name: string;
    type: VehicleType[];
  }