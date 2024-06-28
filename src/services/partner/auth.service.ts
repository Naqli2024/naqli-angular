import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:4000/api/partner';

  constructor(private http: HttpClient) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(error);
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

  resendOtp(email: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp`, { email });
  }
}
