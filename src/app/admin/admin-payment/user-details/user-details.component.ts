import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../../../../services/booking.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../../services/partner/partner.service';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../../map/map.component';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  @Input() bookingId!: string;
  bookingDetails: any = null;
  partnerDetails: any = null;
  combinedDetails: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    public router: Router,
    private bookingService: BookingService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private partnerService: PartnerService
  ) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
    this.router.navigate(['/home/user/dashboard/admin/payments']);
  }

  ngOnInit(): void {
    this.getBookings(this.bookingId);
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
    if (
      this.partnerDetails.operators &&
      this.partnerDetails.operators.length > 0
    ) {
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
