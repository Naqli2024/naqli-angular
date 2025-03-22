import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService } from '../../../../services/vehicle.service';
import { BusService } from '../../../../services/bus.service';
import { EquipmentService } from '../../../../services/equipment.service';
import { SpecialService } from '../../../../services/special.service';
import { OperatorService } from '../../../../services/partner/operator.service';
import { PartnerService } from '../../../../services/partner/partner.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { faEdit, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Partner } from '../../../../models/partnerData.model';
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
  selector: 'app-unit-management',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './unit-management.component.html',
  styleUrl: './unit-management.component.css',
})

export class UnitManagementComponent implements OnInit {
  showNewUnitForm = false;
  options: string[] = ['All', 'vehicle', 'bus', 'equipment', 'special'];
  formData: FormData = this.initializeFormData();
  classifications: any[] = [];
  subClassifications: any[] = [];
  allData: any[] = [];
  filteredOperators: any[] = [];
  isEditing: boolean = false;
  isSubmitEnabled: boolean = false;
  faEdit = faEdit;
  faTimes = faTimes;
  faCheck = faCheck;
  clickedAddOperator: boolean = false;
  clickedAdd: boolean = false;
  partnerDetails: Partner | null = null;
  selectedUnitType: string = '';
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

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
    private fileService: FileService,
    private translate: TranslateService
  ) {}

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  toggleNewUnitForm() {
    this.showNewUnitForm = !this.showNewUnitForm;
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  openFile(fileName: string) {
    const fileUrl = this.fileService.getFileUrl(fileName);
    window.open(fileUrl, '_blank');
  }

  ngOnInit(): void {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        (partnerDetails) => {
          this.partnerDetails = partnerDetails.data;
          this.formData.partnerName = partnerDetails.data.partnerName;
          this.formData.partnerId = partnerDetails.data._id;
          this.filteredOperators = this.partnerDetails?.operators || []; // Initialize filteredOperators
        },
        (error) => {
          // console.error('Error fetching partner details:', error);
        }
      );
    }
  }

  resetOperatorDetails() {
    this.clickedAddOperator = !this.clickedAddOperator;
    this.clickedAdd = false;
    this.toastr.success('You can add more operators for this unit');
  }

  resetAll() {
    this.clickedAdd = !this.clickedAdd;
    this.clickedAddOperator = false;
  }

  getOperatorStatus(operator): string {
    if (this.partnerDetails?.bookingRequest) {
      const isOperatorBooked = this.partnerDetails.bookingRequest.some(
        (request) => request.assignedOperator?.unit === operator.plateInformation
      );
      return isOperatorBooked ? 'Not available' : 'Available';
    }
    return 'N/A';
  }

  handleSubmit() {
    if (
      !this.formData.unitType ||
      !this.formData.unitClassification ||
      (this.subClassifications && !this.formData.subClassification) ||
      !this.formData.plateInformation ||
      !this.formData.istimaraNo ||
      !this.formData.istimaraCard ||
      !this.formData.pictureOfVehicle ||
      !this.formData.firstName ||
      !this.formData.lastName ||
      !this.formData.email ||
      !this.formData.password ||
      !this.formData.confirmPassword ||
      !this.formData.mobileNo ||
      !this.formData.iqamaNo ||
      !this.formData.dateOfBirth ||
      !this.formData.panelInformation ||
      !this.formData.drivingLicense ||
      // !this.formData.aramcoLicense ||
      !this.formData.nationalID
    ) {
      this.toastr.error(
        'Please fill in all required fields.',
        'Validation Error'
      );
      return;
    }

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
      (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message, 'Success');
        if (this.clickedAddOperator) {
          this.resetOperatorForm();
        } else if (this.clickedAdd) {
          this.resetForm();
        }
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

  onUnitTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedUnitType = target.value;

    this.selectedUnitType = selectedUnitType;
    this.formData.unitType = selectedUnitType;
    this.classifications = [];
    this.subClassifications = [];
    this.allData = [];

    // Handle the case where 'All' is selected
    if (selectedUnitType === 'All') {
      // Show all data without filtering
      this.filteredOperators = this.partnerDetails?.operators || [];
      return;
    }

    // Otherwise, handle specific unit types
    switch (selectedUnitType) {
      case 'vehicle':
        this.vehicleService.getVehicles().subscribe((data: any[]) => {
          this.classifications = data;
          this.allData = data;
          this.filterOperators(selectedUnitType);
        });
        break;
      case 'bus':
        this.busService.getBuses().subscribe((data: any[]) => {
          this.classifications = data;
          this.allData = data;
          this.filterOperators(selectedUnitType);
        });
        break;
      case 'equipment':
        this.equipmentService.getEquipment().subscribe((data: any[]) => {
          this.classifications = data;
          this.allData = data;
          this.filterOperators(selectedUnitType);
        });
        break;
      case 'special':
        this.specialService.getSpecialUnits().subscribe((data: any[]) => {
          this.classifications = data;
          this.allData = data;
          this.filterOperators(selectedUnitType);
        });
        break;
      default:
        this.filteredOperators = [];
    }
    this.isEditing = false;
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
  }

  handleFileInput(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
  
      // File size validation (max 10KB)
      const maxSize = 10 * 1024; // 10 KB
      if (file.size > maxSize) {
        alert('File size exceeds 10KB. Please upload a smaller file.');
        input.value = ''; 
        return;
      }
  
      (this.formData as any)[field] = file;
    }
  }

  filterOperators(unitType: string) {
    if (this.partnerDetails?.operators) {
      this.filteredOperators = this.partnerDetails.operators.filter(
        (operator) => operator.unitType === unitType
      );
    }
  }

  resetForm() {
    const { partnerName, partnerId } = this.formData;

    this.formData = this.initializeFormData();

    // Restore partnerName and partnerId
    this.formData.partnerName = partnerName;
    this.formData.partnerId = partnerId;

    // Manually reset file input elements
    const fileInputs = [
      'istimaraCard',
      'pictureOfVehicle',
      'drivingLicense',
      'aramcoLicense',
      'nationalID',
    ];

    fileInputs.forEach((field) => {
      const input = document.querySelector(
        `input[name=${field}]`
      ) as HTMLInputElement;
      if (input) {
        input.value = ''; // Clear the file input value
      }
    });
    this.showNewUnitForm = !this.showNewUnitForm;
  }

  resetOperatorForm() {
    this.formData.firstName = '';
    this.formData.lastName = '';
    this.formData.email = '';
    this.formData.password = '';
    this.formData.confirmPassword = '';
    this.formData.mobileNo = '';
    this.formData.iqamaNo = '';
    this.formData.dateOfBirth = '';
    this.formData.panelInformation = '';
    this.formData.drivingLicense = null;
    this.formData.aramcoLicense = null;
    this.formData.nationalID = null;

    // Manually reset file input elements
    const fileInputs = ['drivingLicense', 'aramcoLicense', 'nationalID'];

    fileInputs.forEach((field) => {
      const input = document.querySelector(
        `input[name=${field}]`
      ) as HTMLInputElement;
      if (input) {
        input.value = ''; // Clear the file input value
      }
    });
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
