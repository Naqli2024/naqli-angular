import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EquipmentService } from '../../../../services/equipment.service';
import { Equipment, EquipmentType } from '../../../../models/equipment-booking';
import { BookingModalComponent } from '../bus-booking/booking-modal/booking-modal.component';
import { BookingService } from '../../../../services/booking.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { MapComponent } from '../../../map/map.component';
import { Router } from '@angular/router';
import { GoogleMapsService } from '../../../../services/googlemap.service';
import { MapService } from '../../../../services/map.service';

interface BookingData {
  name: string;
  unitType: string;
  type: EquipmentType[];
  date: string;
  fromTime: string;
  toTime: string;
  cityName: string;
  address: string;
  zipCode: string;
  additionalLabour: number | null;
}

@Component({
  selector: 'app-equipment-booking',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    BookingModalComponent,
    MapComponent,
  ],
  templateUrl: './equipment-booking.component.html',
  styleUrl: './equipment-booking.component.css',
})
export class EquipmentBookingComponent {
  equipment: Equipment[] = [];
  additionalLabourEnabled: boolean = false;
  optionsVisible: { [key: string]: boolean } = {};
  selectedOptions: { [key: string]: EquipmentType | null } = {};
  selectedEquipmentName: string = '';
  isFormSubmitted: boolean = false;

  bookingData: BookingData = {
    name: '',
    unitType: '',
    type: [{ typeName: '', typeImage: '' }],
    fromTime: '',
    toTime: '',
    date: '',
    cityName: '',
    address: '',
    zipCode: '',
    additionalLabour: null,
  };

  constructor(
    private equipmentService: EquipmentService,
    private modalService: NgbModal,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private router: Router,
    private googleMapsService: GoogleMapsService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    this.equipmentService.getEquipment().subscribe((data: Equipment[]) => {
      this.equipment = data;
      if (this.equipment.length > 0) {
        this.bookingData.unitType = this.equipment[0].unitType;
      }
    });
    this.googleMapsService.loadGoogleMapsScript();
    // Define the global initMap function
    (window as any).initMap = () => {
      this.mapService.initializeMapInContainer('mapContainer');
    };
  }

  
  getLocation(): void {
    if (this.bookingData.address && this.bookingData.cityName) {
      this.mapService.markLocation(this.bookingData.address, this.bookingData.cityName);
    } else {
      console.error('Address is required to mark location.');
    }
  }

  toggleAdditionalLabour(event: any): void {
    this.additionalLabourEnabled = event.target.checked;
    if (!this.additionalLabourEnabled) {
      this.bookingData.additionalLabour = null;
    }
  }

  logRadioValue(event: any): void {
    this.bookingData.additionalLabour = +event.target.value;
  }

  selectOption(type: EquipmentType, equipName: string): void {
    this.selectedOptions[equipName] = type;
    this.closeAllDropdownsExcept(equipName);
    this.onEquipmentTypeChange(type, equipName);
    this.selectedEquipmentName = equipName;
    this.optionsVisible[equipName] = false;

    this.bookingData.name = equipName;
    this.bookingData.type = [
      {
        typeName: type.typeName,
        typeImage: type.typeImage,
      },
    ];
  }

  onEquipmentTypeChange(type: EquipmentType, equipName: string): void {
    this.selectedEquipmentName = equipName;
  }

  toggleOptions(equipName: string): void {
    this.optionsVisible[equipName] = !this.optionsVisible[equipName];
    this.closeAllDropdownsExcept(equipName);
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
    for (const equipmentName of Object.keys(this.optionsVisible)) {
      const dropdownElement = document.querySelector(
        `.custom-select-trigger[data-vehicle="${equipmentName}"]`
      );
      if (dropdownElement && dropdownElement.contains(clickedElement)) {
        return true;
      }
    }
    return false;
  }

  private closeAllDropdownsExcept(excludeEquipName: string): void {
    Object.keys(this.optionsVisible).forEach((key) => {
      if (key !== excludeEquipName) {
        this.optionsVisible[key] = false;
      }
    });
  }

  private closeAllDropdowns(): void {
    Object.keys(this.optionsVisible).forEach((key) => {
      this.optionsVisible[key] = false;
    });
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

  formIsValid(): boolean {
    let isValid = true;
    const errors: string[] = [];

    // Define required fields and their error messages
    const requiredFields: { key: keyof BookingData; message: string }[] = [
      { key: 'date', message: 'Please select a date' },
      { key: 'fromTime', message: 'Please select a from time' },
      { key: 'toTime', message: 'Please select a to time' },
      { key: 'cityName', message: 'Please enter city name' },
      { key: 'address', message: 'Please enter address' },
      { key: 'zipCode', message: 'Please enter zip code' },
      { key: 'unitType', message: 'Please select a unit type' },
    ];

    // Check if at least one type is selected
    if (
      this.bookingData.type.length === 0 ||
      !this.bookingData.type[0].typeName.trim()
    ) {
      errors.push('Please select at least one equipment type');
      isValid = false;
    }

    requiredFields.forEach((field) => {
      const value = this.bookingData[field.key];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(field.message);
        isValid = false;
      }
    });

    // Show toast errors if form is invalid
    if (!isValid) {
      errors.forEach((error) => {
        this.toastr.error(error);
      });
    }

    return isValid;
  }

  submitBooking(): void {
    this.isFormSubmitted = true;
    if (this.formIsValid()) {
      this.spinnerService.show();
      this.bookingService.createBooking(this.bookingData).subscribe(
        (response: any) => {
          this.spinnerService.hide();
          if (response && response._id) {
            this.toastr.success(response.message, 'Booking Successful!');
            this.clearForm();
            // Check if there is an existing bookingId in localStorage
            const existingBookingId = localStorage.getItem('bookingId');
            if (existingBookingId) {
              console.log(
                `Replacing existing bookingId: ${existingBookingId} with new bookingId: ${response._id}`
              );
            }

            // Set the new bookingId in localStorage, replacing the old one
            localStorage.setItem('bookingId', response._id);
            this.router.navigate(['/home/user/dashboard/booking']);
            this.openBookingModal(response._id);
          } else {
            this.toastr.error(response.message || 'Booking Failed!', 'Error');
          }
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
          console.error('Backend Error:', error);
        }
      );
    }
  }

  clearForm() {
    this.bookingData = {
      name: '',
      unitType: '',
      type: [{ typeName: '', typeImage: '' }],
      fromTime: '',
      toTime: '',
      date: '',
      cityName: '',
      address: '',
      zipCode: '',
      additionalLabour: null,
    };
  }
}
