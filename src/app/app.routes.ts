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
import { AuthGuard, LoginGuard } from './guards/auth.guard';
import { OverviewComponent } from './admin/overview/overview.component';
import { SupportTicketsComponent } from './admin/support-tickets/support-tickets.component';
import { PartnerAdminComponent } from './admin/partner-admin/partner-admin.component';
import { AdminPaymentComponent } from './admin/admin-payment/admin-payment.component';
import { PayoutComponent } from './admin/payout/payout.component';
import { AdminNotificationManagementComponent } from './admin/admin-notification-management/admin-notification-management.component';
import { AdminUserComponent } from './admin/admin-user/admin-user.component';
import { NaqleeUserComponent } from './admin/naqlee-user/naqlee-user.component';
import { CompanyDetailsComponent } from './partner/auth/register/company-details/company-details.component';
import { MultipleUnitDashboardComponent } from './partner/dashboard/multiple-unit-dashboard/multiple-unit-dashboard.component';
import { BookingsComponent } from './partner/dashboard/bookings/bookings.component';
import { BookingManagementComponent } from './partner/dashboard/booking-management/booking-management.component';
import { ContractComponent } from './partner/dashboard/contract/contract.component';
import { CommissionComponent } from './admin/commission/commission.component';
import { SuperUserDashboardComponent } from './dashboard/super-user-dashboard/super-user-dashboard.component';
import { TriggerBookingComponent } from './dashboard/trigger-booking/trigger-booking.component';
import { BookingManagerComponent } from './dashboard/booking-manager/booking-manager.component';
import { SuperUserPaymentsComponent } from './dashboard/super-user-payments/super-user-payments.component';
import { PaymentSuccessfulComponent } from './dashboard/booking/payment-successful/payment-successful.component';
import { EditProfileComponent } from './dashboard/profile/edit-profile/edit-profile.component';
import { EditProfilePartnerComponent } from './partner/dashboard/edit-profile-partner/edit-profile-partner.component';
import { InvoiceComponent } from './admin/invoice/invoice.component';
import { InvoiceUserComponent } from './dashboard/invoice/invoiceUser.component';
import { InvoiceModalComponent } from './dashboard/invoice/invoice-modal/invoice-modal.component';
import { LoaderComponent } from './mobileLoader/loader.component';
import { PrivacyPolicyComponent } from './auth/privacy-policy/privacy-policy.component';
import { DeleteUserComponent } from './dashboard/delete-user/delete-user.component';
import { DeleteAccountInfoComponent } from './home/delete-account-info/delete-account-info.component';
import { EditCompanyDetailsComponent } from './partner/auth/register/company-details/edit-company-details/edit-company-details.component';
import { SharedCargoComponent } from './home/bookings/shared-cargo/shared-cargo.component';

export const routes: Routes = [
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: '', redirectTo: '/home/user', pathMatch: 'full' },
  { path: 'delete-account', component: DeleteAccountInfoComponent },
  {
    path: 'home/user',
    component: HomeComponent,
  },
  {
    path: 'home/user/vehicle',
    component: VehicleBookingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home/user/bus',
    component: BusBookingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home/user/equipment',
    component: EquipmentBookingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home/user/special',
    component: SpecialComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home/user/shared-cargo',
    component: SharedCargoComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home/user/others',
    component: OthersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home/user/payment-result',
    component: PaymentSuccessfulComponent,
  },
  {
    path: 'home/user/privacy-policy',
    component: PrivacyPolicyComponent,
  },
  { path: 'home/user/invoice-data', component: InvoiceModalComponent },
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
      { path: 'booking-history', component: BookingHistoryComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'report', component: ReportComponent },
      { path: 'help', component: HelpComponent },
      { path: 'edit-profile', component: EditProfileComponent },
      { path: 'invoice', component: InvoiceUserComponent },
      { path: 'deleteUser', component: DeleteUserComponent },

      {
        path: 'admin/overview',
        component: OverviewComponent,
        canActivate: [AuthGuard],
      },
      { path: 'admin/tickets', component: SupportTicketsComponent },
      { path: 'admin/user', component: AdminUserComponent },
      { path: 'admin/partner', component: PartnerAdminComponent },
      { path: 'admin/payments', component: AdminPaymentComponent },
      { path: 'admin/payout', component: PayoutComponent },
      {
        path: 'admin/notification-management',
        component: AdminNotificationManagementComponent,
      },
      { path: 'admin/naqlee-user', component: NaqleeUserComponent },
      { path: 'admin/commission', component: CommissionComponent },
      { path: 'admin/invoice', component: InvoiceComponent },
      {
        path: 'super-user/dashboard',
        component: SuperUserDashboardComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'super-user/trigger-booking',
        component: TriggerBookingComponent,
      },
      {
        path: 'super-user/booking-manager',
        component: BookingManagerComponent,
      },
      { path: 'super-user/payments', component: SuperUserPaymentsComponent },
      { path: 'help', component: HelpComponent },
    ],
  },
  { path: 'home/partner', component: PartnerComponent },
  { path: 'home/partner/register', component: RegisterComponent },
  { path: 'home/partner/operator', component: OperatorComponent },
  { path: 'home/partner/company-details', component: CompanyDetailsComponent },
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
      { path: 'edit-profile/partner', component: EditProfilePartnerComponent },
      {
        path: 'edit-profile/partner/edit-company-details',
        component: EditCompanyDetailsComponent,
      },
      {
        path: 'multiple-unit-dashboard',
        component: MultipleUnitDashboardComponent,
      },
      { path: 'bookings', component: PartnerBookingComponent },
      { path: 'booking-management', component: BookingManagementComponent },
      { path: 'contract', component: ContractComponent },
      {
        path: 'booking/confirm-payment',
        component: PaymentConfirmationComponent,
      },
    ],
  },
  { path: 'payment/results', component: LoaderComponent },
];
