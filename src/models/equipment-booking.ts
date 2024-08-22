export interface Equipment {
    name: string;
    unitType: string;
    type: EquipmentType[];
  }
  
  export interface EquipmentType {
    typeName: string;
    typeImage: string;
  }