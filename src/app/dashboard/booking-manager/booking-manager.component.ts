import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerService } from '../../../services/partner/partner.service';
import { environment } from '../../../environments/environment.prod';
import { SpinnerService } from '../../../services/spinner.service';
import { checkoutService } from '../../../services/checkout.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditBookingModalComponent } from './edit-booking-modal/edit-booking-modal.component';

@Component({
  selector: 'app-booking-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-manager.component.html',
  styleUrl: './booking-manager.component.css',
})
export class BookingManagerComponent {
  bookings: any[] = [];
  filteredBookings: any[] = [];
  partnerDetails: any = {};
  paymentHandler: any = null;
  totalAmount: number = 0;
  oldQuotePrice: number = 0;

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private partnerService: PartnerService,
    private spinnerService: SpinnerService,
    private checkout: checkoutService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getBookingDetails();
    this.invokeStripe();
  }

  getBookingDetails(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe((response) => {
        this.bookings = response.data;

        // Get partner details for each booking and store them in partnerDetails
        this.bookings.forEach((booking) => {
          this.getPartnerDetails(booking.partner);
        });

        this.filteredBookings = this.bookings
          ?.filter((booking) => booking.paymentStatus === 'HalfPaid')
          .slice(0, 2); // Get only the first 2 bookings
      });
    }
  }

  getPartnerDetails(partnerId: string): void {
    this.partnerService.getPartnerDetails(partnerId).subscribe((response) => {
      // Store partner details with the partnerId as key
      this.partnerDetails[partnerId] = response.data;
    });
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'Completed':
      case 'Paid':
        return '#57C012';
      case 'Pending':
        return '#c30000';
      case 'HalfPaid':
        return '#F7E6B0';
      default:
        return 'transparent';
    }
  }

  getPaymentTextColor(status: string): string {
    switch (status) {
      case 'Completed':
      case 'Pending':
      case 'Paid':
        return 'white';
      case 'HalfPaid':
        return 'black';
      default:
        return 'inherit';
    }
  }

  createBooking(): void {
    this.router.navigate(['/home/user']);
  }

  invokeStripe() {
    if (!window.document.getElementById('stripe-script')) {
      const script = window.document.createElement('script');
      script.id = 'stripe-script';
      script.type = 'text/javascript';
      script.src = 'https://checkout.stripe.com/checkout.js';
      script.onload = () => {
        this.paymentHandler = (<any>window).StripeCheckout.configure({
          key: environment.stripePublicKey,
          locale: 'auto',
          token: (stripeToken: any) => {
            console.log(stripeToken);
          },
        });
      };
      window.document.body.appendChild(script);
    } else {
      this.paymentHandler = (<any>window).StripeCheckout.configure({
        key: environment.stripePublicKey,
        locale: 'auto',
        token: (stripeToken: any) => {
          console.log(stripeToken);
        },
      });
    }
  }

  makePayment(
    event: Event,
    remainingBalance: number,
    status: string,
    partnerId: string,
    bookingId: string
  ) {
    event.preventDefault();

    if (
      typeof remainingBalance !== 'number' ||
      remainingBalance <= 0 ||
      !status
    ) {
      this.toastr.error('Invalid payment amount or status');
      return;
    }

    const paymentHandler = (<any>window).StripeCheckout.configure({
      key: environment.stripePublicKey,
      locale: 'auto',
      token: (stripeToken: any) => {
        this.processPayment(
          stripeToken,
          remainingBalance,
          status,
          partnerId,
          bookingId
        );
      },
    });

    paymentHandler.open({
      name: 'Naqli',
      description: 'Naqli Transportation',
      amount: remainingBalance * 100,
    });
  }

  processPayment(
    stripeToken: any,
    remainingBalance: number,
    status: string,
    partnerId: string,
    bookingId: string
  ) {
    this.checkout.makePayment(stripeToken).subscribe((data: any) => {
      if (data.success && bookingId) {
        this.toastr.success(data.message);
        this.updateBookingPaymentStatus(
          bookingId,
          status,
          remainingBalance,
          partnerId
        );
        if (status === 'Completed' || status === 'HalfPaid') {
          this.router.navigate([
            '/home/user/dashboard/super-user/booking-manager',
          ]);
        }
      } else {
        this.toastr.error(data.message);
      }
    });
  }

  updateBookingPaymentStatus(
    bookingId: string,
    status: string,
    amount: number,
    partnerId: string
  ) {
    if (status == 'HalfPaid') {
      this.totalAmount = amount * 2;
    } else {
      this.totalAmount = amount;
    }
    this.spinnerService.show();
    this.bookingService
      .updateBookingPaymentStatus(
        bookingId,
        status,
        amount,
        partnerId,
        this.totalAmount,
        this.oldQuotePrice
      )
      .subscribe(
        (response) => {
          this.spinnerService.hide();
          this.getBookingDetails();
          console.log('Booking payment status updated successfully:', response);
        },
        (error) => {
          this.spinnerService.hide();
          console.error('Error updating booking payment status:', error);
          this.toastr.error(
            error.error?.message || 'Failed to update booking payment status',
            'Error'
          );
        }
      );
  }

  openEditModal(booking: any): void {
    const modalRef = this.modalService.open(EditBookingModalComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });

    // Pass booking and vendor data to modal
    modalRef.componentInstance.booking = booking;
    modalRef.componentInstance.refreshBookings = this.getBookingDetails.bind(this);
  }
}
