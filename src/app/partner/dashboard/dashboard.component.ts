import { Component } from '@angular/core';
import { ProfileComponent } from '../../dashboard/profile/profile.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PartnerBookingComponent } from './booking/booking.component';
import { UnitManagementComponent } from './unit-management/unit-management.component';
import { OperatorManagementComponent } from './operator-management/operator-management.component';
import { PartnerPaymentComponent } from './payment/payment.component';
import { PartnerReportComponent } from './report/report.component';
import { PartnerHelpComponent } from './help/help.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    ProfileComponent,
    PartnerBookingComponent,
    PartnerPaymentComponent,
    PartnerReportComponent,
    PartnerHelpComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class PartnerDashboardComponent {
  menuItems = [
    { name: 'Booking', route: 'booking' },
    { name: 'Payment', route: 'payments' },
    { name: 'Report', route: 'report' },
    { name: 'Help', route: 'help' },
  ];
}
