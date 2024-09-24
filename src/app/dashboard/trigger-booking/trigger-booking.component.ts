import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TriggerBookingModalComponent } from './trigger-booking-modal/trigger-booking-modal.component';
import { BookingService } from '../../../services/booking.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../services/partner/partner.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trigger-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trigger-booking.component.html',
  styleUrl: './trigger-booking.component.css',
})
export class TriggerBookingComponent {
  bookings: any[] = [];
  vendorsByBooking: any = {};
  selectedVendor: { [key: string]: any } = {}; 
  
  constructor(
    private modalService: NgbModal,
    private bookingService: BookingService,
    private partnerService: PartnerService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fetchBookings();
  }

  fetchBookings(): void {
    const userId = localStorage.getItem('userId'); 
    if (userId) {
      this.spinnerService.show();
      this.bookingService.getBookingByUserId(userId).subscribe(
        (response: any) => {
          this.spinnerService.hide();
          if (response.success) {
            this.bookings = response.data; 
            // Fetch vendors for each booking
            this.bookings.forEach((booking) => {
              this.getTopVendors(booking);
            });
          } else {
            this.toastr.error('Failed to fetch bookings');
          }
        },
        (error) => {
          this.spinnerService.hide();
          const errorMessage = error.error?.message || 'An error occurred';
          this.toastr.error(errorMessage, 'Error');
        }
      );
    } else {
      console.error('No userId found in localStorage');
    }
  }

  // Fetch top vendors based on booking details
  getTopVendors(booking: any): void {
    const requestBody = {
      bookingId: booking._id,
      unitType: booking.unitType,
      unitClassification: booking.name,
      subClassification: booking.type.typeName
    };
    this.spinnerService.show();

    this.partnerService.getTopPartners(requestBody).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        if (response.success) {
          this.vendorsByBooking[booking._id] = response.data.map((vendor: any) => ({
            name: vendor.partnerName,
            price: vendor.quotePrice || 'N/A' 
          }));
        } else {
          this.toastr.error('Failed to fetch vendors');
        }
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
      }
    );
  }

  cancelBooking(bookingId: any): void {
    this.spinnerService.show();

    this.bookingService.cancelBooking(bookingId).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
      },
      (error) => {
          this.spinnerService.hide();
          this.toastr.error(
            error.error?.message || 'Failed to cancel booking',
            'Error'
          );
      }
    )
  } 

  openPaymentModal(booking: any): void {
    const selectedVendor = this.selectedVendor[booking._id];
    if (!selectedVendor) {
      this.toastr.warning('Please select a vendor');
      return;
    }

    const modalRef = this.modalService.open(TriggerBookingModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });

    // Pass booking and vendor data to modal
    modalRef.componentInstance.booking = booking;
    modalRef.componentInstance.vendor = selectedVendor;
  }
}
