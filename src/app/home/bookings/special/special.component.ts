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

  bookingData: any = {
    name: '',
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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.busService.getSpecialUnits().subscribe((data: any[]) => {
      this.buses = data;
    });
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

  submitBooking(): void {
    this.spinnerService.show();
    this.bookingService.createBooking(this.bookingData).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        if (response && response._id) {
          this.toastr.success(response.message, 'Booking Successful!');
          this.clearForm();
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

  clearForm() {
    this.bookingData = {
      name: '',
      fromTime: '',
      toTime: '',
      cityName: '',
      address: '',
      zipCode: '',
      additionalLabour: null,
      image: '',
    };
  }
}
