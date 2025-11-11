import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Partner } from '../../../../models/partnerData.model';
import { PartnerService } from '../../../../services/partner/partner.service';
import { FileService } from '../../../../services/file.service';

@Component({
  selector: 'app-show-partner-details',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './show-partner-details.component.html',
  styleUrl: './show-partner-details.component.css',
})
export class ShowPartnerDetailsComponent {
  @Input() partnerId!: string;
  partner!: Partner;

  constructor(
    private partnerService: PartnerService,
    public activeModal: NgbActiveModal,
    private translate: TranslateService,
    private fileService: FileService
  ) {}

  ngOnInit() {
    this.partnerService.getPartnerDetails(this.partnerId).subscribe(
      (response) => {
        // console.log(response)
        this.partner = response.data;
        // console.log(this.partner)
      },
      (error) => {
        // console.error('Error fetching bookings:', error);
      }
    );
  }

  openFile(fileName: string) {
    const fileUrl = this.fileService.getFileUrl(fileName);
    window.open(fileUrl, '_blank');
  }

  openImage(fileName: string) {
    const fileUrl = this.fileService.getImageUrl(fileName);
    window.open(fileUrl, '_blank');
  }

  closeModalAndNavigate() {
    this.activeModal.dismiss();
  }
}
