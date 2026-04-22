import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HostelBlockSummary, HostelService } from '../../core/services/hostel.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page animate-fade-in-up">
      <section class="hero-card search-hero">
        <div class="eyebrow">Curated Search</div>
        <h1>Available Hostels</h1>
        <p>
          A calmer shortlist of approved hostels with strong visuals, key facts, and direct next steps.
        </p>
      </section>

      <section class="card glass-panel filter-panel">
        <div class="filter-panel__header">
          <div>
            <div class="filter-panel__eyebrow">Refine shortlist</div>
            <h2>Filter hostels</h2>
          </div>
          <div class="actions-row">
            <button class="btn" type="button" (click)="loadHostels()">Apply filters</button>
            <button class="btn ghost" type="button" (click)="resetFilters()">Reset</button>
          </div>
        </div>

        <div class="filter-grid">
          <div class="field">
            <label>Location</label>
            <select [(ngModel)]="location">
              <option value="">All regions</option>
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
        </div>

        <div class="facility-panel">
          <div class="facility-panel__label">Facilities</div>
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

      <div class="section-header section-header--quiet">
        <div>
          <h2>Shortlisted Hostels</h2>
          <p class="muted">{{ loading ? 'Loading hostels...' : displayedHostels.length + ' curated stays shown' }}</p>
        </div>
      </div>

      <div class="loading-state glass-panel" *ngIf="loading" style="max-width:400px;margin:32px auto;">
        <div class="spinner"></div>
        <p>Fetching hostel listings...</p>
      </div>

      <section class="curated-layout animate-stagger" *ngIf="!loading && featuredHostel">
        <article class="featured-hostel">
          <div class="featured-hostel__media hostel-media">
            <img
              class="featured-hostel__image hostel-media__hero"
              [src]="getPrimaryImage(featuredHostel)"
              [alt]="featuredHostel.blockName"
              loading="lazy"
              (error)="handleImageError($event)">

            <div class="featured-hostel__badges">
              <span class="badge">{{ featuredHostel.type }}</span>
              <span class="badge secondary">{{ featuredHostel.category || 'Standard' }}</span>
            </div>

            <div class="hostel-media__thumbs" *ngIf="getGalleryImages(featuredHostel).length > 1">
              <img
                class="hostel-media__thumb"
                *ngFor="let image of getSecondaryImages(featuredHostel)"
                [src]="image"
                [alt]="featuredHostel.blockName + ' preview'"
                loading="lazy"
                (error)="handleImageError($event)">
              <span class="hostel-media__more" *ngIf="getRemainingImageCount(featuredHostel) > 0">
                +{{ getRemainingImageCount(featuredHostel) }}
              </span>
            </div>
          </div>

          <div class="featured-hostel__body">
            <div class="featured-hostel__header">
              <div>
                <div class="featured-hostel__eyebrow">Featured stay</div>
                <h3>{{ featuredHostel.blockName }}</h3>
              </div>
              <div class="featured-hostel__rating">Rating {{ featuredHostel.rating || '4.5' }}</div>
            </div>

            <p class="featured-hostel__location">{{ featuredHostel.location }}</p>
            <p class="featured-hostel__description">
              {{ featuredHostel.description || 'Verified campus housing with modern resident facilities and a clean application flow.' }}
            </p>

            <div class="featured-hostel__stats">
              <div class="featured-stat">
                <span class="featured-stat__label">Available rooms</span>
                <strong>{{ featuredHostel.availableRooms }}</strong>
              </div>
              <div class="featured-stat">
                <span class="featured-stat__label">Total rooms</span>
                <strong>{{ featuredHostel.totalRooms }}</strong>
              </div>
              <div class="featured-stat">
                <span class="featured-stat__label">Resident type</span>
                <strong>{{ featuredHostel.type }}</strong>
              </div>
            </div>

            <div class="chip-row">
              <span class="chip" *ngFor="let f of featuredHostel.facilities.slice(0, 4)">{{ f }}</span>
            </div>

            <div class="actions-row">
              <a class="btn" [routerLink]="['/hostels', featuredHostel._id]">View details</a>
              <a class="btn ghost" *ngIf="canApply" [routerLink]="['/hostels', featuredHostel._id]">Apply now</a>
            </div>
          </div>
        </article>

        <div class="secondary-stack" *ngIf="secondaryHostels.length">
          <article class="secondary-hostel" *ngFor="let hostel of secondaryHostels">
            <div class="secondary-hostel__media">
              <img
                [src]="getPrimaryImage(hostel)"
                [alt]="hostel.blockName"
                loading="lazy"
                (error)="handleImageError($event)">
            </div>

            <div class="secondary-hostel__body">
              <div class="secondary-hostel__topline">
                <span class="badge">{{ hostel.type }}</span>
                <span class="secondary-hostel__rating"> {{ hostel.rating || '4.5' }} </span>
              </div>

              <h3>{{ hostel.blockName }}</h3>
              <p class="secondary-hostel__location">{{ hostel.location }}</p>
              <p class="secondary-hostel__description">
                {{ hostel.description || 'Managed housing with verified facilities and a direct application path.' }}
              </p>

              <div class="secondary-hostel__footer">
                <span class="muted">{{ hostel.availableRooms }} rooms free</span>
                <a class="btn ghost btn sm" [routerLink]="['/hostels', hostel._id]">Open</a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div class="empty-state" *ngIf="!loading && !displayedHostels.length">
        <span class="icon">Housing</span>
        <h2 style="font-size:1.1rem;font-weight:800;margin:0 0 8px">No hostels found</h2>
        <p>Try adjusting your filters or clearing the search.</p>
        <button class="btn ghost" style="margin-top:16px" (click)="resetFilters()">Reset filters</button>
      </div>
    </div>
  `,
  styles: [`
    .search-hero {
      padding: 40px 36px;
      min-height: unset;
    }

    .filter-panel {
      padding: 24px 26px;
      display: grid;
      gap: 20px;
    }

    .filter-panel__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-panel__eyebrow {
      font-size: 0.76rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }

    .filter-panel__header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .facility-panel {
      padding-top: 4px;
      border-top: 1px solid rgba(15, 23, 42, 0.06);
    }

    .facility-panel__label {
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }

    .section-header--quiet {
      margin-bottom: -8px;
    }

    .curated-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.95fr);
      gap: 18px;
      align-items: start;
    }

    .featured-hostel,
    .secondary-hostel {
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 26px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .featured-hostel {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    .featured-hostel__media {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: linear-gradient(135deg, #dbe7ff, #eafaf8);
      position: relative;
    }

    .featured-hostel__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .hostel-media__thumbs {
      position: absolute;
      bottom: 14px;
      right: 14px;
      display: flex;
      gap: 8px;
    }

    .hostel-media__thumb {
      width: 64px;
      height: 44px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid white;
      box-shadow: var(--shadow-sm);
    }

    .hostel-media__more {
      background: rgba(0,0,0,0.7);
      color: white;
      border-radius: 8px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 700;
      backdrop-filter: blur(4px);
      box-shadow: var(--shadow-sm);
    }

    .featured-hostel__badges {
      position: absolute;
      top: 14px;
      left: 14px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .featured-hostel__body {
      display: grid;
      gap: 18px;
      padding: 28px 28px 30px;
      align-content: start;
    }

    .featured-hostel__header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .featured-hostel__eyebrow {
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }

    .featured-hostel__header h3,
    .secondary-hostel__body h3 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .featured-hostel__rating,
    .secondary-hostel__rating {
      white-space: nowrap;
      font-size: 0.9rem;
      font-weight: 800;
      color: #92400e;
      background: rgba(245, 158, 11, 0.12);
      border-radius: 999px;
      padding: 8px 12px;
    }

    .featured-hostel__location,
    .secondary-hostel__location {
      margin: 0;
      color: var(--muted);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .featured-hostel__description,
    .secondary-hostel__description {
      margin: 0;
      color: var(--text-light);
      line-height: 1.65;
      font-size: 0.94rem;
    }

    .featured-hostel__stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .featured-stat {
      padding: 14px 14px 12px;
      border-radius: 18px;
      background: var(--surface-alt);
      border: 1px solid rgba(15, 23, 42, 0.06);
    }

    .featured-stat__label {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
      font-weight: 800;
      margin-bottom: 8px;
    }

    .featured-stat strong {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text);
    }

    .secondary-stack {
      display: grid;
      gap: 18px;
    }

    .secondary-hostel {
      display: grid;
      grid-template-columns: 132px minmax(0, 1fr);
    }

    .secondary-hostel__media img {
      width: 100%;
      height: 100%;
      min-height: 100%;
      object-fit: cover;
      display: block;
    }

    .secondary-hostel__body {
      display: grid;
      gap: 10px;
      padding: 18px 18px 16px;
      align-content: start;
    }

    .secondary-hostel__topline {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
    }

    .secondary-hostel__body h3 {
      font-size: 1.08rem;
    }

    .secondary-hostel__footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-top: 2px;
    }

    @media (max-width: 1100px) {
      .curated-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .search-hero {
        padding: 30px 22px;
      }

      .filter-panel {
        padding: 20px 18px;
      }

      .filter-grid,
      .featured-hostel__stats,
      .secondary-hostel {
        grid-template-columns: 1fr;
      }

      .featured-hostel__body {
        padding: 22px 18px 20px;
      }

      .featured-hostel__header,
      .secondary-hostel__footer,
      .filter-panel__header {
        flex-direction: column;
        align-items: stretch;
      }

      .featured-hostel__image {
        min-height: 250px;
      }

      .secondary-hostel__media img {
        min-height: 190px;
      }
    }
  `]
})
export class HostelListPageComponent {
  private readonly hostelService = inject(HostelService);
  private readonly authService = inject(AuthService);

  readonly canApply = !['Warden', 'Admin'].includes(this.authService.currentUser()?.role ?? '');

  readonly fallbackImage = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80';
  readonly typeOptions = ['Boys', 'Girls', 'Co-ed'];
  readonly locationOptions = ['North Campus', 'South Campus', 'East Campus', 'West Campus', 'Off-Campus'];
  readonly facilityOptions = ['WiFi', 'Gym', 'Library', 'Mess', 'Laundry', 'Sports'];

  hostels: HostelBlockSummary[] = [];
  location = '';
  selectedType = '';
  selectedFacilities: string[] = [];
  loading = false;

  constructor() {
    this.loadHostels();
  }

  loadHostels(): void {
    this.loading = true;
    this.hostelService.getHostelBlocks({
      location: this.location || undefined,
      types: this.selectedType || undefined,
      facilities: this.selectedFacilities
    }).subscribe({
      next: (data) => {
        this.hostels = data;
        this.loading = false;
      },
      error: () => {
        this.hostels = [];
        this.loading = false;
      }
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

  get displayedHostels(): HostelBlockSummary[] {
    const hostelsWithImages = this.hostels.filter((hostel) => this.hasRealImages(hostel));
    const source = hostelsWithImages.length ? hostelsWithImages : this.hostels;
    return source.slice(0, 3);
  }

  get featuredHostel(): HostelBlockSummary | null {
    return this.displayedHostels[0] ?? null;
  }

  get secondaryHostels(): HostelBlockSummary[] {
    return this.displayedHostels.slice(1);
  }

  getPrimaryImage(hostel: HostelBlockSummary): string {
    return this.getGalleryImages(hostel)[0];
  }

  getSecondaryImages(hostel: HostelBlockSummary): string[] {
    return this.getGalleryImages(hostel).slice(1, 3);
  }

  getRemainingImageCount(hostel: HostelBlockSummary): number {
    return Math.max(this.getGalleryImages(hostel).length - 3, 0);
  }

  getGalleryImages(hostel: HostelBlockSummary): string[] {
    const images = (hostel.images ?? [])
      .map((image) => image?.trim())
      .filter((image): image is string => Boolean(image));

    return images.length ? images : [this.fallbackImage];
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src === this.fallbackImage) {
      return;
    }

    image.src = this.fallbackImage;
  }

  private hasRealImages(hostel: HostelBlockSummary): boolean {
    return (hostel.images ?? []).some((image) => Boolean(image?.trim()));
  }
}
