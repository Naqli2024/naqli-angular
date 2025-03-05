import { Component } from '@angular/core';
import { BookingService } from '../../../services/booking.service';
import { UserService } from '../../../services/user.service';
import { PartnerService } from '../../../services/partner/partner.service';
import { Booking } from '../../../models/booking.model';
import { User } from '../../../models/user.model';
import { Partner } from '../../../models/partnerData.model';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserDetailsComponent } from './user-details/user-details.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-payment',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './admin-payment.component.html',
  styleUrl: './admin-payment.component.css'
})
export class AdminPaymentComponent {
  bookingsWithDetails: any[] = [];

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private partnerService: PartnerService,
    private modalService: NgbModal,
    private translate: TranslateService, 
    private spinnerService: SpinnerService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getBookingsWithDetails().subscribe(data => {
      this.bookingsWithDetails = data;
    });
  }

  getBookingsWithDetails(): Observable<any[]> {
    this.spinnerService.show(); // Show spinner before request starts

    return this.bookingService.getAllBookings().pipe(
      switchMap((bookings: any[]) => {
        if (!bookings.length) {
          this.spinnerService.hide(); // Hide spinner if there are no bookings
          return of([]); // Return an empty array if no bookings exist
        }

        const userRequests = bookings.map(booking => 
          booking.user ? this.userService.getUserById(booking.user) : of(null)
        );
        const partnerRequests = bookings.map(booking => 
          booking.partner ? this.partnerService.getPartnerDetails(booking.partner) : of(null)
        );

        return forkJoin([...userRequests, ...partnerRequests]).pipe(
          map(results => {
            const users = results.slice(0, bookings.length);
            const partners = results.slice(bookings.length);

            const enrichedBookings = bookings.map((booking, index) => ({
              booking,
              user: users[index],
              partner: partners[index]
            }));

            this.spinnerService.hide(); // Hide spinner after successful response
            return enrichedBookings;
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching bookings with details:', error);
        this.spinnerService.hide(); 
        this.toastr.error('Failed to load booking details', 'Error');
        return of([]); 
      })
    );
}

  userBookingDetails(bookingId: string): void {
    const modalRef = this.modalService.open(UserDetailsComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
    modalRef.componentInstance.bookingId = bookingId;
  }

  getTranslatedName(name: string): string {
    const categories = ['vehicleName', 'busNames', 'equipmentName', 'specialUnits'];
    for (let category of categories) {
      const translationKey = `${category}.${name}`;
      if (this.translate.instant(translationKey) !== translationKey) {
        return this.translate.instant(translationKey);
      }
    }
    return name; 
  }
}
