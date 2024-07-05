import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { Booking } from '../../../models/booking.model';
import { CommonModule } from '@angular/common';
import { SpinnerService } from '../../../services/spinner.service';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-history.component.html',
  styleUrl: './booking-history.component.css',
})
export class BookingHistoryComponent implements OnInit {
  bookings: Booking[] = [];

  constructor(
    private bookingService: BookingService,
    private toastr: ToastrService, 
    private authService: AuthService,
    private spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    this.fetchCompletedBookings();
  }

  fetchCompletedBookings() {
    this.spinnerService.show();
    const userId = this.authService.getUserId();
    if (userId) {
      this.bookingService.getCompletedBookingsByUser(userId).subscribe(
        (response) => {
          this.spinnerService.hide();
          if (response.success) {
            this.bookings = response.data;
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
    } else {
      this.toastr.error('User ID not available');
    }
  }
}
