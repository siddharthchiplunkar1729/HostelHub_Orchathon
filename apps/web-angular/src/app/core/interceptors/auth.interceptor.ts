import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = sessionStorage.getItem('token');
  const router = inject(Router);

  const authed = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authed).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid — clear session and send to login
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('student');
        router.navigate(['/auth/login'], { queryParams: { reason: 'session_expired' } });
      }
      return throwError(() => error);
    })
  );
};
