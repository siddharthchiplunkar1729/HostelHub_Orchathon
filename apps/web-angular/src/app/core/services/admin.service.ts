import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface AdminHostelApprovalRequest {
  status: 'Approved' | 'Rejected' | 'Pending';
  comments?: string;
}

export interface AdminStats {
  totalHostels: number;
  approvedHostels: number;
  pendingApprovals: number;
  rejectedHostels: number;
  totalWardens: number;
  totalStudents: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API_BASE_URL}/admin/stats`);
  }

  getHostelListingsForApproval(status?: string): Observable<any[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<any[]>(`${API_BASE_URL}/admin/hostels${query}`);
  }

  approveHostelListing(hostelId: string, status: 'Approved' | 'Rejected' | 'Pending', comments?: string): Observable<any> {
    return this.http.patch<any>(`${API_BASE_URL}/admin/hostels/${hostelId}`, { status, comments });
  }

  getAllWardens(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/admin/wardens`);
  }

  getAllStudents(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/admin/students`);
  }

  getSystemReports(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/admin/reports`);
  }
}
