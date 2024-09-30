import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../../environments/environment.prod';
import { checkoutService } from '../../../../services/checkout.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { BookingService } from '../../../../services/booking.service';
import { PartnerService } from '../../../../services/partner/partner.service';
import { BookingModalComponent } from './booking-modal/booking-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trigger-booking-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trigger-booking-modal.component.html',
  styleUrl: './trigger-booking-modal.component.css',
})
export class TriggerBookingModalComponent {
  @Input() booking: any;
  @Input() vendor: any;
  @Input() fetchBookings!: () => void;
  paymentHandler: any = null;
  totalAmount: number = 0;
  partnerNo: any;

  constructor(
    public activeModal: NgbActiveModal,
    public router: Router,
    private checkout: checkoutService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private bookingService: BookingService,
    private modalService: NgbModal,
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    this.invokeStripe();
    this.getPartnerDetails();
  }

  getPartnerDetails(): void {
    if(this.vendor.partnerId) {
      this.partnerService
      .getPartnerDetails(this.vendor.partnerId)
      .subscribe((response: any) => {
        this.partnerNo = response.data.mobileNo;
      });
    } else {
        this.partnerNo = 'N/A'
    }
  }

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
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
    amount: number,
    status: string,
    partnerId: string,
    oldQuotePrice: number
  ) {
    event.preventDefault();
    this.closeModalAndNavigate();

    if (typeof amount !== 'number' || amount <= 0 || !status || isNaN(this.vendor.price)) {
      this.toastr.error('Invalid payment amount or status. Please wait for quote price..');
      console.error('Invalid payment amount or status:', amount, status);
      return;
    }

    const paymentHandler = (<any>window).StripeCheckout.configure({
      key: environment.stripePublicKey,
      locale: 'auto',
      token: (stripeToken: any) => {
        this.processPayment(
          stripeToken,
          amount,
          status,
          partnerId,
          oldQuotePrice
        );
      },
    });

    paymentHandler.open({
      name: 'Naqli',
      description: 'Naqli Transportation',
      amount: amount * 100,
    });
  }

  processPayment(
    stripeToken: any,
    amount: number,
    status: string,
    partnerId: string,
    oldQuotePrice: number
  ) {
    this.checkout.makePayment(stripeToken).subscribe((data: any) => {
      if (data.success && this.booking._id) {
        this.toastr.success(data.message);
        this.updateBookingPaymentStatus(
          this.booking._id,
          status,
          amount,
          partnerId,
          oldQuotePrice
        );
      } else {
        this.toastr.error(data.message);
      }
    });
  }

  private updateBookingPaymentStatus(
    bookingId: string,
    status: string,
    amount: number,
    partnerId: string,
    oldQuotePrice: number
  ) {
    if (!bookingId || typeof amount !== 'number' || amount <= 0 || !status || isNaN(this.vendor.price)) {
      this.toastr.error('Invalid input for payment update. Please wait for quote price..');
      return;
    }
    this.spinnerService.show();
    if (status == 'HalfPaid') {
      this.totalAmount = amount * 2;
    } else {
      this.totalAmount = amount;
    }
    this.bookingService
      .updateBookingPaymentStatus(
        bookingId,
        status,
        amount,
        partnerId,
        this.totalAmount,
        oldQuotePrice
      )
      .subscribe(
        (response) => {
          this.spinnerService.hide();
          this.openBookingModal(this.booking._id);
          this.fetchBookings();
          console.log('Booking payment status updated successfully:', response);
        },
        (error) => {
          console.error('Error updating booking payment status:', error);
          this.spinnerService.hide();
          this.toastr.error(
            error.error?.message || 'Failed to update booking payment status',
            'Error'
          );
        }
      );
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
}
