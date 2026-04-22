import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface DashboardPayload {
  student: {
    _id: string;
    name: string;
    rollNumber: string;
    roomNumber?: string;
    course: string;
    year: number;
    enrollmentStatus: string;
    canAccessDashboard: boolean;
    feeStatus: {
      isPaid: boolean;
      lastPayment?: string;
    };
  } | null;
  complaints: Array<{
    _id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  notices: Array<{
    _id: string;
    title: string;
    content: string;
    priority: string;
    type: string;
    createdAt: string;
    hostelName?: string;
  }>;
  messMenu: {
    _id: string;
    day: string;
    breakfast: string;
    lunch: string;
    snacks: string;
    dinner: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<DashboardPayload> {
    return this.http.get<DashboardPayload>(`${API_BASE_URL}/dashboard`);
  }
}
