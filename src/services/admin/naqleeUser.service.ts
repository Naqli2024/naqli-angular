import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NaqleeUserService {
  
    private baseUrl = 'https://naqlee.com/api/admin'; 

    constructor(private http: HttpClient) { }
  
    addUser(formData: FormData): Observable<any> {
      const headers = new HttpHeaders(); 
      return this.http.post<any>(`${this.baseUrl}/naqlee-user`, formData, { headers });
    }

    getAllNaqleeUsers(): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/getAllNaqleeUsers`);
    }

    deleteNaqleeUser(userId: string): Observable<any> {
      return this.http.delete<any>(`${this.baseUrl}/deleteNaqleeUser/${userId}`);
    }

    updateUser(userId: string, userData: FormData): Observable<any> {
      return this.http.put<any>(`${this.baseUrl}/updateNaqleeUser/${userId}`, userData);
    }
}