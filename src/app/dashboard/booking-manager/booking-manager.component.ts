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
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-booking-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
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
  unitDetails: { [key: string]: any } = {};
  filteredOption: string = 'All';
  filteredBookingsByTime: any[] = [];
  filteredBookingOption: string = 'All';
  filteredBookingsByStatus: any[] = [];
  filterBookings: any[] = [];
  showPaymentOptions: boolean = false;
  selectedBrand: string = '';
  checkoutId: string | null = null;
  integrity: string = '';
  showPaymentForm: boolean = false;
  shopperResultUrl: string = 'http://localhost:4200/home/user/payment-result';
  amount: number | undefined;
  status: string | undefined;
  partnerId: string | undefined;
  bookingInformation: boolean = false;
  bookingId: any;

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private partnerService: PartnerService,
    private spinnerService: SpinnerService,
    private checkout: checkoutService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.getBookingDetails();
    // Optionally get the current payment status synchronously
    const currentStatus = this.paymentService.getPaymentStatus();
    console.log('Current Payment Status:', currentStatus);
    if (currentStatus === 'Payment Successful!') {
      this.updateBookingPaymentStatus();
    }

     // Define the wpwlOptions in TypeScript
     window['wpwlOptions'] = {
      billingAddress: {},
      mandatoryBillingFields: {
        country: true,
        state: true,
        city: true,
        postcode: true,
        street1: true,
        street2: false
      }
    };
  }

  getBookingDetails(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe((response) => {
        this.bookings = response.data;
        this.applyFilter();
        this.applyBookingFilter();

        // Get partner details for each booking and store them in partnerDetails
        this.bookings.forEach((booking) => {
          if (booking.partner) {
            this.getPartnerDetails(booking.partner);
          } else {
            console.warn(`No partner ID for booking ${booking._id}`);
          }

          // Only get unit details if paymentStatus is not 'NotPaid'
          if (booking.paymentStatus !== 'NotPaid') {
            this.getUnitDetails(booking._id);
          } else {
            console.warn(
              `Skipping unit details for booking ${booking._id} as payment has not been initiated.`
            );
          }
        });

        this.filteredBookings = this.bookings
          ?.filter((booking) => booking.paymentStatus === 'HalfPaid')
          .slice(0, 2); // Get only the first 2 bookings
      });
    }
  }

  getPartnerDetails(partnerId: string): void {
    if (!partnerId || this.partnerDetails[partnerId]) return;
    this.partnerService.getPartnerDetails(partnerId).subscribe(
      (response) => {
        this.partnerDetails[partnerId] = response.data;
      },
      (error) => {
        console.error(
          `Error fetching partner details for ID ${partnerId}:`,
          error.message
        );
      }
    );
  }

  getUnitDetails(bookingId: string): void {
    if (this.unitDetails[bookingId]) return;
    this.bookingService.getUnitDetails(bookingId).subscribe((response) => {
      this.unitDetails[bookingId] = response.unit;
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

  makePayment(
    event: Event,
    amount: number,
    status: string,
    partnerId: string,
    bookingId: string
  ) {
    event.preventDefault();

    if (
      typeof amount !== 'number' ||
      amount <= 0 ||
      !status
    ) {
      this.toastr.error('Invalid payment amount or status');
      return;
    }

   // Store the payment details globally
   this.paymentService.setRemainingPaymentDetails({
    amount,
    status,
    partnerId,
    bookingId
    });

    // Show the payment options (MADA or Other cards)
    this.showPaymentOptions = true;
  }

  selectPaymentBrand(brand: string) {
    this.selectedBrand = brand;
    console.log(this.selectedBrand);
    this.showPaymentOptions = false;
    this.showPaymentForm = true;
    const details = this.paymentService.getPaymentDetails();
    const userId: any = localStorage.getItem('userId');

    if (details) {
      // Access individual properties
      this.amount = details.amount;
      this.status = details.status;
      this.partnerId = details.partnerId;
      this.bookingId = details.bookingId;

      console.log('Payment Details:', {
        amount: this.amount,
        status: this.status,
        partnerId: this.partnerId,
        bookingId: this.bookingId,
      });
    } else {
      console.log('No payment details available');
    }

    // Check if `remainingBalance` and `selectedBrand` are defined before proceeding
    if (this.amount && this.selectedBrand && userId) {
      console.log(this.amount, this.selectedBrand);
      this.processPayment(this.amount, this.selectedBrand, userId);
    } else {
      this.toastr.error('Missing payment details');
    }
  }

  processPayment(amount: number, paymentBrand: string, userId: any) {
    this.checkout.createPayment(amount, paymentBrand, userId).subscribe(
      (data: any) => {
        this.checkoutId = data.id; // Adjust according to your response structure
        localStorage.setItem('paymentBrand', paymentBrand);
        this.integrity = data.integrity; // Adjust according to your response structure
        this.showPaymentForm = true;

        // Inject the payment widget script into the DOM dynamically
        this.loadPaymentScript();
      },
      (error) => {
        // Handle errors during payment creation
        this.toastr.error('Error creating payment', error);
      }
    );
  }

  // This method should be called when the user submits the payment form
  onPaymentFormSubmit() {
    // Ensure that checkoutId is available
    if (!this.checkoutId) {
      this.toastr.error('Checkout ID is not available. Please try again.');
      return;
    }

    // Ensure that paymentBrand is available
    if (!this.selectedBrand) {
      this.toastr.error('Payment Brand is not selected. Please try again.');
      return;
    }

    setTimeout(() => {
      this.router.navigate(['home/user/payment-result'], {
        queryParams: {
          checkoutId: this.checkoutId,
        },
      });
    }, 100);
  }


  // Function to dynamically load the payment widget script
  loadPaymentScript() {
    const script = document.createElement('script');
    script.src = `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${this.checkoutId}`;
    script.crossOrigin = 'anonymous';
    script.integrity = this.integrity;

    script.onload = () => {
      console.log('Payment widget script loaded');
    };

    // Append script to body or a specific element where the form will be displayed
    document.body.appendChild(script);
  }

  private updateBookingPaymentStatus() {
    const details = this.paymentService.getPaymentDetails();
    console.log(details);

    this.spinnerService.show();
    if (details.status == 'HalfPaid') {
      this.totalAmount = details.amount * 2;
    } else {
      this.totalAmount = details.amount;
    }
    if (details.partnerId && details.bookingId) {
      this.bookingService
        .updateBookingPaymentStatus(
          details.bookingId,
          details.status,
          details.amount,
          details.partnerId,
          this.totalAmount,
          this.oldQuotePrice
        )
        .subscribe(
          (response) => {
            this.spinnerService.hide();
            this.bookingInformation = true;
            console.log(
              'Booking payment status updated successfully:',
              response
            );
            this.paymentService.clearPaymentDetails();
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
  }

    // Method to close the payment form
    closePaymentForm() {
      this.showPaymentForm = false;
    }
  
    closePaymentOptions() {
      this.showPaymentOptions = false;
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
    modalRef.componentInstance.refreshBookings =
      this.getBookingDetails.bind(this);
  }

  onFilterChange(event: Event) {
    this.filteredOption = (event.target as HTMLSelectElement).value;
    this.applyFilter();
  }

  onBookingChange(event: Event) {
    this.filteredBookingOption = (event.target as HTMLSelectElement).value;
    this.applyBookingFilter();
  }

  applyFilter() {
    const today = moment();

    this.filteredBookingsByTime = this.bookings.filter((booking) => {
      const bookingDate = moment(booking.createdAt);

      switch (this.filteredOption) {
        case 'All':
          return true;
        case 'Today':
          return bookingDate.isSame(today, 'day');
        case 'This Week':
          return bookingDate.isSame(today, 'week');
        case 'This Month':
          return bookingDate.isSame(today, 'month');
        case 'This Year':
          return bookingDate.isSame(today, 'year');
        default:
          return true;
      }
    });

    this.updateCombinedFilter();
  }

  applyBookingFilter() {
    this.filteredBookingsByStatus = this.bookings.filter((booking) => {
      switch (this.filteredBookingOption) {
        case 'All':
          return true;
        case 'Completed':
          return (
            booking.bookingStatus === 'Completed' &&
            (booking.paymentStatus === 'Completed' ||
              booking.paymentStatus === 'Paid')
          );
        case 'Running':
          return booking.bookingStatus === 'Running';
        case 'Hold':
          return (
            booking.bookingStatus === 'Yet to start' ||
            booking.paymentStatus === 'NotPaid'
          );
        case 'Pending for payment':
          return (
            booking.tripStatus === 'Completed' &&
            booking.remainingBalance != 0
          );
        default:
          return true;
      }
    });

    this.updateCombinedFilter();
  }

  updateCombinedFilter() {
    this.filterBookings = this.bookings.filter(
      (booking) =>
        this.filteredBookingsByTime.includes(booking) &&
        this.filteredBookingsByStatus.includes(booking)
    );
    console.log('Combined Filtered Bookings:', this.filterBookings);
  }
}
