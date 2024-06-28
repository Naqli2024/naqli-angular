import { Routes } from '@angular/router';
import { PartnerComponent } from './partner/partner/partner.component';
import { HomeComponent } from './home/home.component';
import { VehicleBookingComponent } from './home/bookings/vehicle-booking/vehicle-booking.component';
import { BusBookingComponent } from './home/bookings/bus-booking/bus-booking.component';
import { EquipmentBookingComponent } from './home/bookings/equipment-booking/equipment-booking.component';
import { SpecialComponent } from './home/bookings/special/special.component';
import { OthersComponent } from './home/bookings/others/others.component';
import { BookingComponent } from './dashboard/booking/booking.component';
import { BookingHistoryComponent } from './dashboard/booking-history/booking-history.component';
import { PaymentsComponent } from './dashboard/payments/payments.component';
import { ReportComponent } from './dashboard/report/report.component';
import { HelpComponent } from './dashboard/help/help.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { MakePaymentComponent } from './dashboard/booking/make-payment/make-payment.component';
import { VechileEstimateComponent } from './home/open-get-estimate/vechile-estimate/vechile-estimate.component';
import { ConfirmEstimateComponent } from './home/open-get-estimate/confirm-estimate/confirm-estimate.component';
import { BusEstimateComponent } from './home/open-get-estimate/bus-estimate/bus-estimate.component';
import { EquipmentEstimateComponent } from './home/open-get-estimate/equipment-estimate/equipment-estimate.component';
import { SpecialEstimateComponent } from './home/open-get-estimate/special-estimate/special-estimate.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { RegisterComponent } from './partner/auth/register/register.component';
import { OperatorComponent } from './partner/auth/register/operator/operator.component';
import { LoginComponent } from './partner/auth/login/login.component';
import { PartnerDashboardComponent } from './partner/dashboard/dashboard.component';
import { PartnerBookingComponent } from './partner/dashboard/booking/booking.component';
import { UnitManagementComponent } from './partner/dashboard/unit-management/unit-management.component';
import { OperatorManagementComponent } from './partner/dashboard/operator-management/operator-management.component';
import { PartnerPaymentComponent } from './partner/dashboard/payment/payment.component';
import { PartnerReportComponent } from './partner/dashboard/report/report.component';
import { PartnerHelpComponent } from './partner/dashboard/help/help.component';
import { PaymentConfirmationComponent } from './partner/dashboard/booking/payment-confirmation/payment-confirmation.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: '', redirectTo: '/home/user', pathMatch: 'full' },
  {
    path: 'home/user',
    component: HomeComponent,
  },
  { path: 'home/user/vehicle', component: VehicleBookingComponent, canActivate: [AuthGuard] },
  { path: 'home/user/bus', component: BusBookingComponent, canActivate: [AuthGuard] },
  { path: 'home/user/equipment', component: EquipmentBookingComponent, canActivate: [AuthGuard] },
  { path: 'home/user/special', component: SpecialComponent, canActivate: [AuthGuard] },
  { path: 'home/user/others', component: OthersComponent, canActivate: [AuthGuard] },
  { path: 'home/user/vehicle-estimate', component: VechileEstimateComponent },
  { path: 'home/user/bus-estimate', component: BusEstimateComponent },
  {
    path: 'home/user/equipment-estimate',
    component: EquipmentEstimateComponent,
  },
  { path: 'home/user/special-estimate', component: SpecialEstimateComponent },
  { path: 'home/user/confirm-estimate', component: ConfirmEstimateComponent },
  {
    path: 'home/user/dashboard',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'booking', pathMatch: 'full' },
      { path: 'booking', component: BookingComponent },
      { path: 'booking/make-payment', component: MakePaymentComponent },
      { path: 'booking-history', component: BookingHistoryComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'report', component: ReportComponent },
      { path: 'help', component: HelpComponent },
    ],
  },
  { path: 'home/partner', component: PartnerComponent },
  { path: 'home/partner/register', component: RegisterComponent },
  { path: 'home/partner/operator', component: OperatorComponent },
  { path: 'home/partner/login', component: LoginComponent },
  {
    path: 'home/partner/dashboard',
    component: PartnerDashboardComponent,
    children: [
      { path: '', redirectTo: 'booking', pathMatch: 'full' },
      { path: 'booking', component: PartnerBookingComponent },
      { path: 'unit-management', component: UnitManagementComponent },
      { path: 'operator-management', component: OperatorManagementComponent },
      { path: 'payments', component: PartnerPaymentComponent },
      { path: 'report', component: PartnerReportComponent },
      { path: 'help', component: PartnerHelpComponent },
      { path: 'booking/confirm-payment', component: PaymentConfirmationComponent },
    ],
  },
];
