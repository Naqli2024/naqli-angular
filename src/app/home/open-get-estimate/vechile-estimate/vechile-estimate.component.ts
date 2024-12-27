import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Vehicle, VehicleType } from '../../../../models/vehicle-booking';
import { VehicleService } from '../../../../services/vehicle.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-vechile-estimate',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, TranslateModule],
  templateUrl: './vechile-estimate.component.html',
  styleUrl: './vechile-estimate.component.css'
})
export class VechileEstimateComponent {
  vehicles: Vehicle[] = [];
  filteredLoads: { [key: string]: string[] } = {};
  selectedVehicleName: string = '';
  additionalLabourEnabled: boolean = false;
  inputFields = [{ value: '' }];
  selectedOptions: { [key: string]: VehicleType | null } = {};
  optionsVisible: { [key: string]: boolean } = {};

  bookingData: any = {
    time: '',
    date: '',
    productValue: '',
    loadType: '',
    additionalLabour: false,
    labourCount: 0,
    pickUp: '',
    dropPoints: [] as string[],
    unitName: '',
    unitTypeName: '',
    unitTypeImage: '',
  };

  constructor(private vehicleService: VehicleService, private modalService: NgbModal, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe((data: Vehicle[]) => {
      this.vehicles = data;
      this.vehicles.forEach((vehicle) => {
        this.filteredLoads[vehicle.name] = [];
        this.optionsVisible[vehicle.name] = false;
        this.selectedOptions[vehicle.name] = null;
      });
    });
  }

  toggleOptions(vehicleName: string): void {
    // Close all other dropdowns before toggling the current one
    Object.keys(this.optionsVisible).forEach((key) => {
      if (key !== vehicleName) {
        this.optionsVisible[key] = false;
      }
    });
    this.optionsVisible[vehicleName] = !this.optionsVisible[vehicleName];
  }

  selectOption(type: VehicleType, vehicleName: string): void {
    this.selectedOptions[vehicleName] = type;
    this.optionsVisible[vehicleName] = false;
    this.onVehicleTypeChange(type, vehicleName);

    // Store selected vehicle details in bookingData
    this.bookingData.unitName = vehicleName;
    this.bookingData.unitTypeName = type.typeName;
    this.bookingData.unitTypeImage = type.typeImage;
  }

  onVehicleTypeChange(type: VehicleType, vehicleName: string): void {
    this.selectedVehicleName = vehicleName;
    const selectedType = this.vehicles
      .find(vehicle => vehicle.name === vehicleName)
      ?.type.find(t => t.typeName === type.typeName);

    this.filteredLoads[vehicleName] = selectedType ? selectedType.typeOfLoad.map(load => load.load) : [];
  }

  toggleAdditionalLabour(event: any): void {
    this.additionalLabourEnabled = event.target.checked;
    this.bookingData.additionalLabour = event.target.checked;
  }

  logRadioValue(event: any): void {
    this.bookingData.labourCount = +event.target.value;
  }

  submitEstimate(event: MouseEvent): void {
    event.preventDefault();
    this.bookingData.dropPoints = this.inputFields.map(field => field.value);

    this.http.post('http://localhost:3000/estimate', this.bookingData)
      .subscribe(
        (response) => {
          this.router.navigate(['/home/user/confirm-estimate']);
        }
      );
  }

  addInputField(): void {
    this.inputFields.push({ value: '' });
  }

  removeInputField(index: number): void {
    this.inputFields.splice(index, 1);
  }

  getVehicleImage(vehicle: any): string {
    return vehicle.type[0].typeImage; // Assuming each vehicle has at least one type
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any): void {
    // Close all dropdowns if the click is outside the dropdown area
    const clickedElement = event.target;
    const isInsideDropdown = this.isInsideDropdown(clickedElement);

    if (!isInsideDropdown) {
      this.closeAllDropdowns();
    }
  }

  private isInsideDropdown(clickedElement: any): boolean {
    // Check if the clicked element is inside any dropdown
    for (const vehicleName of Object.keys(this.optionsVisible)) {
      const dropdownElement = document.querySelector(`.custom-select-trigger[data-vehicle="${vehicleName}"]`);
      if (dropdownElement && dropdownElement.contains(clickedElement)) {
        return true;
      }
    }
    return false;
  }

  private closeAllDropdowns(): void {
    // Close all dropdowns
    Object.keys(this.optionsVisible).forEach((key) => {
      this.optionsVisible[key] = false;
    });
  }
}
