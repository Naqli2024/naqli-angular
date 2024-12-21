import { Component } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { PartnerService } from '../../../services/partner/partner.service';
import { User } from '../../../models/user.model';
import { ToastrService } from 'ngx-toastr';
import { Partner } from '../../../models/partnerData.model';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  profilePhoto: string | ArrayBuffer | null = null;
  users: User | null = null;
  partner: Partner | null = null;

  constructor(
    private userService: UserService,
    private partnerService: PartnerService,
    public toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    const partnerId = localStorage.getItem('partnerId');

    if (userId) {
      this.getUserDetails(userId);
    }
    if (partnerId) {
      this.getPartnerDetails(partnerId);
    }
  }

  getUserDetails(userId: string): void {
    this.userService.getUserById(userId).subscribe(
      (response: User) => {
        this.users = response;
        if (response.userProfile?.fileName) {
          this.profilePhoto = `https://prod.naqlee.com:443/uploads/userProfile/${response.userProfile.fileName}`;
        }
      },
      (error) => {
        this.toastr.error(
          error.error?.message || 'Failed to retrieve user details',
          'Error'
        );
      }
    );
  }

  getPartnerDetails(partnerId: string): void {
    this.partnerService.getPartnerDetails(partnerId).subscribe(
      (response) => {
        this.partner = response.data;
        if (response.data.partnerProfile?.fileName) {
          this.profilePhoto = `https://prod.naqlee.com:443/uploads/partnerProfile/${response.data.partnerProfile.fileName}`;
        }
      },
      (error) => {
        this.toastr.error(
          error.error?.message || 'Failed to update booking payment status',
          'Error'
        );
      }
    );
  }

  navigateToEditProfile() {
    this.router.navigate(['/home/user/dashboard/edit-profile'])
  }

  navigateToEditProfilePartner() {
    this.router.navigate(['/home/partner/dashboard/edit-profile/partner'])
  }
}
