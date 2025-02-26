import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicle } from '../models/vehicle-booking';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  constructor(private http: HttpClient) {}

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>('https://prod.naqlee.com:443/api/vehicles');
  }
}
