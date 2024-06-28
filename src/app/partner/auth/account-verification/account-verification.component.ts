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
    this.partnerDetails = this.partnerService.getPartnerDetails(); 
  }

  closeModal() {
    this.router.navigate(['home/partner/operator'])
    this.activeModal.dismiss(); 
  }
}
