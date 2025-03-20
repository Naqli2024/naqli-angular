import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleService } from '../../../../services/vehicle.service';
import { BusService } from '../../../../services/bus.service';
import { EquipmentService } from '../../../../services/equipment.service';
import { SpecialService } from '../../../../services/special.service';
import { OperatorService } from '../../../../services/partner/operator.service';
import { PartnerService } from '../../../../services/partner/partner.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OperatorModalComponent } from './operator-modal/operator-modal.component';
import {
  faEdit,
  faTimes,
  faCheck,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FileService } from '../../../../services/file.service';
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
  selector: 'app-operator-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './operator-management.component.html',
  styleUrl: './operator-management.component.css',
})
export class OperatorManagementComponent {
  showNewUnitForm = false;
  formData: FormData = this.initializeFormData();
  classifications: any[] = [];
  subClassifications: any[] = [];
  allData: any[] = [];
  isEditing = false;
  isSubmitEnabled = false;
  accessTo: any[] = [];
  selectedItems: string[] = [];
  faEdit = faEdit;
  faTimes = faTimes;
  faCheck = faCheck;
  faTrashAlt = faTrashAlt;
  showAdditionalFields = false;
  isFormDisabled = false;
  extraOperators: any[] = [];
  allOperators: any[] = [];
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
    private modalService: NgbModal,
    private fileService: FileService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const partnerId = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        (partnerDetails) => {
          this.formData.partnerName = partnerDetails.data.partnerName;
          this.formData.partnerId = partnerDetails.data._id;

          // Collect operatorsDetail and extraOperators
          let allOperatorsDetail = [];
          if (
            partnerDetails.data.operators &&
            partnerDetails.data.operators.length > 0
          ) {
            partnerDetails.data.operators.forEach((operator) => {
              if (
                operator.operatorsDetail &&
                operator.operatorsDetail.length > 0
              ) {
                allOperatorsDetail = allOperatorsDetail.concat(
                  operator.operatorsDetail
                );
              }
            });
          }

          this.extraOperators = partnerDetails.data.extraOperators;

          // Combine operatorsDetail with extraOperators
          this.allOperators = [...allOperatorsDetail, ...this.extraOperators];
          this.enableSubmitButton();
        },
        (error) => {
          // console.error('Error fetching partner details:', error);
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

  toggleNewUnitForm() {
    this.showNewUnitForm = !this.showNewUnitForm;

    const previousPartnerId = this.formData.partnerId;
    const previousPartnerName =  this.formData.partnerName;

    // Clear the form data when adding a new operator
    if (this.showNewUnitForm) {
      this.formData = {
        firstName: '',
        lastName: '',
        mobileNo: '',
        iqamaNo: '',
        dateOfBirth: '',
        panelInformation: '',
        drivingLicense: null,
        aramcoLicense: null,
        partnerId: previousPartnerId ?? '',
        email: '',
        password: '',
        confirmPassword: '',
        nationalID: null,
        type: '',
        partnerName: previousPartnerName ?? '',
        unitType: '',
        unitClassification: '',
        subClassification: '',
      };
      this.editingOperatorId = null;
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  addNewForm() {
    this.formData = this.initializeFormData();
    this.enableSubmitButton();
  }

  openFile(fileName: string) {
    const fileUrl = this.fileService.getFileUrl(fileName);
    window.open(fileUrl, '_blank');
  }

  enableSubmitButton() {
    this.isSubmitEnabled =
      this.formData.unitType &&
      this.formData.unitClassification &&
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
        ? true
        : false;
  }

  handleSubmit() {
    const validationErrors = {
      firstName: 'First Name is required.',
      lastName: 'Last Name is required.',
      email: 'Email is required.',
      password: 'Password is required',
      confirmPassword: 'Confirm Password is required.',
      mobileNo: 'Mobile No is required.',
      iqamaNo: 'Iqama No is required.',
      dateOfBirth: 'Date of Birth is required.',
      panelInformation: 'Panel Information is required.',
      drivingLicense: 'Driving License is required.',
      nationalID: 'National ID is required.',
    };
  
    // Find the first invalid field
    const invalidField = Object.keys(validationErrors).find(
      (field) => !this.formData[field] && field !== 'password' && field !== 'confirmPassword'
    );
  
    // Handle validation for required files (only if not in editing mode)
    if (!this.editingOperatorId) {
      if (!this.formData.drivingLicense || !this.formData.nationalID) {
        this.toastr.error('Please upload required documents (Driving License, National ID).', 'Error');
        return; // Exit if there are missing required documents
      }
  
      if (this.formData.password !== this.formData.confirmPassword) {
        this.toastr.error('Passwords do not match.', 'Error');
        return; // Exit if passwords do not match
      }
    }
  
    // If there is an invalid field, show the error message and stop submission
    if (invalidField) {
      this.toastr.error(validationErrors[invalidField], 'Error');
      return;
    }
  
    // Create a FormData object for file uploads
    const formData = new FormData();
    for (const key in this.formData) {
      if (Object.prototype.hasOwnProperty.call(this.formData, key)) {
        const value = this.formData[key];
        if (value instanceof File) {
          formData.append(key, value); // Append file fields
        } else {
          formData.append(key, value as string); // Append other form data
        }
      }
    }  

    // Show the loading spinner
    this.spinnerService.show();
  
    if (this.editingOperatorId) {
      // Edit operator
      this.operatorService.editOperator(formData).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message, 'Success');
          this.showNewUnitForm = false;
          this.resetForm();
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
        }
      );
    } else {
      // Add new operator
      this.operatorService.addExtraOperator(formData).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message, 'Success');
          this.showNewUnitForm = false;
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

    switch (unitType) {
      case 'vehicle':
        this.vehicleService.getVehicles().subscribe((data: any[]) => {
          this.classifications = data;
          this.allData = data;
        });
        break;
      case 'bus':
        this.busService.getBuses().subscribe((data: any[]) => {
          this.classifications = data;
          this.allData = data;
        });
        break;
      case 'equipment':
        this.equipmentService.getEquipment().subscribe((data: any[]) => {
          this.classifications = data;
          this.allData = data;
        });
        break;
      case 'special':
        this.specialService.getSpecialUnits().subscribe((data: any[]) => {
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
      (this.formData as any)[field] = input.files[0];
    }
  }

  handleClick() {
    this.openOperatorModal();
  }

  openOperatorModal(): void {
    const modalRef = this.modalService.open(OperatorModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
  }

  resetForm() {
    // Reset formData to its initial state
    this.formData = this.initializeFormData();
    // Hide the form
    this.showNewUnitForm = false;
    this.showAdditionalFields = false; // Uncheck the checkbox
  }

  getTranslatedName(name: string): string {
    const categories = [
      'vehicleName',
      'busNames',
      'equipmentName',
      'specialUnits',
    ];
    for (let category of categories) {
      const translationKey = `${category}.${name}`;
      if (this.translate.instant(translationKey) !== translationKey) {
        return this.translate.instant(translationKey);
      }
    }
    return name;
  }

  deleteOperator(operatorId: string): void {
    // Translate the confirmation message
    this.translate.get('confirmDelete').subscribe((message: string) => {
      if (confirm(message)) {
        this.operatorService.deleteOperator(operatorId).subscribe({
          next: (res) => {
            this.toastr.success(
              res.message || 'Operator deleted successfully.'
            );
            this.allOperators = this.allOperators.filter(
              (op) => op._id !== operatorId
            );
          },
          error: (error) => {
            console.error('Error deleting operator:', error);
            this.toastr.error(
              error.error?.message || 'Failed to delete the operator.'
            );
          },
        });
      }
    });
  }

  editOperator(operator: any): void {
    const { password, ...operatorWithoutPassword } = operator;
  
    // Preserve the previous partnerId
    const previousPartnerId = this.formData.partnerId;
  
    // Update form data with the new operator details
    this.formData = { 
      ...operatorWithoutPassword, 
      partnerId: previousPartnerId ?? '',  // Append previous partnerId
      operatorId: operator._id  // Assign the correct operatorId
    };
  
    this.editingOperatorId = operator._id;
    this.showNewUnitForm = true;
  }
}
