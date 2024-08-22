import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingModalComponent } from '../bus-booking/booking-modal/booking-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SpecialService } from '../../../../services/special.service';
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
  fromTime: string;
  toTime: string;
  cityName: string;
  address: string;
  zipCode: string;
  additionalLabour: number | null;
  image: string;
  date: string;
}

@Component({
  selector: 'app-special',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    BookingModalComponent,
    MapComponent,
  ],
  templateUrl: './special.component.html',
  styleUrl: './special.component.css',
})
export class SpecialComponent {
  buses: any[] = [];
  selectedBus: any = null;
  additionalLabourEnabled: boolean = false;

  bookingData: BookingData = {
    name: '',
    unitType: '',
    fromTime: '',
    toTime: '',
    cityName: '',
    address: '',
    zipCode: '',
    additionalLabour: null,
    image: '',
    date: '',
  };

  constructor(
    private busService: SpecialService,
    private modalService: NgbModal,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private router: Router,
    private googleMapsService: GoogleMapsService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    this.busService.getSpecialUnits().subscribe((data: any[]) => {
      this.buses = data;
      if (this.buses.length > 0) {
        this.bookingData.unitType = this.buses[0].unitType;
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

  selectBus(bus: any): void {
    this.selectedBus = bus;
    this.bookingData.name = bus.name;
    this.bookingData.image = bus.image;
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
      { key: 'fromTime', message: 'Please select a from time' },
      { key: 'toTime', message: 'Please select a to time' },
      { key: 'date', message: 'Please select a date' },
      { key: 'cityName', message: 'Please enter city name' },
      { key: 'address', message: 'Please enter address' },
      { key: 'zipCode', message: 'Please enter zip code' },
    ];

    requiredFields.forEach((field) => {
      const value = this.bookingData[field.key];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(field.message);
        isValid = false;
      }
    });

    // Check if a bus is selected
    if (!this.selectedBus) {
      errors.push('Please select one special unit');
      isValid = false;
    }

    // Show toast errors if form is invalid
    if (!isValid) {
      errors.forEach((error) => {
        this.toastr.error(error, 'Error');
      });
    }

    return isValid;
  }

  submitBooking(): void {
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
      fromTime: '',
      toTime: '',
      cityName: '',
      address: '',
      zipCode: '',
      additionalLabour: null,
      image: '',
      date: '',
    };
    this.selectedBus = null;
  }
}
