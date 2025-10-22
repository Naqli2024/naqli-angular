import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { LoginComponent } from '../../auth/login/login.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
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
  activeTab: string = 'User';

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
    this.updateActiveTab(); // Set active tab on component load

    // Listen for route changes and update active tab dynamically
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateActiveTab();
      }
    });

    // Listen for user change (detecting login switch)
    window.addEventListener('storage', () => {
      this.handleStorageChange();
    });
  }

  // Function to handle changes (user switch)
  handleStorageChange() {
    this.updateUserState();
    this.getNotificationById();
    this.updateActiveTab();
  }

  getNotificationById() {
    const userId = localStorage.getItem('userId');
    const partnerId = localStorage.getItem('partnerId');
    const id = userId || partnerId; // Use userId if it exists, otherwise use partnerId

    // Clear previous notifications when switching users
    this.notifications = [];
    this.notificationCount = 0;

    if (userId) {
      this.userService.getUserById(userId).subscribe((user: any) => {
        this.userDetails = user;
        this.isAdmin = user.isAdmin;
      });
    }

    if (!id) {
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
          if (!notification.seen) {
            this.newNotification++; // Increment the newNotification counter
            return true; // Return true to keep this notification in the filtered array
          }
          return false; // Return false to exclude this notification from the filtered array
        }).length;
      },
      (error) => {
        // this.toastr.error('Failed to fetch notifications');
      }
    );
  }

  updateUserState() {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const partnerId = localStorage.getItem('partnerId');

    if (token && (userId || partnerId)) {
      this.isAuthenticated = true;

      if (userId) {
        this.firstName = localStorage.getItem('firstName') || '';
        this.lastName = localStorage.getItem('lastName') || '';
        this.partnerName = ''; // Reset partner name if logged in as a user
      } else if (partnerId) {
        this.partnerName = localStorage.getItem('partnerName') || '';
        this.firstName = '';
        this.lastName = '';
      }
    } else {
      // If not authenticated, reset all values
      this.isAuthenticated = false;
      this.firstName = '';
      this.lastName = '';
      this.partnerName = '';
      this.notifications = [];
      this.notificationCount = 0;
    }
  }

  logout() {
    const currentUrl = this.router.url;
    localStorage.clear();
    sessionStorage.clear();

    this.notifications = []; // Clear notifications in component state
    this.notificationCount = 0; // Reset notification count

    // Navigate to the current active route
    if (currentUrl.includes('user')) {
      this.router.navigate(['/home/user']);
    } else if (currentUrl.includes('partner')) {
      this.router.navigate(['/home/partner']);
    }

    this.updateUserState();
  }

  updateActiveTab() {
    const partnerId = localStorage.getItem('partnerId');
    const userId = localStorage.getItem('userId');

    if (partnerId) {
      this.activeTab = 'Partner';
    } else if (userId) {
      this.activeTab = 'User';
    } else {
      this.activeTab = '';
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
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
        if (!notification.seen) {
          // Increment newNotification count for unseen notifications
          this.newNotification++;

          // Call API to update the seen status of the notification
          this.notificationService
            .updateNotificationSeen(notification.notificationId, true)
            .subscribe(
              (response) => {
                this.notificationCount = 0;
                // console.log(
                //   `Notification ${notification.notificationId} marked as seen on the server`,
                //   response
                // );
              },
              (error) => {
                // console.error(
                //   `Error marking notification ${notification.notificationId} as seen`,
                //   error
                // );
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

  handleLogoClick(event: MouseEvent): void {
    event.preventDefault();

    // Navigate manually based on current localStorage
    const userId = localStorage.getItem('userId');
    const partnerId = localStorage.getItem('partnerId');

    if (userId) {
      this.router.navigate(['/home/user']);
      this.logout();
    } else if (partnerId) {
      this.router.navigate(['/home/partner']);
      this.logout();
    } else {
      this.router.navigate(['/']);
    }
  }

  navigateToContact() {
    this.router.navigate(['/home/user/contact']);
  }
}
