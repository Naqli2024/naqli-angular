import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent {
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Extract token from query parameters
    const token = this.route.snapshot.queryParamMap.get('token');

    // Send request to backend API for verification
    this.http.get<any>(`http://localhost:4000/api/verify-email?token=${token}`).subscribe(
      (response) => {
        console.log('Verification response:', response);
        if (response.success) {
          this.openLoginModal();
        } else {
          // Handle unsuccessful verification
          console.error('Email verification failed:', response.message);
          this.router.navigate(['/home/user']); 
        }
      },
      (error) => {
        console.error('Error verifying email:', error);
        this.router.navigate(['/error']);
      }
    );
  }

  openLoginModal(): void {
    const modalRef = this.modalService.open(LoginComponent, {
      size: 'xl',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background'
    });

    // Example of handling modal dismissal
    modalRef.result.then((result) => {
      console.log('Modal closed with result:', result);
    }, (reason) => {
      console.log('Modal dismissed with reason:', reason);
    });
  }
}
