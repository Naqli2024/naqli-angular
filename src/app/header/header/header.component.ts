import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { LoginComponent } from '../../auth/login/login.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';

export interface User {
  authToken: string;
  firstName: string;
  lastName: string;
  partnerName: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LoginComponent, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  isDropdownOpen: boolean = false;
  isMenuOpen: boolean = false;
  selectedLanguage: string = 'English';
  isAuthenticated: boolean = false;
  userDetails: any;
  firstName: string | null = '';
  lastName: string | null = '';
  partnerName: string | null = '';

  constructor(private modalService: NgbModal, private router: Router) {}

  ngOnInit(): void {
    this.updateUserState();
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
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectLanguage(language: string) {
    this.selectedLanguage = language;
    this.isDropdownOpen = false;
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
