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
  selector: 'app-unit-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unit-management.component.html',
  styleUrl: './unit-management.component.css',
})

export class UnitManagementComponent implements OnInit{
  showNewUnitForm = false;
  options: string[] = ['Select', 'Vehicle', 'Bus', 'Equipment', 'Special'];
  formData: FormData[] = [this.initializeFormData()];
  classifications: any[] = [];
  subClassifications: any[] = [];
  allData: any[] = [];
  isEditing: boolean = false;
  isSubmitEnabled: boolean = false;

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

  toggleNewUnitForm() {
    this.showNewUnitForm = !this.showNewUnitForm;
  }

  ngOnInit(): void {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        partnerDetails => {
          this.formData[0].partnerName = partnerDetails.data.partnerName;
          this.formData[0].partnerId = partnerDetails.data._id;
          this.enableSubmitButton();
        },
        error => {
          console.error('Error fetching partner details:', error);
        }
      );
    }
  }

  addNewForm() {
    this.formData.push(this.initializeFormData());
  }

  enableSubmitButton() {
    this.isSubmitEnabled = this.formData.every(data =>
      data.unitType &&
      data.unitClassification &&
      data.plateInformation &&
      data.istimaraNo &&
      data.firstName &&
      data.lastName &&
      data.email &&
      data.mobileNo &&
      data.iqamaNo &&
      data.dateOfBirth &&
      data.panelInformation &&
      data.drivingLicense &&
      data.aramcoLicense &&
      data.nationalID
    );
  }

  handleSubmit(formIndex: number) {
    const formData = new FormData();
    Object.entries(this.formData[formIndex]).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, value as string);
      }
    });
    // Convert FormData to a JSON object to view in console
  const formDataObject: any = {};
  formData.forEach((value, key) => {
    formDataObject[key] = value;
  });

  console.log('Submitted form data:', formDataObject);
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

  onUnitTypeChange(formIndex: number, unitType: string): void {
    this.formData[formIndex].unitType = unitType;
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

  onClassificationChange(formIndex: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const classificationId = target.value;
    this.formData[formIndex].unitClassification = classificationId;
    const selectedClassification = this.allData.find(item => item.name === classificationId);
    this.subClassifications = selectedClassification ? selectedClassification.type : [];
    this.enableSubmitButton();
  }

  handleFileInput(event: Event, field: string, formIndex: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.formData[formIndex][field] = input.files[0];
      this.enableSubmitButton();
    }
  }

}
