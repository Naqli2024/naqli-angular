import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './booking-modal.component.html',
  styleUrl: './booking-modal.component.css',
})
export class BookingModalComponent implements OnInit {
  @Input() bookingId!: string;

  constructor(
    public activeModal: NgbActiveModal,
    public router: Router,
    private userService: UserService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Automatically fetch the user details and navigate based on accountType
    this.fetchUserDetails();
  }

  fetchUserDetails(): void {
    // Get the userId from localStorage
    const userId = localStorage.getItem('userId');

    if (userId) {
      // Fetch user details using the userId
      this.userService.getUserById(userId).subscribe(
        (user) => {
          if (user?.accountType) {
            // Call the closeModalAndNavigate method based on accountType
            this.closeModalAndNavigate(user.accountType);
          }
        },
        (error) => {
          // console.error('Error fetching user details:', error);
          this.toastr.error('Unable to fetch user information', 'Error');
          this.closeModalAndNavigate(); // Handle navigation if user fetch fails
        }
      );
    } else {
      // console.error('User ID not found in localStorage');
      this.toastr.error('User not found', 'Error');
      this.closeModalAndNavigate(); // Handle navigation if userId is missing
    }
  }

  closeModalAndNavigate(accountType?: string): void {
    // Introduce a 2-second delay before navigating and dismissing the modal
    setTimeout(() => {
      this.activeModal.dismiss();

      // Check accountType and navigate to the respective route
      if (accountType === 'Super User') {
        this.router.navigate(['/home/user/dashboard/super-user/dashboard']);
      } else if (accountType === 'Single User') {
        this.router.navigate(['/home/user/dashboard/booking']);
      } else {
        // Fallback to default route if accountType is not recognized
        this.router.navigate(['/home/user/dashboard/booking']);
      }
    }, 2000); // 2-second delay
  }
}
