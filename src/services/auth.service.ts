import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:4000/api';

  constructor(private http: HttpClient) {}

  getUserId(): string | null {
    const userId = localStorage.getItem('userId');
    return userId;
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(error);
      })
    );
  }

  login(loginData: {
    emailAddress: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, loginData).pipe(
      tap((response: any) => {
        if (
          response &&
          response.data.token &&
          response.data.user.firstName &&
          response.data.user.lastName
        ) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('firstName', response.data.user.firstName);
          localStorage.setItem('lastName', response.data.user.lastName);
          localStorage.setItem('userId', response.data.user._id);
        } else {
          console.error('Invalid response format:', response);
        }
      })
    );
  }

  forgotPassword(emailData: { emailAddress: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, emailData);
  }

  otpVerify(otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-otp`, { otp });
  }

  verifyOtpAndUpdatePassword(
    otp: string,
    newPassword: string,
    confirmNewPassword: string
  ): Observable<any> {
    const body = { otp, newPassword, confirmNewPassword };
    return this.http
      .post<any>(`${this.baseUrl}/verify-otp-update-password`, body)
      .pipe(
        catchError((error) => {
          return throwError(error);
        })
      );
  }

  resendOtp(emailAddress: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp`, { emailAddress });
  }
}
