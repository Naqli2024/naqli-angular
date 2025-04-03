import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DriverLocationService {
  private baseUrl = 'http://localhost:4000/api'; 

  constructor(private http: HttpClient) {}

  updateDriverLocation(
    partnerId: string,
    operatorId: string,
    latitude: number,
    longitude: number
  ): Observable<any> {
    const body = { partnerId, operatorId, latitude, longitude };
    return this.http.post(`${this.baseUrl}/driver-location`, body);
  }

  getDriverLocation(
    partnerId: string,
    operatorId: string
  ): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/driver-location/${partnerId}/${operatorId}`
    );
  }
}