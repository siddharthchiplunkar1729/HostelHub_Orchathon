import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface WardenDashboard {
  blockName: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  pendingApplications: number;
  openComplaints: number;
  approvedCount: number;
}

export interface ApplicationReviewRequest {
  status: 'Approved' | 'Rejected';
  comments?: string;
}

@Injectable({ providedIn: 'root' })
export class WardenService {
  private readonly http = inject(HttpClient);

  getWardenDashboard(blockId?: string): Observable<any> {
    const query = blockId ? `?blockId=${blockId}` : '';
    return this.http.get<any>(`${API_BASE_URL}/warden/dashboard${query}`);
  }

  reviewApplication(applicationId: string, status: 'Accepted' | 'Rejected', notes?: string): Observable<any> {
    return this.http.patch<any>(`${API_BASE_URL}/applications/${applicationId}/review`, { status, notes });
  }

  getComplaints(hostelBlockId?: string): Observable<any[]> {
    const query = hostelBlockId ? `?hostelBlockId=${hostelBlockId}` : '';
    return this.http.get<any[]>(`${API_BASE_URL}/warden/complaints${query}`);
  }
}
