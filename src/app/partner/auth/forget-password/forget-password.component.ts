import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OtpVerificationComponent } from '../otp-verification/otp-verification.component';
import { AuthService } from '../../../../services/partner/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpinnerService } from '../../../../services/spinner.service';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule, OtpVerificationComponent],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css',
})
export class ForgetPasswordComponent {
  email= '';

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private authService: AuthService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService
  ) {}

  resetPasswordModal(): void {
    const modalRef = this.modalService.open(ResetPasswordComponent, {
      size: 'xl',
      centered: true,
      scrollable: true,
      windowClass: 'no-background',
      backdropClass: 'no-background-backdrop',
    });
  }
  
  forgotPasswordOtpReq() {
    this.spinnerService.show();
    localStorage.setItem('email', this.email); 
    this.authService.forgotPassword({ email: this.email }).subscribe(
      (response) => {
        this.spinnerService.hide();
        if (response.success) {
          this.toastr.success(response.message, 'Success');
          this.clearForm();
          this.activeModal.dismiss();
          this.resetPasswordModal()
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

  clearForm() {
    this.email = ''
  }
}
