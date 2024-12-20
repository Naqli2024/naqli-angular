import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../services/spinner.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-transaction-input',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './transaction-input.component.html',
  styleUrl: './transaction-input.component.css'
})
export class TransactionInputComponent {

constructor(
    public activeModal: NgbActiveModal,
    private spinnerService: SpinnerService,
    private toastr: ToastrService,
  ) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
  }
}
