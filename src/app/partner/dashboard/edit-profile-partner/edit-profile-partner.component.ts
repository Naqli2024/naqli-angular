import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PartnerService } from '../../../../services/partner/partner.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { FormsModule } from '@angular/forms';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-edit-profile-partner',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, FontAwesomeModule],
  templateUrl: './edit-profile-partner.component.html',
  styleUrl: './edit-profile-partner.component.css',
})

export class EditProfilePartnerComponent implements OnInit {
  formData: any = {}; 
  profilePhoto: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  faEdit = faEdit;
  originalPartnerName: string = ''; 

  constructor(
    private router: Router,
    private partnerService: PartnerService,
    private toastr: ToastrService,
    private spinnerService: SpinnerService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if (partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        (partnerDetails) => {
          console.log(partnerDetails)
          this.formData.partnerName = partnerDetails.data.partnerName;
          this.formData.partnerId = partnerDetails.data._id;
          this.originalPartnerName = partnerDetails.data.partnerName;
          this.formData.email = partnerDetails.data.email;
          this.formData.mobileNo = partnerDetails.data.mobileNo;

          if (partnerDetails.data.partnerProfile?.fileName) {
            const fileName = partnerDetails.data.partnerProfile.fileName;
            this.profilePhoto = `https://prod.naqlee.com:443/uploads/partnerProfile/${fileName}`;
          }
        },
        (error) => {
          // console.error('Error fetching partner details:', error);
        }
      );
    }
    // console.log("Profile Photo URL:", this.profilePhoto);
  }

  // Handle file selection for profile photo
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files[0]) {
      const file = input.files[0];
  
      if (file.type.startsWith('image/')) {
        this.selectedFile = file; // Store the selected file
  
        const reader = new FileReader();
        reader.onload = () => {
          this.zone.run(() => {
            this.profilePhoto = reader.result; // Display the preview of the image
          });
        };
        reader.readAsDataURL(file); // Read the file as a Data URL for preview
      } else {
        // console.error('Invalid file type.');
      }
    }
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  // Edit icon click to simulate file input click
  onEditIconClick(): void {
    document.getElementById('upload-photo')?.click();
  }

  // Save profile changes
  saveProfile() {
    const partnerId: string = this.formData.partnerId; // Use partnerId from form data
    const formData = new FormData();

    formData.append('partnerName', this.formData.partnerName);
    formData.append('email', this.formData.email);
    formData.append('mobileNo', this.formData.mobileNo);
    formData.append('password', this.formData.password || ''); // Handle empty password
    formData.append('confirmPassword', this.formData.confirmPassword || ''); // Handle empty confirmPassword

    if (this.selectedFile) {
      formData.append(
        'partnerProfile',
        this.selectedFile,
        this.selectedFile.name
      );
    }

    // Call service method to update the partner details
    this.partnerService.editPartnerProfile(partnerId, formData).subscribe(
      (response) => {
        this.toastr.success('Partner Profile Updated Successfully!');
      },
      (error) => {
        this.toastr.error('Error updating profile');
      }
    );
  }
}