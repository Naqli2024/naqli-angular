import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ModalService {
  private modalState = new BehaviorSubject<boolean>(false);

  openModal() {
    this.modalState.next(true);
  }

  closeModal() {
    this.modalState.next(false);
  }

  getModalState(): Observable<boolean> {
    return this.modalState.asObservable();
  }
}