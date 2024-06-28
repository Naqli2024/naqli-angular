import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private partnerDetails: any; 
  private baseUrl = 'http://localhost:4000/api/partner';

  constructor(private http: HttpClient) {}

  setPartnerDetails(partnerDetails: any) {
    this.partnerDetails = partnerDetails;
  }

  getPartnerDetails(): any {
    return this.partnerDetails;
  }

  clearPartnerDetails() {
    this.partnerDetails = null;
  }

  updatePartnerName(partnerId: string, partnerName: string): Observable<any> {
    const url = `${this.baseUrl}/updatePartnerName/${partnerId}`;
    const payload = { partnerName };
    return this.http.put(url, payload);
  }

  checkPartnerExists(partnerName: string): Observable<boolean> {
    console.log(partnerName)
    const url = `${this.baseUrl}/${encodeURIComponent(partnerName)}`;
    return this.http.get<boolean>(url);
  }

  getPartnerId(): string {
    return this.partnerDetails ? this.partnerDetails._id : '';
  }
}