import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { HostelBlockSummary } from './hostel.service';

export interface WardenApplication {
  _id: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  applicationData?: string;
  createdAt: string;
  hostelBlockId: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    rollNumber: string;
    course: string;
    year: number | null;
    department: string;
    feeStatus?: { isPaid: boolean };
  };
}

export interface WardenComplaintStats {
  pending: number;
  assigned: number;
  inProgress: number;
  resolvedToday: number;
}

export interface WardenDashboardResponse {
  success: boolean;
  stats: {
    totalBlocks: number;
    totalStudents: number;
    pendingApplications: number;
    acceptedApplications: number;
    complaints: WardenComplaintStats;
  };
  blocks: HostelBlockSummary[];
  occupancy: Array<{
    blockId: string;
    blockName: string;
    type: string;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: string;
  }>;
  applications: WardenApplication[];
}

export interface WardenNotice {
  _id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
  expiresAt?: string | null;
  updatedAt?: string | null;
  hostelBlockId: string;
  hostelName?: string;
}

export interface WardenMessMenu {
  _id: string;
  hostelBlockId: string;
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

export interface SaveHostelPayload {
  blockName: string;
  type: string;
  description: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  location: string;
  category: string;
  virtualTourUrl?: string | null;
  images: string[];
  facilities: string[];
}

export interface SaveNoticePayload {
  hostelBlockId: string;
  title: string;
  content: string;
  priority: string;
  expiresAt?: string | null;
}

export interface SaveMessMenuPayload {
  hostelBlockId: string;
  day: string;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

@Injectable({ providedIn: 'root' })
export class WardenService {
  private readonly http = inject(HttpClient);

  getWardenDashboard(blockId?: string): Observable<WardenDashboardResponse> {
    const query = blockId ? `?blockId=${encodeURIComponent(blockId)}` : '';
    return this.http.get<WardenDashboardResponse>(`${API_BASE_URL}/warden/dashboard${query}`);
  }

  reviewApplication(applicationId: string, status: 'Accepted' | 'Rejected', notes?: string): Observable<any> {
    return this.http.patch<any>(`${API_BASE_URL}/applications/${applicationId}/review`, { status, notes });
  }

  getManagedBlocks(): Observable<HostelBlockSummary[]> {
    return this.http.get<HostelBlockSummary[]>(`${API_BASE_URL}/hostel-blocks/managed`);
  }

  createHostel(payload: SaveHostelPayload): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/hostel-blocks`, payload);
  }

  updateHostel(hostelId: string, payload: Partial<SaveHostelPayload>): Observable<any> {
    return this.http.put<any>(`${API_BASE_URL}/hostel-blocks/${hostelId}`, payload);
  }

  getNotices(hostelBlockId: string, limit = 20): Observable<WardenNotice[]> {
    const query = `?hostelBlockId=${encodeURIComponent(hostelBlockId)}&limit=${limit}`;
    return this.http.get<WardenNotice[]>(`${API_BASE_URL}/notices${query}`);
  }

  createNotice(payload: SaveNoticePayload): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/notices`, payload);
  }

  updateNotice(noticeId: string, payload: Partial<SaveNoticePayload>): Observable<any> {
    return this.http.put<any>(`${API_BASE_URL}/notices/${noticeId}`, payload);
  }

  deleteNotice(noticeId: string): Observable<any> {
    return this.http.delete<any>(`${API_BASE_URL}/notices/${noticeId}`);
  }

  getWeeklyMessMenu(hostelBlockId: string): Observable<{ success: boolean; menus: WardenMessMenu[]; count: number }> {
    const query = `?hostelBlockId=${encodeURIComponent(hostelBlockId)}`;
    return this.http.get<{ success: boolean; menus: WardenMessMenu[]; count: number }>(`${API_BASE_URL}/mess-menu/week${query}`);
  }

  createMessMenu(payload: SaveMessMenuPayload): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/mess-menu`, payload);
  }

  updateMessMenu(menuId: string, payload: Partial<SaveMessMenuPayload>): Observable<any> {
    return this.http.put<any>(`${API_BASE_URL}/mess-menu/${menuId}`, payload);
  }

  getComplaints(hostelBlockId?: string): Observable<any[]> {
    const query = hostelBlockId ? `?hostelBlockId=${hostelBlockId}` : '';
    return this.http.get<any[]>(`${API_BASE_URL}/warden/dashboard/complaints${query}`);
  }

  updateComplaint(complaintId: string, payload: any): Observable<any> {
    return this.http.put<any>(`${API_BASE_URL}/complaints/${complaintId}`, payload);
  }

  assignComplaint(complaintId: string, payload: { assignedTo: string; eta?: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/complaints/${complaintId}/assign`, payload);
  }

  resolveComplaint(complaintId: string, payload: { resolutionNotes: string; resolutionPhotos?: string[] }): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/complaints/${complaintId}/resolve`, payload);
  }
}
