import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userDetails: any; 

  setUserDetails(userDetails: any) {
    this.userDetails = userDetails;
  }

  getUserDetails(): any {
    return this.userDetails;
  }

  clearUserDetails() {
    this.userDetails = null;
  }
}