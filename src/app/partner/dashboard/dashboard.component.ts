import { Component } from '@angular/core';
import { ProfileComponent } from '../../dashboard/profile/profile.component';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PartnerBookingComponent } from './booking/booking.component';
import { PartnerPaymentComponent } from './payment/payment.component';
import { PartnerReportComponent } from './report/report.component';
import { PartnerHelpComponent } from './help/help.component';
import { PartnerService } from '../../../services/partner/partner.service';
import { MultipleUnitDashboardComponent } from './multiple-unit-dashboard/multiple-unit-dashboard.component';
import { BookingsComponent } from './bookings/bookings.component';
import { UnitManagementComponent } from './unit-management/unit-management.component';
import { OperatorManagementComponent } from './operator-management/operator-management.component';
import { BookingComponent } from '../../dashboard/booking/booking.component';
import { ContractComponent } from './contract/contract.component';


interface MenuItem {
  name: string;
  route: string;
}

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
    PartnerHelpComponent,
    MultipleUnitDashboardComponent,
    BookingsComponent,
    UnitManagementComponent,
    OperatorManagementComponent,
    BookingComponent,
    ContractComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class PartnerDashboardComponent {
  menuItems: MenuItem[] = [];

  constructor(
    private partnerService: PartnerService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const partnerId = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe((partner) => {
        if (partner.data.type === 'singleUnit + operator') {
          this.menuItems = [
            { name: 'Booking', route: 'booking' },
            { name: 'Payment', route: 'payments' },
            { name: 'Report', route: 'report' },
            { name: 'Help', route: 'help' },
          ];
        } else if (partner.data.type === 'multipleUnits') {
          this.menuItems = [
            { name: 'Dashboard', route: 'multiple-unit-dashboard' },
            { name: 'Bookings', route: 'bookings' },
            { name: 'Unit Management', route: 'unit-management' },
            { name: 'Operator Management', route: 'operator-management' },
            { name: 'Booking Management', route: 'booking-management' },
            { name: 'Payment', route: 'payments' },
            { name: 'Report', route: 'report' },
          ];
        }
      });
    }
  }
}
