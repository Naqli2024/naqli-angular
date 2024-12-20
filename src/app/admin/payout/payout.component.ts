import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionInputComponent } from './transaction-input/transaction-input.component';

@Component({
  selector: 'app-payout',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, TranslateModule],
  templateUrl: './payout.component.html',
  styleUrl: './payout.component.css',
})

export class PayoutComponent implements OnInit {
  isInitialPayoutTab: boolean = true;
  isHourlyTab: boolean = false; // To track which tab is selected
  isWeeklyTab: boolean = false; // To track weekly tab selection
  isAllTab: boolean = true; // Set All tab as default
  bookings: any[] = [];
  filteredBookings: any[] = []; // To store filtered bookings
  users: { [key: string]: any } = {};
  partners: { [key: string]: any } = {};

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private partnerService: PartnerService
  ) {}

  ngOnInit() {
    this.bookingService
      .getAllBookings()
      .pipe(
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
                    console.error(
                      `Failed to fetch partner ${booking.partner}`,
                      error
                    );
                    return of(undefined);
                  })
                )
              : of(undefined)
          );

          return forkJoin([...userRequests, ...partnerRequests]);
        })
      )
      .subscribe((results) => {
        const userResults = results.slice(0, this.bookings.length) as (
          | any
          | undefined
        )[];
        const partnerResults = results.slice(this.bookings.length) as (
          | { success: boolean; data: any }
          | undefined
        )[];

        userResults.forEach((user, index) => {
          if (user) this.users[this.bookings[index].user] = user;
        });

        partnerResults.forEach((partnerResponse, index) => {
          if (partnerResponse && partnerResponse.success) {
            this.partners[this.bookings[index].partner] = partnerResponse.data;
          }
        });

        // Initially load all bookings
        this.filteredBookings = this.bookings;
      });

    // Set default to 'All' tab to show all bookings
    this.selectTimeRange('all');
  }

  selectTab(tab: string) {
    this.isInitialPayoutTab = tab === 'initialPayout';
  }

  selectTimeRange(range: string) {
    if (range === 'hourly') {
      this.isHourlyTab = true;
      this.isWeeklyTab = false;
      this.isAllTab = false;
      this.filterBookingsByTime('hourly');
    } else if (range === 'weekly') {
      this.isWeeklyTab = true;
      this.isHourlyTab = false;
      this.isAllTab = false;
      this.filterBookingsByTime('weekly');
    } else if (range === 'all') {
      this.isAllTab = true;
      this.isHourlyTab = false;
      this.isWeeklyTab = false;
      this.showAllBookings(); // Show all bookings
    }
  }

  filterBookingsByTime(range: string) {
    const now = new Date().getTime();
    let timeLimit;

    if (range === 'hourly') {
      timeLimit = now - 60 * 60 * 1000; // 1 hour ago
    } else if (range === 'weekly') {
      timeLimit = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    }

    // Filter bookings based on the createdAt timestamp
    this.filteredBookings = this.bookings.filter((booking) => {
      const createdAt = new Date(booking.createdAt).getTime();
      return createdAt >= timeLimit;
    });
  }

  showAllBookings() {
    // Show all bookings without filtering
    this.filteredBookings = this.bookings;
  }
}