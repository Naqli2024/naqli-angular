import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Booking } from '../../../models/booking.model';
import { User } from '../../../models/user.model';
import { Partner } from '../../../models/partnerData.model';
import { BookingService } from '../../../services/booking.service';
import { UserService } from '../../../services/user.service';
import { PartnerService } from '../../../services/partner/partner.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-payout',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './payout.component.html',
  styleUrl: './payout.component.css',
})
export class PayoutComponent {
  isInitialPayoutTab: boolean = true;
  bookings: Booking[] = [];
  users: { [key: string]: User | undefined } = {};
  partners: { [key: string]: Partner | undefined } = {};
  faEdit = faEdit;
  faTrashAlt = faTrashAlt;

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private partnerService: PartnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.bookingService.getAllBookings().pipe(
      switchMap((bookings) => {
        this.bookings = bookings;
  
        const userRequests = bookings.map((booking) =>
          this.userService.getUserById(booking.user).pipe(
            catchError((error) => {
              console.error(`Failed to fetch user ${booking.user}`, error);
              return of(undefined);
            })
          )
        );
  
        const partnerRequests = bookings.map((booking) =>
          booking.partner
            ? this.partnerService.getPartnerDetails(booking.partner).pipe(
                catchError((error) => {
                  console.error(`Failed to fetch partner ${booking.partner}`, error);
                  return of(undefined);
                })
              )
            : of(undefined)
        );
  
        return forkJoin([...userRequests, ...partnerRequests]);
      })
    ).subscribe((results) => {
      const userResults = results.slice(0, this.bookings.length) as (User | undefined)[];
      const partnerResults = results.slice(this.bookings.length) as ({ success: boolean, data: Partner } | undefined)[];
  
      userResults.forEach((user, index) => {
        if (user) this.users[this.bookings[index].user] = user;
      });
  
      partnerResults.forEach((partnerResponse, index) => {
        if (partnerResponse && partnerResponse.success) {
          this.partners[this.bookings[index].partner] = partnerResponse.data;
        }
      });
    });
  }

  selectTab(tab: string) {
    this.isInitialPayoutTab = tab === 'initialPayout';
  }
}
