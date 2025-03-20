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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface FormData {
  type: string;
  partnerName: string;
  partnerId: string;
  mobileNo: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './operator.component.html',
  styleUrl: './operator.component.css',
})
export class OperatorComponent implements OnInit {
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
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  editingOperatorId: string | null = null;

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
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        (partnerDetails) => {
          // Initialize partner-related data
          this.formData.partnerName = partnerDetails.data.partnerName;
          this.formData.partnerId = partnerDetails.data._id;
          this.originalPartnerName = partnerDetails.data.partnerName;
  
          // Check if 'operators' exist and has at least one entry
          if (partnerDetails.data.operators && partnerDetails.data.operators.length > 0) {
            const operatorDetails = partnerDetails.data.operators[0];
  
            // Set form data from the operatorDetails object
            this.formData.unitType = operatorDetails.unitType;
            this.formData.unitClassification = operatorDetails.unitClassification;
            this.formData.subClassification = operatorDetails.subClassification;
            this.formData.plateInformation = operatorDetails.plateInformation;
            this.formData.istimaraNo = operatorDetails.istimaraNo;
  
            // Check if 'operatorsDetail' exists and has at least one entry
            if (operatorDetails.operatorsDetail && operatorDetails.operatorsDetail.length > 0) {
              const operator = operatorDetails.operatorsDetail[0];
              this.formData.firstName = operator.firstName;
              this.formData.lastName = operator.lastName;
              this.formData.email = operator.email;
              this.formData.mobileNo = operator.mobileNo;
              this.formData.iqamaNo = operator.iqamaNo;
              this.formData.dateOfBirth = operator.dateOfBirth ? operator.dateOfBirth.split('T')[0] : ''; 
              this.formData.panelInformation = operator.panelInformation;
            }
  
            // Set edit mode to true since the operator exists
            this.editingOperatorId = partnerDetails.data.operators[0].operatorsDetail[0]._id;
          }
  
          // Enable submit button when data is loaded
          this.enableSubmitButton();
        },
        (error) => {
          // Log error or handle it accordingly
          console.error('Error fetching partner details:', error);
        }
      );
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  enableSubmitButton() {
    if (this.editingOperatorId) {
      this.isSubmitEnabled = true;
    } else {
      this.isSubmitEnabled = !!(
        this.formData.unitType &&
        this.formData.unitClassification &&
        this.formData.plateInformation &&
        this.formData.istimaraNo &&
        this.formData.firstName &&
        this.formData.lastName &&
        this.formData.email &&
        this.formData.password &&
        this.formData.confirmPassword &&
        this.formData.mobileNo &&
        this.formData.iqamaNo &&
        this.formData.dateOfBirth &&
        this.formData.panelInformation &&
        this.formData.drivingLicense &&
        // this.formData.aramcoLicense &&
        this.formData.nationalID
      );
    }
  }

  handleSubmit() {
    const formData = new FormData();
  
    // Loop through formData and append values to FormData object
    Object.entries(this.formData).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);  // Append file fields if it's a File instance
      } else {
        formData.append(key, value as string);  // Append other form data as string
      }
    });
  
    // Append the operatorId when editing
    if (this.editingOperatorId) {
      formData.append('operatorId', this.editingOperatorId);
    }
  
    this.spinnerService.show();
  
    //  EDIT MODE: No validation required
    if (this.editingOperatorId) {
      this.operatorService.editOperator(formData).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message, 'Success');
          this.resetForm();
          this.router.navigate(['/home/partner/login']);
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
        }
      );
    } else {
      // ADD MODE: Apply validation
      if (!this.isFormValid()) {
        this.spinnerService.hide();
        this.toastr.error('All fields are required', 'Error');
        return;
      }
  
      this.operatorService.addOperator(formData).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message, 'Success');
          this.router.navigate(['/home/partner/login']);
          this.resetForm();
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
        }
      );
    }
  }

  onDeleteOperator() {
    if (this.editingOperatorId) {
      this.spinnerService.show();
      this.operatorService.deleteOperator(this.editingOperatorId).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message, "Success")
          this.formData = this.initializeFormData();
          this.editingOperatorId = null;
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
        }
      );
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.unitType &&
      this.formData.unitClassification &&
      this.formData.plateInformation &&
      this.formData.istimaraNo &&
      this.formData.firstName &&
      this.formData.lastName &&
      this.formData.email &&
      this.formData.password &&
      this.formData.confirmPassword &&
      this.formData.mobileNo &&
      this.formData.iqamaNo &&
      this.formData.dateOfBirth &&
      this.formData.panelInformation &&
      this.formData.drivingLicense &&
      // this.formData.aramcoLicense &&
      this.formData.nationalID &&
      this.formData.pictureOfVehicle
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
      confirmPassword: '',
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
      nationalID: null,
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
    const selectedClassification = this.allData.find(
      (item) => item.name === classificationId
    );
    this.subClassifications = selectedClassification
      ? selectedClassification.type
      : [];
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

  getTranslatedName(name: string): string {
    const categories = ['vehicleName', 'busNames', 'equipmentName', 'specialUnits'];
    for (let category of categories) {
      const translationKey = `${category}.${name}`;
      if (this.translate.instant(translationKey) !== translationKey) {
        return this.translate.instant(translationKey);
      }
    }
    return name; 
  }
}
