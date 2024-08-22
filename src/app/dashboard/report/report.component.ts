import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpinnerService } from '../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { ReportSupportComponent } from '../../partner/dashboard/report/report-support/report-support.component';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  constructor(
    private modalService: NgbModal,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
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
