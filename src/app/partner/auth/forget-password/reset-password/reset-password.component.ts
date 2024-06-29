import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../../../services/partner/auth.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../services/spinner.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgOtpInputModule } from 'ng-otp-input';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOtpInputModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  @ViewChild('ngOtpInput') ngOtpInput: any;
  newPassword: string = '';
  confirmNewPassword: string = '';

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private toastr: ToastrService,
    public activeModal: NgbActiveModal,
    private spinnerService: SpinnerService
  ) {}

  verifyOtpAndUpdatePassword(): void {
    this.spinnerService.show();
    if (
      this.ngOtpInput.currentVal == null ||
      this.ngOtpInput.currentVal.length !== 6
    ) {
      alert('otp cannot be empty.');
      return;
    } else {
      this.authService
        .verifyOtpAndUpdatePassword(
          this.ngOtpInput.currentVal,
          this.newPassword,
          this.confirmNewPassword
        )
        .subscribe(
          (response) => {
            this.spinnerService.hide();
            if (response.success) {
              this.toastr.success(response.message, 'Success');
              this.clearForm();
              this.activeModal.dismiss();
            } else {
              this.toastr.error(response.message, 'Error');
            }
          },
          (error) => {
            this.spinnerService.hide();
            const errorMessage = error.error?.message || 'An error occurred';
            this.toastr.error(errorMessage, 'Error');
          }
        );
    }
  }

  resendOtp() {
    this.spinnerService.show();
    const emailAddress = localStorage.getItem('emailAddress');

    this.authService.resendOtp(emailAddress).subscribe(
      (response) => {
        this.spinnerService.hide();
        if (response.success) {
          this.toastr.success(response.message, 'Success');
          localStorage.removeItem('emailAddress');
        } else {
          this.toastr.error(
            response.message || 'Failed to resend OTP',
            'Error'
          );
        }
      },
      (error) => {
        this.spinnerService.hide();
        const errorMessage = error.error?.message || 'An error occurred';
        this.toastr.error(errorMessage, 'Error');
      }
    );
  }

  clearForm() {
    this.ngOtpInput.currentVal = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
  }
}
