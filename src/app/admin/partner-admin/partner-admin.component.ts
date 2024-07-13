import { Component } from '@angular/core';
import { PartnerService } from '../../../services/partner/partner.service';
import { Partner } from '../../../models/partnerData.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partner-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partner-admin.component.html',
  styleUrl: './partner-admin.component.css'
})
export class PartnerAdminComponent {
  partners: Partner[] = [];

  constructor(private partnerService: PartnerService) {}

  ngOnInit(): void {
    this.partnerService.getAllPartners().subscribe((response: any) => {
      if (response && response.data) {
        this.partners = response.data;
        console.log(this.partners);
      } else {
        console.error('Invalid response format from backend');
      }
    }, error => {
      console.error('Error fetching partner details:', error);
    });
  }
}
