import { Component } from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { UserService } from '../../../services/user.service';
import { PartnerService } from '../../../services/partner/partner.service';
import { Booking } from '../../../models/booking.model';
import { User } from '../../../models/user.model';
import { Partner } from '../../../models/partnerData.model';
import { forkJoin, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-payment.component.html',
  styleUrl: './admin-payment.component.css'
})
export class AdminPaymentComponent {
  bookingsWithDetails: any[] = [];

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private partnerService: PartnerService
  ) {}

  ngOnInit(): void {
    this.getBookingsWithDetails().subscribe(data => {
      this.bookingsWithDetails = data;
    });
  }

  getBookingsWithDetails(): Observable<any[]> {
    return this.bookingService.getAllBookings().pipe(
      switchMap((bookings: any[]) => {
        const userRequests = bookings.map(booking => this.userService.getUserById(booking.user));
        const partnerRequests = bookings.map(booking => this.partnerService.getPartnerDetails(booking.partner));

        return forkJoin([...userRequests, ...partnerRequests]).pipe(
          map(results => {
            const users = results.slice(0, bookings.length);
            const partners = results.slice(bookings.length);

            return bookings.map((booking, index) => ({
              booking,
              user: users[index],
              partner: partners[index]
            }));
          })
        );
      })
    );
  }
}
