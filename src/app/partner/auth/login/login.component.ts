import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ForgetPasswordComponent } from '../../../auth/forget-password/forget-password.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginData = {
    partnerId: '',
    password: '',
  };

  constructor(
    private modalService: NgbModal,
    private router: Router
  ) {}

  login() {
   console.log(this.loginData);
   this.router.navigate(['home/partner/dashboard'])
   this.resetForm();
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
      partnerId: '',
      password: '',
    };
  }
}
