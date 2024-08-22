import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { LoginComponent } from '../auth/login/login.component';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private modalService: NgbModal,
    private router: Router,
    private userService: UserService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (authToken && userId) {
      return this.userService.getUserById(userId).pipe(
        map((user: User) => {
          if (user.isAdmin) {
            // If the user is admin, redirect to admin overview
            if (state.url !== '/home/user/dashboard/admin/overview') {
              this.router.navigate(['/home/user/dashboard/admin/overview']);
              return false;
            }
            return true;
          } else {
            // Allow access to non-admin users
            return true;
          }
        }),
        catchError(() => {
          this.openLoginModal();
          return of(false);
        })
      );
    } else {
      this.openLoginModal();
      return false;
    }
  }

  openLoginModal(): void {
    this.modalService.open(LoginComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
  }
}


export class LoginGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userId = localStorage.getItem('userId');
    const partnerId = localStorage.getItem('partnerId');

    if (userId || partnerId) {
      // If the user is logged in, redirect to the dashboard
      this.router.navigate(['/home/partner/dashboard']);
      return false; // Prevent navigation to the login page
    }

    // User is not logged in, allow access to the login page
    return true;
  }
}