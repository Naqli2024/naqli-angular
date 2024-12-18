import { CommonModule } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '../../../../models/user.model';
import { UserService } from '../../../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, FontAwesomeModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
})
export class EditProfileComponent {
  profilePhoto: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  userId: string | null = null;
  faEdit = faEdit;
  user: User = {
    _id: '',
    firstName: '',
    lastName: '',
    emailAddress: '',
    contactNumber: 0,
    address1: '',
    address2: '',
    city: '',
    govtId: '',
    idNumber: 0,
    userProfile: {
      contentType: '',
      fileName: '',
    },
    accountType: '',
    isAdmin: false,
    isBlocked: false,
    isSuspended: false,
    isVerified: false,
    notifications: [],
    lastNotification: null,
    createdAt: '',
    updatedAt: '',
    selected: false,
  };
   // Separate properties for passwords
   password: string = '';
   confirmPassword: string = '';

  constructor(
    private zone: NgZone,
    private userService: UserService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId');

    if (this.userId) {
      this.getUserDetails(this.userId);
    } else {
      console.error('User ID not found in localStorage');
    }
  }

  getUserDetails(userId: string): void {
    this.userService.getUserById(userId).subscribe(
      (response: User) => {
        this.user = response;
        if (response.userProfile?.fileName) {
          this.profilePhoto = `http://localhost:4000/uploads/userProfile/${response.userProfile.fileName}`;
        }
      },
      (error) => {
        console.error('Error loading user data:', error);
      }
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files[0]) {
      const file = input.files[0];
  
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;  
        const reader = new FileReader();
  
        reader.onload = () => {
          this.zone.run(() => {
            this.profilePhoto = reader.result;  
          });
        };
  
        reader.readAsDataURL(file);
      } else {
        console.error('Invalid file type.');
      }
    }
  }

  saveProfile(): void {
    if (!this.userId) {
      console.error('User ID is required for editing profile.');
      return;
    }
  
    const formData = new FormData();
    formData.append('firstName', this.user.firstName);
    formData.append('lastName', this.user.lastName);
    formData.append('emailAddress', this.user.emailAddress);
    formData.append('contactNumber', this.user.contactNumber.toString());
    formData.append('address1', this.user.address1);
    formData.append('city', this.user.city);
    formData.append('govtId', this.user.govtId);
    formData.append('idNumber', this.user.idNumber.toString());
  
    // Add profile picture if selected
    if (this.selectedFile) {
      formData.append('userProfile', this.selectedFile, this.selectedFile.name);
    }
  
    if (this.password && this.confirmPassword) {
      // Ensure that password and confirmPassword are plain-text
      formData.append('password', this.password); 
      formData.append('confirmPassword', this.confirmPassword); 
    }
  
    // Call the user service to update the profile
    this.userService.editUserProfile(this.userId, formData).subscribe(
      (response) => {
        this.toastr.success('Profile updated successfully:', response.message);
      },
      (error) => {
        this.toastr.error('Error updating profile:', error.message);
      }
    );
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  // Method to simulate file input click when the edit icon is clicked
  onEditIconClick(): void {
    document.getElementById('upload-photo')?.click();
  }
}
