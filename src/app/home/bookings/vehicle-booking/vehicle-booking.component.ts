import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener } from '@angular/core';
import { Vehicle, VehicleType } from '../../../../models/vehicle-booking';
import { VehicleService } from '../../../../services/vehicle.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingModalComponent } from '../bus-booking/booking-modal/booking-modal.component';
import { BookingService } from '../../../../services/booking.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { MapComponent } from '../../../map/map.component';

@Component({
  selector: 'app-vehicle-booking',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, BookingModalComponent, MapComponent],
  templateUrl: './vehicle-booking.component.html',
  styleUrl: './vehicle-booking.component.css',
})
export class VehicleBookingComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filteredLoads: { [key: string]: string[] } = {};
  selectedVehicleName: string = '';
  additionalLabourEnabled: boolean = false;
  inputFields = [{ value: '' }];
  selectedOptions: { [key: string]: VehicleType | null } = {};
  optionsVisible: { [key: string]: boolean } = {};

  bookingData: any = {
    unitType: '',
    name: '',
    type: [{ typeName: '', scale: '', typeImage: '', typeOfLoad: '' }],
    time: '',
    date: '',
    productValue: '',
    pickup: '',
    dropPoints: [''],
    additionalLabour: null
  };

  constructor(
    private vehicleService: VehicleService,
    private modalService: NgbModal,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe((data: Vehicle[]) => {
      this.vehicles = data;
      if (this.vehicles.length > 0) {
        this.bookingData.unitType = this.vehicles[0].unitType; 
      }
      this.vehicles.forEach((vehicle) => {
        this.filteredLoads[vehicle.name] = [];
        this.optionsVisible[vehicle.name] = false;
        this.selectedOptions[vehicle.name] = null;
      });
    });
  }

  toggleOptions(vehicleName: string): void {
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

    this.bookingData.name = vehicleName;
    this.bookingData.type = [{
      typeName: type.typeName,
      scale: type.scale,
      typeImage: type.typeImage,
      typeOfLoad: '' 
    }];
  }

  onVehicleTypeChange(type: VehicleType, vehicleName: string): void {
    this.selectedVehicleName = vehicleName;
    const selectedType = this.vehicles
      .find((vehicle) => vehicle.name === vehicleName)
      ?.type.find((t) => t.typeName === type.typeName);

    this.filteredLoads[vehicleName] = selectedType
      ? selectedType.typeOfLoad.map((load) => load.load)
      : [];
  }

  toggleAdditionalLabour(event: any): void {
    this.additionalLabourEnabled = event.target.checked;
    if (!this.additionalLabourEnabled) {
      this.bookingData.additionalLabour = null;
    }
  }

  logRadioValue(event: any): void {
    this.bookingData.additionalLabour = +event.target.value; // Update additionalLabour
  }

  openBookingModal(bookingId: string): void {
    const modalRef = this.modalService.open(BookingModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
    modalRef.componentInstance.bookingId = bookingId; 
  }

  submitBooking(): void {
    this.spinnerService.show();
    this.bookingService.createBooking(this.bookingData).subscribe(
      (response) => {
        this.spinnerService.hide();
        if (response && response._id ) {
          this.toastr.success(response.message, 'Booking Successful!');
          this.clearForm();
          this.openBookingModal(response._id);
        } else {
          this.toastr.error(response.message, 'Booking Failed!');
        }
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
        console.log('Backend Error:', error);
      }
    );
  }

  addInputField(): void {
    this.bookingData.dropPoints.push('');
  }
  
  removeInputField(index: number): void {
    if (this.bookingData.dropPoints.length > 1) {
      this.bookingData.dropPoints.splice(index, 1);
    }
  }

  getVehicleImage(vehicle: any): string {
    return vehicle.type[0].typeImage; // Assuming each vehicle has at least one type
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: any): void {
    const clickedElement = event.target;
    const isInsideDropdown = this.isInsideDropdown(clickedElement);

    if (!isInsideDropdown) {
      this.closeAllDropdowns();
    }
  }

  private isInsideDropdown(clickedElement: any): boolean {
    for (const vehicleName of Object.keys(this.optionsVisible)) {
      const dropdownElement = document.querySelector(
        `.custom-select-trigger[data-vehicle="${vehicleName}"]`
      );
      if (dropdownElement && dropdownElement.contains(clickedElement)) {
        return true;
      }
    }
    return false;
  }

  private closeAllDropdowns(): void {
    Object.keys(this.optionsVisible).forEach((key) => {
      this.optionsVisible[key] = false;
    });
  }

  clearForm() {
    this.bookingData = {
      name: '',
      type: [{ typeName: '', scale: '', typeImage: '', typeOfLoad: '' }],
      time: '',
      date: '',
      productValue: '',
      pickup: '',
      dropPoints: [''],
      additionalLabour: null
    };
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
