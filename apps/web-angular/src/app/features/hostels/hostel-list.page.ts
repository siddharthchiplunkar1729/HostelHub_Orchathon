import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HostelBlockSummary, HostelService } from '../../core/services/hostel.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page animate-fade-in-up">
      <!-- Hero -->
      <section class="hero-card">
        <div class="eyebrow">🔍 Marketplace</div>
        <h1>Find Your Perfect Hostel</h1>
        <p>Browse approved blocks with smart filters. Each listing routes into a detailed view with application flow.</p>
        <div class="blob blob-1" style="width:300px;top:-50px;left:-50px;"></div>
        <div class="blob blob-2" style="width:250px;bottom:-50px;right:-50px;"></div>
      </section>

      <!-- Filter card -->
      <section class="card glass-panel" style="padding: 28px;">
        <div class="grid three" style="margin-bottom:20px">
          <div class="field">
            <label>Location</label>
            <select [(ngModel)]="location">
              <option value="">All Regions</option>
              <option *ngFor="let loc of locationOptions" [value]="loc">{{ loc }}</option>
            </select>
          </div>
          <div class="field">
            <label>Residency type</label>
            <select [(ngModel)]="selectedType">
              <option value="">All types</option>
              <option *ngFor="let t of typeOptions" [value]="t">{{ t }}</option>
            </select>
          </div>
          <div class="field" style="justify-content:flex-end">
            <label style="opacity:0">Actions</label>
            <div class="actions-row">
              <button class="btn" type="button" (click)="loadHostels()">Apply Filters</button>
              <button class="btn ghost" type="button" (click)="resetFilters()">Reset</button>
            </div>
          </div>
        </div>

        <!-- Facility chips -->
        <div>
          <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:10px">Facilities</div>
          <div class="chip-row">
            <button
              class="chip"
              type="button"
              *ngFor="let f of facilityOptions"
              [class.active]="selectedFacilities.includes(f)"
              (click)="toggleFacility(f)">
              {{ f }}
            </button>
          </div>
        </div>
      </section>

      <!-- Results header -->
      <div class="section-header">
        <div>
          <h2>Available Hostels</h2>
          <p class="muted">{{ loading ? 'Loading listings…' : hostels.length + ' listings found' }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state glass-panel" *ngIf="loading" style="max-width:400px;margin:32px auto;">
        <div class="spinner"></div>
        <p>Fetching premium hostel listings…</p>
      </div>

      <!-- Grid -->
      <section class="cards-grid animate-stagger" *ngIf="!loading && hostels.length">
        <article class="listing-card" *ngFor="let hostel of hostels" style="position:relative;overflow:hidden;border:none;">
          <div style="position:relative">
            <img [src]="hostel.images[0] || fallbackImage" [alt]="hostel.blockName" loading="lazy">
            <div style="position:absolute;top:12px;left:12px;display:flex;gap:6px">
              <span class="badge">{{ hostel.type }}</span>
              <span class="badge secondary">{{ hostel.category || 'Standard' }}</span>
              <span class="badge" style="background:var(--surface);color:var(--text)">{{ hostel.availableRooms }} free</span>
            </div>
          </div>
          <div>
            <div class="section-header" style="margin-bottom:8px">
              <h3 style="font-size:1.05rem;font-weight:800;letter-spacing:-0.02em">{{ hostel.blockName }}</h3>
              <div style="display:flex;align-items:center;gap:4px;color:var(--accent);font-weight:800">
                ⭐ {{ hostel.rating || '4.5' }}
              </div>
            </div>
            <p class="muted" style="font-size:0.82rem;margin:0 0 10px">📍 {{ hostel.location }}</p>
            <p style="font-size:0.875rem;margin:0 0 14px;line-height:1.55">
              {{ hostel.description || 'Verified campus housing with modern resident facilities.' }}
            </p>
            <div class="chip-row" style="margin-bottom:16px">
              <span class="chip" *ngFor="let f of hostel.facilities.slice(0, 4)">{{ f }}</span>
            </div>
            <div class="actions-row">
              <a class="btn" [routerLink]="['/hostels', hostel._id]">View Details</a>
              <a class="btn ghost" [routerLink]="['/hostels', hostel._id]">Apply Now</a>
            </div>
          </div>
        </article>
      </section>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !hostels.length">
        <span class="icon">🏘️</span>
        <h2 style="font-size:1.1rem;font-weight:800;margin:0 0 8px">No hostels found</h2>
        <p>Try adjusting your filters or clearing the search.</p>
        <button class="btn ghost" style="margin-top:16px" (click)="resetFilters()">Reset filters</button>
      </div>
    </div>
  `
})
export class HostelListPageComponent {
  private readonly hostelService = inject(HostelService);

  readonly fallbackImage = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80';
  readonly typeOptions = ['Boys', 'Girls', 'Co-ed'];
  readonly locationOptions = ['North Campus', 'South Campus', 'East Campus', 'West Campus', 'Off-Campus'];
  readonly facilityOptions = ['WiFi', 'Gym', 'Library', 'Mess', 'Laundry', 'Sports'];

  hostels: HostelBlockSummary[] = [];
  location = '';
  selectedType = '';
  selectedFacilities: string[] = [];
  loading = false;

  constructor() { this.loadHostels(); }

  loadHostels(): void {
    this.loading = true;
    this.hostelService.getHostelBlocks({
      location: this.location || undefined,
      types: this.selectedType || undefined,
      facilities: this.selectedFacilities
    }).subscribe({
      next: (data) => { this.hostels = data; this.loading = false; },
      error: ()    => { this.hostels = [];  this.loading = false; }
    });
  }

  toggleFacility(f: string): void {
    this.selectedFacilities = this.selectedFacilities.includes(f)
      ? this.selectedFacilities.filter(x => x !== f)
      : [...this.selectedFacilities, f];
  }

  resetFilters(): void {
    this.location = '';
    this.selectedType = '';
    this.selectedFacilities = [];
    this.loadHostels();
  }
}
