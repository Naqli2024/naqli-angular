import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../../../services/booking.service';
import { User } from '../../../../../models/user.model';
import { Observable } from 'rxjs';
import { UserService } from '../../../../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrl: './payment-confirmation.component.css',
})
export class PaymentConfirmationComponent implements OnInit {
  bookingId: string = '';
  bookingDetails: any;
  user$!: Observable<User>;

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.bookingId = params['bookingId'];

      this.bookingService.getBookingsByBookingId(this.bookingId).subscribe(
        (data) => {
          console.log(data.data);
          data.data.map(
            (bookingDetails: any) => (this.bookingDetails = bookingDetails)
          );

          if (this.bookingDetails.user) {
            // Call service method to fetch user details
            this.user$ = this.userService.getUserById(this.bookingDetails.user);
          } else {
            console.error('User ID not found in booking details');
          }
        },
        (error) => {
          console.error('Error fetching booking details:', error);
        }
      );
    });
  }
}
