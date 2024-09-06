import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BookingModalComponent } from './booking-modal/booking-modal.component';
import { BusService } from '../../../../services/bus.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { BookingService } from '../../../../services/booking.service';
import { MapComponent } from '../../../map/map.component';
import { Router } from '@angular/router';
import { GoogleMapsService } from '../../../../services/googlemap.service';
import { MapService } from '../../../../services/map.service';

@Component({
  selector: 'app-bus-booking',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    BookingModalComponent,
    MapComponent,
  ],
  templateUrl: './bus-booking.component.html',
  styleUrl: './bus-booking.component.css',
})
export class BusBookingComponent implements OnInit {
  buses: any[] = [];
  selectedBus: any = null;
  additionalLabourEnabled: boolean = false;

  bookingData: any = {
    name: '',
    unitType: '',
    time: '',
    date: '',
    productValue: '',
    pickup: '',
    dropPoints: [''],
    additionalLabour: null,
    image: '',
  };

  constructor(
    private busService: BusService,
    private modalService: NgbModal,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private bookingService: BookingService,
    private router: Router,
    private googleMapsService: GoogleMapsService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    this.busService.getBuses().subscribe((data: any[]) => {
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

  updateRoute(): void {
    // Check if pickup and at least one drop point are set
    if (this.bookingData.pickup && this.bookingData.dropPoints.length > 0) {
      const start = this.bookingData.pickup;
      const waypoints = this.bookingData.dropPoints.slice(0, -1); // All except the last one
      const end =
        this.bookingData.dropPoints[this.bookingData.dropPoints.length - 1]; // Last drop point
      this.mapService.calculateRoute(start, waypoints, end);
    }
  }


  selectBus(bus: any): void {
    this.selectedBus = bus;
    this.bookingData.name = bus.name;
    this.bookingData.image = bus.image;
  }

  addInputField(): void {
    this.bookingData.dropPoints.push('');
  }

  removeInputField(index: number): void {
    if (this.bookingData.dropPoints.length > 1) {
      this.bookingData.dropPoints.splice(index, 1);
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
    const requiredFields = [
      { key: 'time', message: 'Please select a time' },
      { key: 'date', message: 'Please select a date' },
      { key: 'productValue', message: 'Please enter the product value' },
      { key: 'pickup', message: 'Please enter a pickup location' },
    ];

    for (let field of requiredFields) {
      const keys = field.key.split('.');
      let value = this.bookingData;

      for (let key of keys) {
        if (value === undefined || value === null) {
          this.toastr.error(field.message);
          return false;
        }
        value = value[key];
      }

      if (!value) {
        this.toastr.error(field.message);
        return false;
      }
    }

    if (!this.bookingData.dropPoints.some(dropPoint => dropPoint.trim())) {
      this.toastr.error('Please enter at least one drop point');
      return false;
    }

    const atLeastOneBusSelected = !!this.selectedBus;
    if (!atLeastOneBusSelected) {
      this.toastr.error('Please select an option for at least one bus');
      return false;
    }

    return true;
  }

  submitBooking(): void {
    if(this.formIsValid()) {
      this.spinnerService.show();
      this.bookingService.createBooking(this.bookingData).subscribe(
        (response) => {
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
  }

  clearForm() {
    this.bookingData = {
      name: '',
      time: '',
      date: '',
      productValue: '',
      pickup: '',
      dropPoints: [''],
      additionalLabour: null,
      image: '',
    };
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}