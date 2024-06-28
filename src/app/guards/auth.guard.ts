import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { LoginComponent } from '../auth/login/login.component';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private modalService: NgbModal, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      return true;
    } else {
      this.openLoginModal();
      return false;
    }
  }

  openLoginModal(): void {
    const currentRoute = this.router.url;
    if (currentRoute.includes('/home/user')) {
      const modalRef = this.modalService.open(LoginComponent, {
        size: 'xl',
        centered: true,
        backdrop: true,
        scrollable: true,
        windowClass: 'no-background',
      });
    }
  }
}