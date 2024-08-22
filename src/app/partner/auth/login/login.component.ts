import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { AuthService } from '../../../../services/partner/auth.service';
import { OtpVerificationComponent } from '../otp-verification/otp-verification.component';
import { ForgetPasswordComponent } from '../forget-password/forget-password.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginData = {
    emailOrMobile: '',
    password: ''
  }

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
    private authService: AuthService
  ) {}

  login() {
    this.spinnerService.show();
    this.authService.login(this.loginData).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        if (response.success == true) {
          this.toastr.success(response.message, 'Success');
          this.resetForm();
          if(response.data.partner.type === "singleUnit + operator") {
            this.router.navigate(['home/partner/dashboard']);
          } else if(response.data.partner.type === 'multipleUnits') {
            this.router.navigate(['home/partner/dashboard/multiple-unit-dashboard']);
          }
          
        } else {
          if (response.message === 'Account not verified') {
            this.toastr.error(response.message, 'Error');
            this.otpVerificatoionModal();
          } else {
            this.toastr.error(response.message, 'Error');
          }
        }
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        if (errorMessage === 'Account not verified') {
          this.otpVerificatoionModal();
        } else {
          this.toastr.error(errorMessage, 'Error');
        }
      }
    );
  }

  otpVerificatoionModal(): void {
    const modalRef = this.modalService.open(OtpVerificationComponent, {
      size: 'xl',
      centered: true,
      scrollable: true,
      windowClass: 'no-background',
      backdropClass: 'no-background-backdrop',
    });
  }

  openForgetPasswordModal(event: MouseEvent): void {
    event.preventDefault();
    const modalRef = this.modalService.open(ForgetPasswordComponent, {
      size: 'xl',
      centered: true,
      scrollable: true,
      windowClass: 'no-background',
      backdropClass: 'no-background-backdrop',
    });
  }

  toggleForm(event: MouseEvent) {
    event.preventDefault();
    this.router.navigate(['/home/partner/register'])
  }

  resetForm() {
    this.loginData = {
      emailOrMobile: '',
      password: '',
    };
  }
}
