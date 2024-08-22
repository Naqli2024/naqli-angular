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
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../services/spinner.service';

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
    private partnerService: PartnerService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
  ) {}

  ngOnInit(): void {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        partnerDetails => {
          this.formData.partnerName = partnerDetails.data.partnerName;
          this.formData.partnerId = partnerDetails.data._id;
          this.originalPartnerName = partnerDetails.data.partnerName;
          this.enableSubmitButton();
        },
        error => {
          console.error('Error fetching partner details:', error);
        }
      );
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  enableSubmitButton() {
    console.log(this.formData)
    this.isSubmitEnabled = !!(
      this.formData.unitType &&
      this.formData.unitClassification &&
      this.formData.plateInformation &&
      this.formData.istimaraNo &&
      this.formData.firstName &&
      this.formData.lastName &&
      this.formData.email &&
      this.formData.mobileNo &&
      this.formData.iqamaNo &&
      this.formData.dateOfBirth &&
      this.formData.panelInformation &&
      this.formData.drivingLicense &&
      this.formData.aramcoLicense &&
      this.formData.nationalID
    );
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

    this.spinnerService.show();
    this.operatorService.addOperator(formData).subscribe(
      response => {
        this.spinnerService.hide();
        this.toastr.success(response.message, 'Success');
        this.router.navigate(['/home/partner/login']);
        this.resetForm();
      },
      error => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
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

  onUnitTypeChange(unitType: string): void {
    this.formData.unitType = unitType;
    this.classifications = [];
    this.subClassifications = [];
    this.allData = [];

    // Reset isEditing flag when changing unitType
    this.isEditing = false;

    switch (unitType) {
      case 'vehicle':
        this.vehicleService.getVehicles().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
          this.enableSubmitButton();
        });
        break;
      case 'bus':
        this.busService.getBuses().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
          this.enableSubmitButton();
        });
        break;
      case 'equipment':
        this.equipmentService.getEquipment().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
          this.enableSubmitButton();
        });
        break;
      case 'special':
        this.specialService.getSpecialUnits().subscribe((data: any) => {
          this.classifications = data;
          this.allData = data;
          this.enableSubmitButton();
        });
        break;
    }
  }

  onClassificationChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const classificationId = target.value;
    this.formData.unitClassification = classificationId;
    const selectedClassification = this.allData.find(item => item.name === classificationId);
    this.subClassifications = selectedClassification ? selectedClassification.type : [];
    this.enableSubmitButton();
  }

  handleFileInput(event: Event, field: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.formData[field] = input.files[0];
      this.enableSubmitButton();
    }
  }

  resetForm() {
    this.formData = this.initializeFormData();
    this.isSubmitEnabled = false;
  }
}
