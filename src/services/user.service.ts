import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userDetails: any; 
  private apiUrl = 'http://localhost:4000/api'; 

  constructor(private http: HttpClient) {}

  setUserDetails(userDetails: any) {
    this.userDetails = userDetails;
  }

  getUserDetails(): any {
    return this.userDetails;
  }

  clearUserDetails() {
    this.userDetails = null;
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }
}