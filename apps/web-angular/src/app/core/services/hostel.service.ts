import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface HostelBlockSummary {
  _id: string;
  blockName: string;
  type: string;
  description: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  location: string;
  rating: number;
  virtualTourUrl?: string | null;
  images: string[];
  facilities: string[];
  wardenInfo: {
    name: string;
    phone: string;
  };
  category?: string;
}

export interface HostelBlockDetail extends HostelBlockSummary {
  approvalStatus?: string;
  averageRating?: number;
  totalReviews?: number;
  rooms?: Array<{
    roomNumber: string;
    status: 'Available' | 'Full';
    occupants: number;
    capacity: number;
  }>;
  wardenInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  reviews?: Array<{
    _id: string;
    studentId: string;
    rating: number;
    reviewText: string;
    helpful: number;
    createdAt: string;
  }>;
}

export interface HostelSummary {
  id: string;
  name: string;
  blockName: string;
  type: string;
  description: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  location: string;
  rating: number;
  images: string[];
  facilities: string[];
  messAvailable: boolean;
  approvalStatus: string;
  category?: string;
}

export interface AdminHostelSummary {
  _id: string;
  id: string;
  blockName: string;
  type: string;
  description: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  location: string;
  rating: number;
  approvalStatus: string;
  wardenInfo: {
    name: string;
    email: string;
  };
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class HostelService {
  private readonly http = inject(HttpClient);

  getHostelBlocks(filters?: {
    location?: string;
    types?: string;
    facilities?: string[];
  }): Observable<HostelBlockSummary[]> {
    const params = new URLSearchParams();
    if (filters?.location) {
      params.set('location', filters.location);
    }
    if (filters?.types) {
      params.set('types', filters.types);
    }
    if (filters?.facilities?.length) {
      params.set('facilities', filters.facilities.join(','));
    }

    const queryString = params.toString();
    const query = queryString ? `?${queryString}` : '';
    return this.http.get<HostelBlockSummary[]>(`${API_BASE_URL}/hostel-blocks${query}`);
  }

  getHostelBlock(id: string): Observable<HostelBlockDetail> {
    return this.http.get<HostelBlockDetail>(`${API_BASE_URL}/hostel-blocks/${id}`);
  }

  getHostels(): Observable<HostelSummary[]> {
    return this.http.get<HostelSummary[]>(`${API_BASE_URL}/hostels`);
  }

  getAdminHostels(status?: string): Observable<AdminHostelSummary[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<AdminHostelSummary[]>(`${API_BASE_URL}/admin/hostels${query}`);
  }
}
