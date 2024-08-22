import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PartnerService } from '../../../../services/partner/partner.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-verification',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './account-verification.component.html',
  styleUrl: './account-verification.component.css',
})
export class AccountVerificationComponent {
  partnerDetails: any;

  constructor(
    private router: Router,
    public activeModal: NgbActiveModal,
    private partnerService: PartnerService
  ) {}

  ngOnInit() {
    const partnerId: string | null = localStorage.getItem('partnerId');
    if(partnerId) {
      this.partnerService.getPartnerDetails(partnerId).subscribe(
        (partnerDetails) => {
          this.partnerDetails = partnerDetails.data;
          console.log(this.partnerDetails); 
        },
        (error) => {
          console.error('Error fetching partner details:', error);
        }
      );
    }
  }

  closeModal() {
    if (this.partnerDetails && this.partnerDetails.type === "singleUnit + operator") {
      this.router.navigate(['home/partner/operator']);
    } else if (this.partnerDetails && this.partnerDetails.type === "multipleUnits") {
      this.router.navigate(['home/partner/company-details']);
    } else {
      console.warn("Unknown partner type:", this.partnerDetails?.type);
    }
    this.activeModal.dismiss(); 
  }
}
