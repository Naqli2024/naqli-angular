import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReportSupportService } from '../../../../services/report/report.service';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './ticket-modal.component.html',
  styleUrl: './ticket-modal.component.css',
})
export class TicketModalComponent {
  @Input() ticketId!: string;

  constructor(
    public activeModal: NgbActiveModal,
    public router: Router,
    private reportService: ReportSupportService,
    private spinnerService: SpinnerService,
    private toastr: ToastrService
  ) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
  }

  onDelete() {
    this.spinnerService.show();
    this.reportService.deleteTicket(this.ticketId).subscribe(
      (response) => {
        this.spinnerService.hide();
        this.toastr.success(response.message);
        this.activeModal.dismiss();
        window.location.reload();
      },
      (error) => {
        this.spinnerService.hide();
        this.toastr.error(error.message || 'Failed to delete ticket');
      }
    );
  }
}
