import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgOtpInputModule } from 'ng-otp-input';
import { SpinnerService } from '../../../../services/spinner.service';
import { AuthService } from '../../../../services/partner/auth.service';
import { AccountVerificationComponent } from '../account-verification/account-verification.component';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOtpInputModule, TranslateModule],
  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.css',
})
export class OtpVerificationComponent {
  @ViewChild('ngOtpInput') ngOtpInput: any;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private toastr: ToastrService,
    public activeModal: NgbActiveModal,
    private spinnerService: SpinnerService
  ) {}

  accountVerificationModal(): void {
    const modalRef = this.modalService.open(AccountVerificationComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background'
    });
  }

  verifyOtp(): void {
    this.spinnerService.show();
    if (
      this.ngOtpInput.currentVal == null ||
      this.ngOtpInput.currentVal.length !== 6
    ) {
      alert('otp cannot be empty.');
      return;
    } else {
      this.authService.otpVerify(this.ngOtpInput.currentVal).subscribe(
        (response) => {
          this.spinnerService.hide();
          if (response.success) {
            this.toastr.success(response.message, 'Success');
            this.clearForm();
            this.activeModal.dismiss();
            this.accountVerificationModal();
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
          this.clearForm();
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
  }
}
