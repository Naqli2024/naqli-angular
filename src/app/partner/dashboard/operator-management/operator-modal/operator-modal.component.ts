import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-operator-modal',
  standalone: true,
  imports: [],
  templateUrl: './operator-modal.component.html',
  styleUrl: './operator-modal.component.css'
})
export class OperatorModalComponent {
  constructor(public activeModal: NgbActiveModal, public router: Router) {}

  closeModalAndNavigate(): void {
    this.activeModal.dismiss();
  }
}
