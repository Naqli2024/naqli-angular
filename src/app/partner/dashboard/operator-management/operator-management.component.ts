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
import { faEdit, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FileService } from '../../../../services/file.service';

interface FormData {
  type: string;
  partnerName: string;
  partnerId: string;
  mobileNo: string;
  email: string;
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
  imports: [CommonModule, FormsModule, FontAwesomeModule],
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
  showAdditionalFields = false;
  isFormDisabled = false;
  extraOperators: any[] = [];

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
    private fileService: FileService
  ) {}

  ngOnInit(): void {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        (partnerDetails) => {
          this.formData.partnerName = partnerDetails.data.partnerName;
          this.formData.partnerId = partnerDetails.data._id;
          this.extraOperators = partnerDetails.data.extraOperators;
          this.enableSubmitButton();
        },
        (error) => {
          console.error('Error fetching partner details:', error);
        }
      );
    }
  }

  toggleNewUnitForm() {
    this.showNewUnitForm = !this.showNewUnitForm;
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
      this.formData.mobileNo &&
      this.formData.iqamaNo &&
      this.formData.dateOfBirth &&
      this.formData.panelInformation &&
      this.formData.drivingLicense &&
      this.formData.aramcoLicense &&
      this.formData.nationalID
        ? true
        : false;
  }

  handleSubmit() {
    // Define validation errors and messages
    const validationErrors = {
      firstName: 'First Name is required.',
      lastName: 'Last Name is required.',
      email: 'Email is required.',
      mobileNo: 'Mobile No is required.',
      iqamaNo: 'Iqama No is required.',
      dateOfBirth: 'Date of Birth is required.',
      panelInformation: 'Panel Information is required.',
      drivingLicense: 'Driving License is required.',
      aramcoLicense: 'Aramco License is required.',
      nationalID: 'National ID is required.',
    };

    // Find the first invalid field
    const invalidField = Object.keys(validationErrors).find(
      (field) => !this.formData[field]
    );

    if (invalidField) {
      this.toastr.error(validationErrors[invalidField], 'Error');
      return; // Exit if there are validation errors
    }

    const formData = new FormData();
    for (const key in this.formData) {
      if (Object.prototype.hasOwnProperty.call(this.formData, key)) {
        const value = (this.formData as any)[key];
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value as string);
        }
      }
    }

    this.spinnerService.show();
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

  initializeFormData(): FormData {
    return {
      type: '',
      partnerName: '',
      partnerId: '',
      mobileNo: '',
      email: '',
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
}
