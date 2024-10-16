import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiUrl = 'https://naqli.onrender.com/api/admin';

  constructor(private http: HttpClient) { }

  sendNotification(notificationData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-notification`, notificationData);
  }

  getAllNotification():Observable<{ allNotifications: any[] }> {
    return this.http.get<{ allNotifications: any[] }>(`${this.apiUrl}/all-notifications`);
  }

  updateNotification(notificationId: string, notificationData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${notificationId}`, notificationData);
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${notificationId}`);
  }

  getNotificationById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getNotificationById/${id}`)
  }
}