import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { User } from '../../../../models/user.model';
import { Booking } from '../../../../models/booking.model';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { PartnerService } from '../../../../services/partner/partner.service';
import { BookingService } from '../../../../services/booking.service';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../../services/user.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PartnerPaymentComponent {
  bookings: Booking[] = [];
  users: User[] = []; // To store user details by userId
  partnerId: string = '';
  partner: any;
  bookingId: string = '';
  bookingRequests: string[] = [];

  constructor(
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
    private partnerService: PartnerService,
    private bookingService: BookingService,
    private userService: UserService
  ){}

  ngOnInit(): void {
    this.partnerId = this.getPartnerId();
    this.getPartnerDetails();
  }

  getPartnerId(): string {
    return localStorage.getItem('partnerId') || '';
  }

  getPartnerDetails() {
    this.spinnerService.show();
    this.partnerService.getPartnerDetails(this.partnerId).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        this.partner = response.data;
  
        if (this.partner) {
          // Ensure the structure of operators is correctly accessed
          this.bookingRequests = this.partner.operators.reduce((acc: any[], operator: any) => {
            // Check if 'operatorDetails' exists and has 'bookingRequest'
            if (operator.operatorsDetail && operator.operatorsDetail.length) {
              operator.operatorsDetail.forEach((operatorDetail: any) => {
                if (operatorDetail.bookingRequest && operatorDetail.bookingRequest.length) {
                  operatorDetail.bookingRequest.forEach((booking: any) => {
                    if (booking.bookingId) {
                      acc.push(booking.bookingId);
                    }
                  });
                }
              });
            }
            return acc;
          }, []);
  
          // If the bookingRequests were found at the partner level
          if (!this.bookingRequests.length && this.partner.bookingRequest) {
            this.partner.bookingRequest.forEach((booking: any) => {
              if (booking.bookingId) {
                this.bookingRequests.push(booking.bookingId);
              }
            });
          }
  
          // If there are any booking IDs, fetch booking details
          if (this.bookingRequests.length > 0) {
            this.getBookingsByBookingId();
          } else {
            // Handle the case when no booking requests are found
            this.toastr.info('No booking requests found for this partner.');
          }
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error('Failed to fetch partner details');
        console.error('Error fetching partner details', error);
      }
    );
  }

  getBookingsByBookingId() {
    const bookingObservables = this.bookingRequests.map((bookingId: string) =>
      this.bookingService.getBookingsByBookingId(bookingId)
    );

    // this.spinnerService.show();
    forkJoin(bookingObservables).subscribe(
      (responses: any[]) => {
        this.spinnerService.hide();
        this.bookings = responses.map((response) => response.data);
        this.bookings = this.bookings.flat();
        this.fetchUsers();
      },
      (error) => {
        this.spinnerService.hide();
        console.error('Error fetching bookings', error);
      }
    );
  }

  fetchUsers() {
    this.spinnerService.show();
    const userIds = this.bookings
      .map((booking) => booking.user)
      .filter((value, index, self) => value && self.indexOf(value) === index);

    if (userIds.length > 0) {
      const userObservables = userIds.map((userId) =>
        this.userService.getUserById(userId)
      );

      forkJoin(userObservables).subscribe(
        (users: any[]) => {
          this.spinnerService.hide();
          this.users = users.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
          }, {});
        },
        (error) => {
          this.spinnerService.hide();
          this.toastr.error('Failed to fetch user details');
          console.error('Error fetching user details', error);
        }
      );
    }
  }
}
