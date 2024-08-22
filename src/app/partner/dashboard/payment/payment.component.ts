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

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
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
        if (this.partner && this.partner.operators) {
          this.bookingRequests = this.partner.operators.reduce(
            (acc: any[], operator: any) => {
              if (operator.bookingRequest && operator.bookingRequest.length) {
                operator.bookingRequest.forEach((booking: any) => {
                  if (booking.bookingId) {
                    acc.push(booking.bookingId);
                  }
                });
              }
              return acc;
            },
            []
          );
          this.getBookingsByBookingId();
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
        console.log(this.bookings);
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
