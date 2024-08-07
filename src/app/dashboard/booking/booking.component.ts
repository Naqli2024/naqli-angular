import { CommonModule } from '@angular/common';
import { Component, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../../../services/booking.service';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService, ActiveToast, IndividualConfig } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { checkoutService } from '../../../services/checkout.service';
import { MapComponent } from '../../map/map.component';
import { AuthService } from '../../../services/auth.service';
import { Booking } from '../../../models/booking.model';
import { PartnerService } from '../../../services/partner/partner.service';

interface Vendor {
  name: string;
  price: number | null;
  partnerid: string;
  oldQuotePrice: number | null;
  unitName: string;
  unitClassificationName: string;
  unitSubClassificationName: string;
  operatorFirstName: string;
  operatorLastName: string;
  operatorMobileNo: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css',
})
export class BookingComponent implements OnInit {
  @ViewChild('payAdvanceModal') payAdvanceModal?: TemplateRef<any>;
  vendors: Vendor[] = [];
  bookingId!: string | null;
  @ViewChild('cancelBookingModal', { static: true }) cancelBookingModal: any;
  private modalRef: NgbModalRef | null = null;
  selectedVendor: any;
  paymentHandler: any = null;
  fetchedVendors: boolean = false;
  bookings: Booking[] = [];
  unitType: string = '';
  unitClassification: string = '';
  subClassification: string = '';
  polling = true;
  totalAmount: number = 0;
  bookingInformation: boolean = false;
  bookingDetails: any = null;
  partnerDetails: any = null;;
  combinedDetails: any = null;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private checkout: checkoutService,
    private authService: AuthService,
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    this.bookingId = localStorage.getItem('bookingId');
    console.log('Booking ID:', this.bookingId);

    if (this.bookingId) {
      this.invokeStripe();
      this.fetchBookings();
      this.getTopPartners();
      this.getBookings(this.bookingId)
    } else {
      this.toastr.error('Booking ID is missing');
    }
  }

  getTopPartners() {
    if (!this.bookingId) {
      console.error('Booking ID is not available.');
      return;
    }

    this.spinnerService.show();
    this.bookingService.getBookingsByBookingId(this.bookingId).subscribe(
      (response) => {
        if (response.success) {
          this.spinnerService.hide();
          const bookingData = response.data;
          this.unitType = bookingData.unitType;
          this.unitClassification = bookingData.name;
          this.subClassification = bookingData.type?.[0]?.typeName || '';

          const requestBody = {
            unitType: this.unitType,
            unitClassification: this.unitClassification,
            subClassification: this.subClassification,
            bookingId: this.bookingId,
          };

          if (
            bookingData.paymentStatus === 'HalfPaid' ||
            bookingData.paymentStatus === 'Completed' ||
            bookingData.paymentStatus === 'Paid'
          ) {
            this.bookingInformation = true;
            return;
          } else {
            this.pollForQuotePrices(requestBody);
            this.showFindingOperatorsMessage();
          }

          this.partnerService.getTopPartners(requestBody).subscribe(
            (response) => {
              if (response.success) {
                console.log(response.data);
                this.vendors = response.data
                  .filter((vendor: any) => vendor.bookingId === this.bookingId)
                  .map((vendor: any) => ({
                    name: vendor.partnerName,
                    price: vendor.quotePrice,
                    partnerId: vendor.partnerId,
                    oldQuotePrice: vendor.oldQuotePrice,
                  }));
              } else {
                this.toastr.info('No filtered vendors found.');
              }
            },
            (error) => {
              this.toastr.error('Failed to fetch top partners', error);
            }
          );
        } else {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch bookings');
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch bookings', error);
      }
    );
  }

  showFindingOperatorsMessage() {
    return this.toastr.info(
      'Wait for a while... Finding operators',
      'Message',
      {
        timeOut: 5000,
        progressBar: true,
        progressAnimation: 'increasing',
        onHidden: () => {
          if (this.polling) {
            this.toastr.info('Still searching for vendors...', 'Message', {
              disableTimeOut: true, // Keep the message displayed
              progressBar: true,
              progressAnimation: 'increasing',
            });
          }
        },
      } as Partial<IndividualConfig<any>>
    );
  }

  pollForQuotePrices(requestBody: any) {
    const pollInterval = 5000; // Poll every 5 seconds
    const pollTimeout = 3 * 60 * 1000; // 3 minutes in milliseconds
    let numVendorsNeeded = 3; // Number of vendors needed
    let numVendorsFetched = 0; // Number of vendors with prices fetched
    let toastrRef: ActiveToast<any> | undefined; // Store the ActiveToast reference
    let successToastShown = false; // To keep track if success message was shown

    const poll = () => {
      if (this.polling) {
        if (!toastrRef && !successToastShown) {
          // Show initial Toastr message if not already shown and success message has not been shown
          toastrRef = this.showFindingOperatorsMessage();
        } else if (numVendorsFetched > 0 && toastrRef) {
          // Update the Toastr message with the number of vendors fetched
          this.toastr.clear(toastrRef.toastId);
          toastrRef = this.toastr.info(
            `Found ${numVendorsFetched} out of ${numVendorsNeeded} vendors. Continuing to search...Wait for a while...`,
            'Message',
            {
              disableTimeOut: true, // Keep the message displayed
              progressBar: true,
              progressAnimation: 'increasing',
            }
          );
        }

        this.spinnerService.show(); // Show loading spinner

        this.partnerService.getTopPartners(requestBody).subscribe(
          (response) => {
            this.spinnerService.hide(); // Hide loading spinner

            if (response.success) {
              const vendorsWithPrices = response.data.filter(
                (vendor: any) => vendor.quotePrice !== null
              );
              if (vendorsWithPrices.length > 0) {
                this.vendors = vendorsWithPrices.map((vendor: any) => ({
                  name: vendor.partnerName,
                  price: vendor.quotePrice,
                  partnerId: vendor.partnerId,
                  oldQuotePrice: vendor.oldQuotePrice,
                }));

                // Count how many vendors with prices have been fetched
                numVendorsFetched = this.vendors.length;

                // Check if we have fetched enough vendors
                if (numVendorsFetched >= numVendorsNeeded) {
                  this.polling = false; // Stop polling
                  this.fetchedVendors = true;
                  if (toastrRef) {
                    this.toastr.clear(toastrRef.toastId); // Clear the Toastr message
                  }
                  this.toastr.success('Select your vendor and make a payment');
                  successToastShown = true; // Set the flag indicating success message was shown
                } else {
                  setTimeout(poll, pollInterval); // Continue polling
                }
              } else {
                setTimeout(poll, pollInterval); // No vendors found, continue polling
              }
            } else {
              this.toastr.info('No filtered vendors found.');
              setTimeout(poll, pollInterval); // Response not successful, continue polling
            }
          },
          (error) => {
            this.spinnerService.hide(); // Hide loading spinner on error
            if (toastrRef) {
              this.toastr.clear(toastrRef.toastId); // Clear the Toastr message on error
            }
            this.toastr.error('Failed to fetch top partners', error);
            this.polling = false; // Stop polling on error
          }
        );
      }
    };

    // Set a timeout to stop polling after 3 minutes
    setTimeout(() => {
      this.polling = false; // Stop polling
      if (toastrRef) {
        this.toastr.clear(toastrRef.toastId); // Clear the Toastr message
      }
      this.fetchedVendors = true;
      this.toastr.info('Now these vendors are only available. You can select.');
    }, pollTimeout);

    this.polling = true; // Start polling
    poll(); // Start polling initially
  }

  fetchBookings() {
    this.spinnerService.show();
    const userId = this.authService.getUserId();
    if (userId) {
      this.bookingService.getBookingByUserId(userId).subscribe(
        (response) => {
          if (response.success) {
            this.spinnerService.hide();
            this.bookings = response.data;
          } else {
            this.spinnerService.hide();
            this.toastr.error('Failed to fetch bookings');
          }
        },
        (error) => {
          this.toastr.error('Failed to fetch bookings');
          console.error('Error fetching bookings:', error);
        }
      );
    } else {
      this.spinnerService.hide();
      this.toastr.error('User ID not available');
    }
  }

  onSelect(vendor: any) {
    if (this.fetchedVendors) {
      this.selectedVendor = vendor;
      console.log('Selected vendor:', vendor);
    }
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

  makePayment(
    event: Event,
    amount: number,
    status: string,
    partnerId: string,
    oldQuotePrice: number
  ) {
    event.preventDefault();

    console.log(
      'Clicked "Pay" button with amount:',
      amount,
      'and status:',
      status
    );

    if (typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid payment amount or status');
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
      if (data.success && this.bookingId) {
        this.toastr.success(data.message);
        console.log(status);
        this.updateBookingPaymentStatus(
          this.bookingId,
          status,
          amount,
          partnerId,
          oldQuotePrice
        );
        if (status === 'Completed' || 'HalfPaid') {
          this.bookingInformation = true;
          window.location.reload();
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

  private updateBookingPaymentStatus(
    bookingId: string,
    status: string,
    amount: number,
    partnerId: string,
    oldQuotePrice: number
  ) {
    if (!bookingId || typeof amount !== 'number' || amount <= 0 || !status) {
      this.toastr.error('Invalid input for payment update');
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
          this.bookingInformation = true;
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

  getBookings(bookingId: string): void {
    // this.spinnerService.show();
    this.bookingService.getBookingsByBookingId(bookingId).subscribe(
      (response) => {
        if (response.success) {
          this.bookingDetails = response.data;
          this.getPartnerDetails(this.bookingDetails.partner);
        } else {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch bookings');
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch bookings', error);
      }
    );
  }

  getPartnerDetails(partnerId: string): void {
    this.partnerService.getPartnerDetails(partnerId).subscribe(
      (response) => {
        if (response.success) {
          this.partnerDetails = response.data;
          this.combineBookingAndPartnerDetails();
          this.spinnerService.hide();
        } else {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch partner details');
        }
      },
      (error) => {
        this.spinnerService.hide();
      }
    );
  }

  combineBookingAndPartnerDetails(): void {
    if (this.partnerDetails.operators && this.partnerDetails.operators.length > 0) {
      const operator = this.partnerDetails.operators[0]; // Assuming you want the first operator
      this.combinedDetails = {
        booking: this.bookingDetails,
        partner: {
          ...this.partnerDetails,
          operatorFirstName: operator.firstName,
          operatorLastName: operator.lastName,
          operatorMobileNo: operator.mobileNo,
          unitClassificationName: operator.unitClassification,
          unitSubClassificationName: operator.subClassification,
        },
      };
    } else {
      this.combinedDetails = {
        booking: this.bookingDetails,
        partner: this.partnerDetails,
      };
    }
  }

}
