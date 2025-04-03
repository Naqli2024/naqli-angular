import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Partner } from '../../models/partnerData.model';

@Injectable({
  providedIn: 'root',
})
export class PartnerService {
  private partnerDetails: any;
  private baseUrl = 'http://localhost:4000/api/partner';

  constructor(private http: HttpClient) {}

  getPartnerDetails(partnerId: string): Observable<any> {
    const url = `${this.baseUrl}/${partnerId}`;
    return this.http.get<Partner>(url);
  }

  updatePartnerName(partnerId: string, partnerName: string): Observable<any> {
    const url = `${this.baseUrl}/updatePartnerName/${partnerId}`;
    const payload = { partnerName };
    return this.http.put(url, payload);
  }

  checkPartnerExists(partnerName: string): Observable<boolean> {
    // console.log(partnerName);
    const url = `${this.baseUrl}/${encodeURIComponent(partnerName)}`;
    return this.http.get<boolean>(url);
  }

  getPartnerId(): string {
    return this.partnerDetails ? this.partnerDetails._id : '';
  }

  updateQuotePrice(
    partnerId: string,
    bookingId: string,
    quotePrice: number
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update-quote`, {
      quotePrice: quotePrice,
      partnerId: partnerId,
      bookingId: bookingId,
    });
  }

  deletedBookingRequest(partnerId: string, bookingId: string) {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(
      `${this.baseUrl}/${partnerId}/booking-request/${bookingId}`,
      { headers }
    );
  }

  getTopPartners(requestBody: any) {
    return this.http.post<any>(`${this.baseUrl}/filtered-vendors`, requestBody);
  }

  getAllPartners(): Observable<Partner[]> {
    return this.http.get<Partner[]>(this.baseUrl);
  }

  updatePartnerStatus(partnerId: string, status: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/partners/${partnerId}/status`, status);
  }

  assignOperator(bookingId: string, unit: string, operatorName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/assign-operator/${bookingId}`, { unit, operatorName });
  }

  editPartnerProfile(partnerId: string, formData: FormData): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(`${this.baseUrl}/edit-partner/${partnerId}`, formData, { headers });
  }
}
