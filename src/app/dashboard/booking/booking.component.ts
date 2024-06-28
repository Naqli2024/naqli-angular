import { CommonModule } from '@angular/common';
import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../../../services/booking.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { checkoutService } from '../../../services/checkout.service';
import { MapComponent } from '../../map/map.component';
import { AuthService } from '../../../services/auth.service';
import { Booking } from '../../../models/booking.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css',
})
export class BookingComponent implements OnInit {
  @ViewChild('payAdvanceModal') payAdvanceModal?: TemplateRef<any>;
  vendors = [
    { name: 'Vendor 1', price: 100 },
    { name: 'Vendor 2', price: 120 },
    { name: 'Vendor 3', price: 90 },
  ];
  bookingId: string | null = null;
  @ViewChild('cancelBookingModal', { static: true }) cancelBookingModal: any;
  private modalRef: NgbModalRef | null = null;
  selectedVendor: any;
  paymentHandler: any = null;
  bookings: Booking[] = [];


  constructor(
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private checkout: checkoutService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.bookingId = params['bookingId'] || null;
    });
    this.invokeStripe();
    this.fetchBookings();
  }

  fetchBookings() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe(
        (response) => {
          if (response.success) {
            this.bookings = response.data;
            console.log(this.bookings)
          } else {
            this.toastr.error('Failed to fetch bookings');
          }
        },
        (error) => {
          this.toastr.error('Failed to fetch bookings');
          console.error('Error fetching bookings:', error);
        }
      );
    } else {
      this.toastr.error('User ID not available');
    }
  }

  onSelect(vendor: any) {
    this.selectedVendor = vendor;
    console.log('Selected vendor:', vendor);
  }

  openBookingCancelModal(event: Event): void {
    event.preventDefault();
    this.modalRef = this.modalService.open(this.cancelBookingModal);
    this.modalRef.result.then(
      (result) => {
        if (result === 'confirm') {
          this.cancelBooking();
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }

  confirmCancelBooking(modal: NgbModalRef, action: string): void {
    if (action === 'confirm') {
      modal.close('confirm');
    } else {
      modal.dismiss('cancel');
    }
  }

  private cancelBooking(): void {
    if (this.bookingId) {
      this.spinnerService.show();
      this.bookingService.cancelBooking(this.bookingId).subscribe(
        (response) => {
          this.spinnerService.hide();
          this.toastr.success(response.message);
          window.location.href = '/home/user';
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error(
            error.error?.message || 'Failed to cancel booking',
            'Error'
          );
          console.error('Error cancelling booking:', error);
        }
      );
    } else {
      this.spinnerService.hide();
      this.toastr.error('Booking ID is not available', 'Error');
    }
  }

  openPayAdvanceModal(event: Event) {
    event.preventDefault();
    if (this.payAdvanceModal) {
      this.modalService.open(this.payAdvanceModal, { centered: true });
    }
  }

  makePayment(event: Event, amount: number, status: string) {
    event.preventDefault();

    console.log('Clicked "Pay" button with amount:', amount, 'and status:', status);

    if (typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid payment amount or status');
      console.error('Invalid payment amount or status:', amount, status);
      return;
    }

    const paymentHandler = (<any>window).StripeCheckout.configure({
      key: environment.stripePublicKey,
      locale: 'auto',
      token: (stripeToken: any) => {
        this.processPayment(stripeToken, amount, status);
      },
    });

    paymentHandler.open({
      name: 'Naqli',
      description: 'Naqli Transportation',
      amount: amount * 100,
    });
  }

  processPayment(stripeToken: any, amount: number, status: string) {
    this.checkout.makePayment(stripeToken).subscribe((data: any) => {
      if (data.success && this.bookingId) {
        this.toastr.success(data.message);
        this.updateBookingPaymentStatus(this.bookingId, status, amount);
        if (status === 'completed' || 'halfPaid') {
          this.router.navigate(['/home/user/dashboard/booking-history']);
        }
      } else {
        this.toastr.error(data.message);
      }
    });
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

  private updateBookingPaymentStatus(bookingId: string, status: string, amount: number) {
    if (!bookingId || typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid input for payment update');
      return;
    }
    this.spinnerService.show();
    this.bookingService.updateBookingPaymentStatus(bookingId, status, amount).subscribe(
      (response) => {
        this.spinnerService.hide();
        console.log('Booking payment status updated successfully:', response);
      },
      (error) => {
        console.error('Error updating booking payment status:', error);
        this.spinnerService.hide();
        this.toastr.error(error.error?.message || 'Failed to update booking payment status', 'Error');
      }
    );
  }
}
