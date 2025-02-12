import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { LoginComponent } from '../../auth/login/login.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../../../services/admin/notification.service';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../services/language.service';
import { UserService } from '../../../services/user.service';

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
    RouterModule,
    MatBadgeModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
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
  selectedLanguage: string = 'en';
  newNotification: number = 0;
  private languageService = inject(LanguageService);
  isAdmin: boolean = false;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private toastr: ToastrService,
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.updateUserState();
    this.getNotificationById();
    this.selectedLanguage = localStorage.getItem('language') || 'en';
  }

  getNotificationById() {
    const userId = localStorage.getItem('userId');
    const partnerId = localStorage.getItem('partnerId');
    const id = userId || partnerId; // Use userId if it exists, otherwise use partnerId

    if (userId) {
      this.userService.getUserById(userId).subscribe((user: any) => {
        this.userDetails = user;
        this.isAdmin = user.isAdmin; 
      });
    }

    if (!id) {
      console.log('No user ID or partner ID found.');
      return;
    }
    this.notificationService.getNotificationById(id).subscribe(
      (data) => {
        // Sort notifications in descending order based on the 'createdAt' field
        this.notifications = data.data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Reset the newNotification count
        this.newNotification = 0;

        // Filter notifications where seen is false and count them
        this.notificationCount = this.notifications.filter((notification) => {
          if (notification.seen === false) {
            this.newNotification++; // Increment the newNotification counter
            return true; // Return true to keep this notification in the filtered array
          }
          return false; // Return false to exclude this notification from the filtered array
        }).length;
      },
      (error) => {
        this.toastr.error('Failed to fetch notifications');
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
    
    // Reset the new notification count
    if (this.isNotificationsDropdownOpen) {
      this.newNotification = 0;
  
      // Mark notifications as seen and update the count for new notifications
      this.notifications.forEach((notification) => {
        if (notification.seen === false) {
          // Increment newNotification count for unseen notifications
          this.newNotification++;
          
          // Call API to update the seen status of the notification
          this.notificationService
            .updateNotificationSeen(notification.notificationId, true)
            .subscribe(
              (response) => {
                this.notificationCount = 0;
                console.log(
                  `Notification ${notification.notificationId} marked as seen on the server`,
                  response
                );
              },
              (error) => {
                console.error(
                  `Error marking notification ${notification.notificationId} as seen`,
                  error
                );
              }
            );
        }
      });
    }
  }

  selectLanguage(language: string) {
    this.selectedLanguage = language;
    this.languageService.changeLanguage(language);
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
      return;
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

  navigateToDeleteAccountInfo() {
    this.router.navigate(['home/user/delete-account']);
  }
 }