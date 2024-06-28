import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService } from '../../../../../services/vehicle.service';
import { BusService } from '../../../../../services/bus.service';
import { EquipmentService } from '../../../../../services/equipment.service';
import { SpecialService } from '../../../../../services/special.service';
import { OperatorService } from '../../../../../services/partner/operator.service';
import { PartnerService } from '../../../../../services/partner/partner.service';
import { faEdit, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

interface FormData {
  type: string;
  partnerName: string;
  partnerId: string;
  mobileNo: string;
  email: string;
  password: string;
  unitType: string;
  unitClassification: string;
  subClassification: string;
  plateInformation: string;
  istimaraNo: string;
  istimaraCard: File | null;
  pictureOfVehicle: File | null;
  firstName: string;
  lastName: string;
  iqamaNo: string;
  dateOfBirth: string;
  panelInformation: string;
  drivingLicense: File | null;
  aramcoLicense: File | null;
  nationalID: File | null;
}

@Component({
  selector: 'app-operator',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './operator.component.html',
  styleUrl: './operator.component.css'
})
export class OperatorComponent implements OnInit{
  formData: FormData = this.initializeFormData();
  classifications: any[] = [];
  subClassifications: any[] = [];
  allData: any[] = [];
  isEditing: boolean = false;
  originalPartnerName: string = '';
  isSubmitEnabled: boolean = false;
  faEdit = faEdit;
  faTimes = faTimes;
  faCheck = faCheck;

  constructor(
    private router: Router,
    private vehicleService: VehicleService,
    private busService: BusService,
    private equipmentService: EquipmentService,
    private specialService: SpecialService,
    private operatorService: OperatorService,
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    const partnerDetails = this.partnerService.getPartnerDetails();
    if (partnerDetails) {
      this.formData.partnerName = partnerDetails.partnerName;
      this.originalPartnerName = partnerDetails.partnerName;
      this.formData.partnerId = partnerDetails._id;
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    
    // Reset formData.partnerName to originalPartnerName when canceling edits
    if (!this.isEditing) {
      this.formData.partnerName = this.originalPartnerName;
    }
  }

  enableSubmitButton() {
    this.isSubmitEnabled = true;
  }

  savePartnerName() {
    if (this.isEditing) {
      this.partnerService.updatePartnerName(this.formData.partnerId, this.formData.partnerName).subscribe(
        response => {
          console.log('Partner name updated:', response);
          this.partnerService.setPartnerDetails(response);
          this.originalPartnerName = response.partnerName;
          this.isEditing = false;
        },
        error => {
          console.error('Error updating partner name:', error);
        }
      );
    }
  }

  handleSubmit() {
    const formData = new FormData();
    Object.entries(this.formData).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, value as string);
      }
    });

    this.operatorService.addOperator(formData).subscribe(
      response => {
        console.log('Operator added:', response);
        this.router.navigate(['/home/partner/login']);
        this.resetForm();
      },
      error => {
        console.error('Error adding operator:', error);
      }
    );
  }

  initializeFormData(): FormData {
    return {
      type: '',
      partnerName: '',
      partnerId: '',
      mobileNo: '',
      email: '',
      password: '',
      unitType: '', 
      unitClassification: '',
      subClassification: '',
      plateInformation: '',
      istimaraNo: '',
      istimaraCard: null,
      pictureOfVehicle: null,
      firstName: '',
      lastName: '',
      iqamaNo: '',
      dateOfBirth: '',
      panelInformation: '',
      drivingLicense: null,
      aramcoLicense: null,
      nationalID: null
    };
  }

  resetForm() {
    this.formData = this.initializeFormData();
  }

  onUnitTypeChange(unitType: string): void {
    this.formData.unitType = unitType;
    this.classifications = [];
    this.subClassifications = [];
    this.allData = [];

    switch (unitType) {
      case 'vehicle':
        this.vehicleService.getVehicles().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
        });
        break;
      case 'bus':
        this.busService.getBuses().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
        });
        break;
      case 'equipment':
        this.equipmentService.getEquipment().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
        });
        break;
      case 'special':
        this.specialService.getSpecialUnits().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
        });
        break;
    }
  }

  onClassificationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const classificationId = target.value;
    this.formData.unitClassification = classificationId;
    const selectedClassification = this.allData.find(item => item._id === classificationId);
    this.subClassifications = selectedClassification ? selectedClassification.type : [];
  }

  handleFileInput(event: Event, field: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.formData[field] = input.files[0];
    }
  }
}
