import { Component } from '@angular/core';
import { ProfileComponent } from '../profile/profile.component';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    ProfileComponent,
    TranslateModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  menuItems: { name: string; route: string }[] = [];
  isAdmin: boolean = false; // Initial value
  accountType: string = '';

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userService.getUserById(userId).subscribe((user: User) => {
        this.isAdmin = user.isAdmin;
        this.accountType = user.accountType;
        this.setMenuItems();
      });
    } else {
      this.setMenuItems();
      this.router.navigate(['/home/user/dashboard/booking']);
    }
  }

  setMenuItems(): void {
    if (this.accountType === 'Super User') {
      this.menuItems = [
        { name: 'Dashboard', route: 'super-user/dashboard' },
        { name: 'Trigger Booking', route: 'super-user/trigger-booking' },
        { name: 'Booking Manager', route: 'super-user/booking-manager' },
        { name: 'Payments', route: 'super-user/payments' },
        { name: 'Report', route: 'report' },
        { name: 'Help', route: 'help' },
        { name: 'Invoice', route: 'invoice' },
      ];
    } else if (this.isAdmin) {
      this.menuItems = [
        { name: 'Overview', route: 'admin/overview' },
        { name: 'Support tickets', route: 'admin/tickets' },
        { name: 'User', route: 'admin/user' },
        { name: 'Partner', route: 'admin/partner' },
        { name: 'Payments', route: 'admin/payments' },
        { name: 'Payout', route: 'admin/payout' },
        {
          name: 'Notification Management',
          route: 'admin/notification-management',
        },
        { name: 'Naqlee User', route: 'admin/naqlee-user' },
        { name: 'Commission', route: 'admin/commission' },
        { name: 'Invoice', route: 'admin/invoice' },
      ];
    } else {
      this.menuItems = [
        { name: 'Booking', route: 'booking' },
        { name: 'Booking History', route: 'booking-history' },
        { name: 'Payments', route: 'payments' },
        { name: 'Report', route: 'report' },
        { name: 'Help', route: 'help' },
        { name: 'Invoice', route: 'invoice' },
      ];
    }
  }
}
