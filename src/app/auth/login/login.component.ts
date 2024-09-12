import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ForgetPasswordComponent } from '../forget-password/forget-password.component';
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../services/spinner.service';
import { OtpVerificationComponent } from '../otp-verification/otp-verification.component';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ForgetPasswordComponent, FormsModule, ToastrModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  showLoginForm: boolean = true;
  user = {
    firstName: '',
    lastName: '',
    emailAddress: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    alternateNumber: '',
    address1: '',
    address2: '',
    city: '',
    accountType: '',
    govtId: '',
    idNumber: '',
  };
  loginData = {
    emailAddress: '',
    password: '',
  };
  userDetails: any = {};
  isAdmin: boolean = false;

  constructor(
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private authService: AuthService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
    private userService: UserService,
    private router: Router
  ) {}

  login() {
    if (localStorage.getItem('userId') || localStorage.getItem('partnerId')) {
      localStorage.clear();
      sessionStorage.clear();
    }

    this.spinnerService.show();
    this.authService.login(this.loginData).subscribe(
      (response: any) => {
        this.spinnerService.hide();
        if (response.success === true) {
          this.toastr.success(response.message, 'Success');
          this.clearForm();
          this.activeModal.dismiss();
          
          const userId = localStorage.getItem('userId');
          if (userId) {
            this.userService.getUserById(userId).subscribe((user: User) => {
              this.isAdmin = user.isAdmin;
              
              // Dynamically redirect based on the isAdmin status
              if (this.isAdmin) {
                this.router.navigate(['/home/user/dashboard/admin/overview']);
              } else {

                this.router.navigate(['/home/user/dashboard/booking']);
              }
            }, (error) => {
              // Handle error if getUserById fails
              this.toastr.error('Failed to retrieve user information', 'Error');
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        } else {
          if (response.message === 'User not verified') {
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
        if (errorMessage === 'User not verified') {
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

  register() {
    this.spinnerService.show();
    localStorage.setItem('emailAddress', this.user.emailAddress);
    if (this.user.password !== this.user.confirmPassword) {
      this.spinnerService.hide();
      this.toastr.error('Passwords do not match', 'Error');
      return;
    }

    this.authService.register(this.user).subscribe(
      (response) => {
        this.spinnerService.hide();
        if (response.success && response.success == true) {
          this.userService.setUserDetails(response.data.user);
          this.toastr.success(response.message, 'Success');
          this.resetForm();
          this.activeModal.dismiss();
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

  toggleForm(event: MouseEvent) {
    event.preventDefault();
    this.showLoginForm = !this.showLoginForm;
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

  resetForm() {
    this.user = {
      firstName: '',
      lastName: '',
      emailAddress: '',
      password: '',
      confirmPassword: '',
      contactNumber: '',
      alternateNumber: '',
      address1: '',
      address2: '',
      city: '',
      accountType: '',
      govtId: '',
      idNumber: '',
    };
  }

  clearForm() {
    this.loginData = {
      emailAddress: '',
      password: '',
    };
  }
}
