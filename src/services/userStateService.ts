import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserState {
  isAuthenticated: boolean;
  firstName: string | null;
  lastName: string | null;
  partnerName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userStateSubject = new BehaviorSubject<UserState>({
    isAuthenticated: false,
    firstName: null,
    lastName: null,
    partnerName: null
  });
  
  userState$ = this.userStateSubject.asObservable();

  updateUserState(newState: UserState) {
    this.userStateSubject.next(newState);
  }
}