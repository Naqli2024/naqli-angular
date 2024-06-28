import { Component } from '@angular/core';
import { ProfileComponent } from '../profile/profile.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookingComponent } from '../booking/booking.component';
import { BookingHistoryComponent } from '../booking-history/booking-history.component';
import { PaymentsComponent } from '../payments/payments.component';
import { ReportComponent } from '../report/report.component';
import { HelpComponent } from '../help/help.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    ProfileComponent,
    BookingComponent,
    BookingHistoryComponent,
    PaymentsComponent,
    ReportComponent,
    HelpComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent{
  menuItems = [
    { name: 'Booking', route: 'booking' },
    { name: 'Booking History', route: 'booking-history' },
    { name: 'Payments', route: 'payments' },
    { name: 'Report', route: 'report' },
    { name: 'Help', route: 'help' },
  ];
}
