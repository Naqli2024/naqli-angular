import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  createBooking(bookingData: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${this.apiUrl}/bookings`, bookingData, {
      headers,
    });
  }

  cancelBooking(bookingId: string): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<any>(`${this.apiUrl}/bookings/${bookingId}`, {
      headers,
    });
  }

  updateBookingPaymentStatus(
    bookingId: string,
    status: string,
    amount: number
  ): Observable<any> {
    let originalAmount: number;
    let remainingBalance: number;
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (status === 'halfPaid') {
      // Calculate original amount and remaining balance for halfPaid
      originalAmount = amount * 2;
      remainingBalance = originalAmount / 2;
    } else if (status === 'completed') {
      // For completed, original amount is the amount paid and remaining balance is 0
      originalAmount = amount;
      remainingBalance = 0;
    } else {
      throw new Error('Invalid payment status');
    }

    // Prepare the data to send to the backend
    const payload = {
      status: status,
      amount: amount,
      originalAmount: originalAmount,
      remainingBalance: remainingBalance,
    };
    console.log(amount, status);
    return this.http.put(
      `${this.apiUrl}/bookings/${bookingId}/payment`,
      payload,
      { headers }
    );
  }

  getCompletedBookingsByUser(userId: string): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(
      `${this.apiUrl}/bookings/user/${userId}/completed`,
      { headers }
    );
  }

  getBookingByUserId(userId: string): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.apiUrl}/bookings/${userId}`, { headers });
  }

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/getAllBookings`);
  }
}
