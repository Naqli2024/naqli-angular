import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { Booking } from '../../../models/booking.model';
import { CommonModule } from '@angular/common';

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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchCompletedBookings();
  }

  fetchCompletedBookings() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.bookingService.getCompletedBookingsByUser(userId).subscribe(
        (response) => {
          if (response.success) {
            this.bookings = response.data;
            console.log(this.bookings)
          } else {
            this.toastr.error('Failed to fetch bookings');
          }
        },
        (error) => {
          this.toastr.error('Failed to fetch bookings');
          console.error('Error fetching bookings:', error);
        }
      );
    } else {
      this.toastr.error('User ID not available');
    }
  }
}
