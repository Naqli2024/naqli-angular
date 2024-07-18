import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiUrl = 'http://localhost:4000/api/admin';

  constructor(private http: HttpClient) { }

  sendNotification(notificationData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-notification`, notificationData);
  }

  getLastNotification(id: string): Observable<any> {
    const url = `${this.apiUrl}/last-notification`;
    return this.http.post<any>(url, { id });
  }
}