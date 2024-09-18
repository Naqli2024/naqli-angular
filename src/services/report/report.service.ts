import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportSupportService {
  private apiUrl = 'https://naqli.onrender.com/api/report' 

  constructor(private http: HttpClient) {}

  submitReportRequest(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-report`, formData);
  }

  getAllTickets():Observable<any> {
    return this.http.get(`${this.apiUrl}/all-tickets`);
  }

  updateTicket(ticketId: string, reply: string): Observable<any> {
    const body = { ticketId, responseMessage: reply };
    return this.http.put<any>(`${this.apiUrl}/updateReportRequest`, body);
  }

  deleteTicket(ticketId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteTicket`, { body: { ticketId } });
  }
}