import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../../../services/booking.service';
import { User } from '../../../../../models/user.model';
import { Observable } from 'rxjs';
import { UserService } from '../../../../../services/user.service';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OpenPartnerRequestPaymentComponent } from './open-partner-request-payment/open-partner-request-payment.component';
import { PartnerService } from '../../../../../services/partner/partner.service';
import { Booking } from '../../../../../models/booking.model';
import { MapService } from '../../../../../services/map.service';
import { GoogleMapsService } from '../../../../../services/googlemap.service';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrl: './payment-confirmation.component.css',
})
export class PaymentConfirmationComponent implements OnInit {
  bookingId: string = '';
  bookingDetails: any;
  user$!: Observable<User>;
  additionalCharges: number | null = null;
  additionalChargesReason = [];
  bookings: Booking[] = [];
  partnerId: string = '';
  isPaymentSuccessful:boolean = false;

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private userService: UserService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private partnerService: PartnerService,
    private router: Router,
    private mapService: MapService,
    private googleMapsService: GoogleMapsService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.bookingId = params['bookingId'];
      this.bookingService.getBookingsByBookingId(this.bookingId).subscribe(
        (data) => {
          this.bookingDetails = data.data;
          console.log(this.bookingDetails)
          if (this.bookingDetails.user) {
            // Call service method to fetch user details
            this.user$ = this.userService.getUserById(this.bookingDetails.user);
          } else {
            console.error('User ID not found in booking details');
          }
        },
        (error) => {
          console.error('Error fetching booking details:', error);
        }
      );
    });
    this.partnerId = this.getPartnerId();
    this.googleMapsService.loadGoogleMapsScript();
    // Define the global initMap function
    (window as any).initMap = () => {
      this.mapService.initializeMapInContainer('mapContainer');
    };
  }

  updateRoute(): void {
    // Check if pickup and at least one drop point are set
    if (
      this.bookingDetails.pickup &&
      this.bookingDetails.dropPoints.length > 0
    ) {
      const start = this.bookingDetails.pickup;
      const waypoints = this.bookingDetails.dropPoints.slice(0, -1); // All except the last one
      const end =
        this.bookingDetails.dropPoints[
          this.bookingDetails.dropPoints.length - 1
        ]; // Last drop point
      this.mapService.calculateRoute(start, waypoints, end);
    }
  }

  checkPaymentStatus() {
    const paymentSuccessful =
      (this.bookingDetails.paymentStatus === 'Completed' || this.bookingDetails.paymentStatus === 'Paid') &&
      this.bookingDetails.remainingBalance === 0;
  
    if (paymentSuccessful) {
      this.isPaymentSuccessful = true;
    } else {
      this.isPaymentSuccessful = false; 
    }
  }

  getPartnerId(): string {
    return localStorage.getItem('partnerId') || '';
  }

  requestPayment(): void {
    this.spinnerService.show();
    const payload = {
      additionalCharges: this.additionalCharges,
      reason: this.additionalChargesReason,
    };

    this.bookingService.addAdditionalCharges(this.bookingId, payload).subscribe(
      (response: any) => {
        if (response.success) {
          this.spinnerService.hide();
          this.bookingDetails = response.booking;

          // Update additional charges and reason
          this.additionalCharges = this.bookingDetails.additionalCharges;
          this.additionalChargesReason =
          this.bookingDetails.additionalChargesReason;
          this.openPartnerRequestPayment(this.bookingId);
          this.checkPaymentStatus();
        } else {
          this.toastr.error(response.message);
        }
      },
      (error: any) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
      }
    );
  }

  openPartnerRequestPayment(bookingId: string): void {
    const modalRef = this.modalService.open(
      OpenPartnerRequestPaymentComponent,
      {
        size: 'xl',
        centered: true,
        backdrop: true,
        scrollable: true,
        windowClass: 'no-background',
      }
    );
    modalRef.componentInstance.bookingId = bookingId;
  }

  removeBooking(partnerId: string, bookingId: string) {
    this.spinnerService.show();
    this.partnerService.deletedBookingRequest(partnerId, bookingId).subscribe(
      (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        // Optionally, remove the booking from the local bookings array
        this.bookings = this.bookings.filter(
          (booking) => booking._id !== bookingId
        );
        this.router.navigate(['/home/partner/dashboard/booking']);
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error(error);
      }
    );
  }
}
