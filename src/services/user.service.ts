import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userDetails: any;
  private apiUrl = 'https://prod.naqlee.com:443/api';

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

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<{ success: boolean; data: User[] }>(`${this.apiUrl}/users`)
      .pipe(map((response) => response.data));
  }

  updateUserStatus(userId: string, status: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/status`, status);
  }

  editUserProfile(userId: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(
      `${this.apiUrl}/users/edit-profile/${userId}`,
      formData,
      { headers }
    );
  }

  deleteUser(userId: string): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete<any>(`${this.apiUrl}/deleteUser`, {
      headers,
      body: { userId },
    });
  }
}
