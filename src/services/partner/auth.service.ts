import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://prod.naqlee.com:443/api/partner';

  constructor(private http: HttpClient) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(error);
      })
    );
  }

  forgotPassword(email: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, email);
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

  resendOtp(email: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp`, { email });
  }

  login(loginData: {
    emailOrMobile: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, loginData).pipe(
      tap((response: any) => {
        if (
          response &&
          response.data.token &&
          response.data.partner.partnerName
        ) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('partnerName', response.data.partner.partnerName);
          localStorage.setItem('partnerId', response.data.partner._id)
        } else {
          console.error('Invalid response format:', response);
        }
      })
    );
  }
}
