import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipment } from '../models/equipment-booking';


@Injectable({
  providedIn: 'root'
})
export class EquipmentService {

  private apiUrl = 'http://10.0.2.29:4000/api/equipments'; 

  constructor(private http: HttpClient) {}

  getEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.apiUrl);
  }
}