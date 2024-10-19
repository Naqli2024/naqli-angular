import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { LoginComponent } from '../../auth/login/login.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../../services/admin/notification.service';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

export interface User {
  authToken: string;
  firstName: string;
  lastName: string;
  partnerName: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    RouterModule,
    MatBadgeModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent  implements OnInit{
  isDropdownOpen: boolean = false;
  isMenuOpen: boolean = false;
  isNotificationsDropdownOpen: boolean = false;
  isAuthenticated: boolean = false;
  userDetails: any;
  firstName: string | null = '';
  lastName: string | null = '';
  partnerName: string | null = '';
  notifications: any[] = [];
  notificationCount: number = 0;
  selectedLanguage: string = 'English';
  languages = ['en', 'ar', 'hi'];
  private translateService = inject(TranslateService);

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private toastr: ToastrService,
    private notificationService: NotificationService,
  ) {
  }

  ngOnInit(): void {
    this.updateUserState();
    this.getNotificationById();
    const defaultLanguage  = 'en';
    this.translateService.setDefaultLang(defaultLanguage);
    this.translateService.use(defaultLanguage);
  }

  changeLanguage(lang: string) {
    this.translateService.use(lang);
  }

  getNotificationById() {
    const userId = localStorage.getItem('userId');
    const partnerId = localStorage.getItem('partnerId');
    const id = userId || partnerId; // Use userId if it exists, otherwise use partnerId

    if (!id) {
      console.log('No user ID or partner ID found.');
      return;
    }
    this.notificationService.getNotificationById(id).subscribe(
      (data) => {
        this.notifications = data.data;
        this.notificationCount = this.notifications.length;
      },
      (error) => {
        this.toastr.error('Failed to fetch notifications');
        console.error(error);
      }
    );
  }

  updateUserState() {
    const token = localStorage.getItem('authToken');

    if (token) {
      this.isAuthenticated = true;
      this.firstName = localStorage.getItem('firstName');
      this.lastName = localStorage.getItem('lastName');
      this.partnerName = localStorage.getItem('partnerName');
    } else {
      this.isAuthenticated = false;
    }
  }

  logout() {
    const currentUrl = this.router.url;
    localStorage.clear();
    sessionStorage.clear();

    // Navigate to the current active route
    if (currentUrl.includes('user')) {
      this.router.navigate(['/home/user']);
    } else if (currentUrl.includes('partner')) {
      this.router.navigate(['/home/partner']);
    }

    this.updateUserState();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    const headerElement = document.querySelector('.navbar');
    if (headerElement && !headerElement.contains(event.target as Node)) {
      this.isDropdownOpen = false;
      this.isMenuOpen = false;
      this.isNotificationsDropdownOpen = false;
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleNotificationDropdown() {
    this.isNotificationsDropdownOpen = !this.isNotificationsDropdownOpen;
  }

  selectLanguage(language: string) {
    this.translateService.use(language);
    this.selectedLanguage = language;
    this.isDropdownOpen = false;
  }

  openLoginModal(): void {
    const currentRoute = this.router.url;
    let modalRef: NgbModalRef | null = null;

    if (currentRoute.includes('/home/user')) {
      modalRef = this.modalService.open(LoginComponent, {
        size: 'xl',
        centered: true,
        backdrop: true,
        scrollable: true,
        windowClass: 'no-background',
      });
    } else if (currentRoute.includes('/home/partner')) {
      this.router.navigate(['home/partner/login']);
      return; // Exit the function if navigating
    }

    if (modalRef) {
      modalRef.result.then(
        () => {
          this.updateUserState();
        },
        () => {
          this.updateUserState();
        }
      );
    }
  }
}
