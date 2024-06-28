import { Component } from '@angular/core';
import { Booking } from '../../../models/booking.model';
import { BookingService } from '../../../services/booking.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent {
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
