import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userDetails: any; 
  private apiUrl = 'http://10.0.2.29:4000/api'; 

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

  getAllUsers():Observable<User[]> {
    return this.http.get<{ success: boolean, data: User[] }>(`${this.apiUrl}/users`).pipe(map(response => response.data));
  }

  updateUserStatus(userId: string, status: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/status`, status);
  }
}