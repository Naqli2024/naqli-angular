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
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
    this.bookingService
      .getAllBookings()
      .pipe(
        switchMap((bookings) => {
          this.bookings = bookings;

          const userRequests = bookings.map((booking) =>
            this.userService.getUserById(booking.user)
          );
          const partnerRequests = bookings.map((booking) =>
            this.partnerService.getPartnerDetails(booking.partner)
          );

          return forkJoin([...userRequests, ...partnerRequests]);
        })
      )
      .subscribe((results) => {
        const userResults = results.slice(0, this.bookings.length) as User[];
        const partnerResults = results.slice(this.bookings.length);

        userResults.forEach((user) => (this.users[user._id] = user));
        partnerResults.forEach((result) => {
          if (result) {
            const partner = result.data;
            this.partners[partner._id] = partner;
          }
        });
      });
  }

  selectTab(tab: string) {
    this.isInitialPayoutTab = tab === 'initialPayout';
  }
}
