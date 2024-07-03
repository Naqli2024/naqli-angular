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
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.busService.getBuses().subscribe((data: any[]) => {
      this.buses = data;
      if (this.buses.length > 0) {
        this.bookingData.unitType = this.buses[0].unitType; 
      }
    });
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

  submitBooking(): void {
    this.spinnerService.show();
    this.bookingService.createBooking(this.bookingData).subscribe(
      (response) => {
        this.spinnerService.hide();
        if (response && response._id) {
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
