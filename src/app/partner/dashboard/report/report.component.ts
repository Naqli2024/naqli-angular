import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { ReportSupportComponent } from './report-support/report-support.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class PartnerReportComponent {
  constructor(
    private modalService: NgbModal,
    private spinnerService: SpinnerService,
    private toastr: ToastrService
  ) {}

  openBookingModal(): void {
    const modalRef = this.modalService.open(ReportSupportComponent, {
      size: 'lg',
      centered: true,
      backdrop: true,
      scrollable: true,
      windowClass: 'no-background',
    });
  }
}
