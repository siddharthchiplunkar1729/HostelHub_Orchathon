import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly http = inject(HttpClient);

  getComplaints(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/complaints`);
  }

  createComplaint(complaint: { title: string; category: string; description: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/complaints`, complaint);
  }

  getNotices(hostelBlockId?: string, limit = 50): Observable<unknown[]> {
    const params = new URLSearchParams();
    if (hostelBlockId) params.set('hostelBlockId', hostelBlockId);
    params.set('limit', String(limit));
    return this.http.get<unknown[]>(`${API_BASE_URL}/notices?${params.toString()}`);
  }

  getWeeklyMessMenu(hostelBlockId?: string): Observable<unknown> {
    const query = hostelBlockId ? `?hostelBlockId=${encodeURIComponent(hostelBlockId)}` : '';
    return this.http.get<unknown>(`${API_BASE_URL}/mess-menu/week${query}`);
  }

  getWardenDashboard(): Observable<unknown> {
    return this.http.get<unknown>(`${API_BASE_URL}/warden/dashboard`);
  }

  getStories(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${API_BASE_URL}/stories`);
  }

  getCommunities(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${API_BASE_URL}/communities`);
  }
}
