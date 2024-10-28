import { Component } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { HeaderComponent } from './header/header/header.component';
import { PartnerComponent } from './partner/partner/partner.component';
import { HomeComponent } from './home/home.component';
import { HttpClientModule } from '@angular/common/http';
import { GoogleMapsModule } from '@angular/google-maps';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { BookingComponent } from './dashboard/booking/booking.component';
import { BookingHistoryComponent } from './dashboard/booking-history/booking-history.component';
import { PaymentsComponent } from './dashboard/payments/payments.component';
import { ReportComponent } from './dashboard/report/report.component';
import { HelpComponent } from './dashboard/help/help.component';
import { ProfileComponent } from './dashboard/profile/profile.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { RegisterComponent } from './partner/auth/register/register.component';
import { MapComponent } from './map/map.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    HomeComponent,
    PartnerComponent,
    RouterModule,
    HttpClientModule,
    GoogleMapsModule,
    DashboardComponent,
    BookingComponent,
    BookingHistoryComponent,
    PaymentsComponent,
    ReportComponent,
    HelpComponent,
    ProfileComponent,
    SpinnerComponent,
    RegisterComponent,
    MapComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    TranslateModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'naqli';

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.urlAfterRedirects === '/home/partner') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('firstName');
          localStorage.removeItem('lastName');
          localStorage.removeItem('userId');
        }
      }
    });
  }
}
