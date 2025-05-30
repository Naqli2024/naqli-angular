import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../../../../services/booking.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../../services/partner/partner.service';
import { CommonModule } from '@angular/common';
import { GoogleMapsService } from '../../../../services/googlemap.service';
import { MapService } from '../../../../services/map.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  @Input() bookingId!: string;
  bookingDetails: any = null;
  partnerDetails: any = null;
  combinedDetails: any = null;
  operatorId: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    public router: Router,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private partnerService: PartnerService,
    private mapService: MapService,
    private googleMapsService: GoogleMapsService
  ) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
    this.router.navigate(['/home/user/dashboard/admin/payments']);
  }

  ngOnInit(): void {
    this.getBookings(this.bookingId);
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

  getBookings(bookingId: string): void {
    this.bookingService.getBookingsByBookingId(bookingId).subscribe(
      (response) => {
        if (response.success) {
          this.bookingDetails = response.data;
          // console.log('Booking Details:', this.bookingDetails); // Debugging
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
    if (this.bookingDetails && this.partnerDetails) {
      // Combine unitType and name
      const unitTypeName = this.bookingDetails.unitType;
      const unitName = this.bookingDetails.name;
      
      this.combinedDetails = {
        booking: {
          ...this.bookingDetails,
          unitTypeName: unitTypeName,
          unitName: unitName
        },
        partner: this.partnerDetails
      };
  
      console.log('Combined Details:', this.combinedDetails);
    } else {
      this.combinedDetails = {
        booking: this.bookingDetails,
        partner: this.partnerDetails
      };
    }
    this.extractOperatorId();
  }

  getOperatorNameFromBooking(bookingRequests: any[] | null, bookingId: string): string {
    if (!bookingRequests || !Array.isArray(bookingRequests)) {
      console.warn('Booking requests are null or undefined');
      return 'N/A';
    }
  
    const booking = bookingRequests.find(
      (request) => request.bookingId === bookingId
    );
    return booking?.assignedOperator?.operatorName ?? 'N/A';
  }
  
  getOperatorMobileFromBooking(bookingRequests: any[] | null, bookingId: string): string {
    if (!bookingRequests || !Array.isArray(bookingRequests)) {
      console.warn('Booking requests are null or undefined');
      return 'N/A';
    }
  
    const booking = bookingRequests.find(
      (request) => request.bookingId === bookingId
    );
    return booking?.assignedOperator?.operatorMobileNo ?? 'N/A';
  }

  extractOperatorId(): void {
    const partner = this.combinedDetails?.partner;
  
    if (!partner || !partner.type) {
      console.warn('Partner details not found');
      return;
    }
  
    if (partner.type === 'singleUnit + operator') {
      const operatorDetail = partner.operators?.[0]?.operatorsDetail?.[0];
      if (operatorDetail && operatorDetail._id) {
        this.operatorId = operatorDetail._id;
      } else {
        console.warn('Operator details not found for singleUnit + operator');
      }
    } else if (partner.type === 'multipleUnits') {
      const booking = partner.bookingRequest?.find(
        (request: any) => request.bookingId === this.bookingId
      );
      if (booking?.assignedOperator?.operatorId) {
        this.operatorId = booking.assignedOperator.operatorId;
      } else {
        console.warn('Operator ID not found in booking for multipleUnits');
      }
    }
       // Call the API only after operatorId is set
   this.mapService.markDriverLocation(partner._id, this.operatorId);
   console.log("PartnerId:", partner._id);
   console.log("OperatorId:", this.operatorId);
  }
}
