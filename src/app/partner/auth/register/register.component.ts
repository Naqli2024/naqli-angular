import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../../services/partner/auth.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { PartnerService } from '../../../../services/partner/partner.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OtpVerificationComponent } from '../otp-verification/otp-verification.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastrModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  formData = {
    type: '',
    partnerName: '',
    mobileNo: '',
    email: '',
    password: '',
  };
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService,
    private spinnerService: SpinnerService, 
    private partnerService: PartnerService,
    private modalService: NgbModal,
  ) {}

  register() {
    this.spinnerService.show();
    localStorage.setItem('emailAddress', this.formData.email);
   
    this.authService.register(this.formData).subscribe(
      (response) => {
        this.spinnerService.hide();
        if (response.success && response.success == true) {
          localStorage.setItem('partnerId', response.data.partner._id);
          this.toastr.success(response.message, 'Success');
          this.resetForm();
          this.otpVerificatoionModal();
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

  
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
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

  resetForm() {
    this.formData = {
      type: '',
      partnerName: '',
      mobileNo: '',
      email: '',
      password: '',
    };
  }

}
