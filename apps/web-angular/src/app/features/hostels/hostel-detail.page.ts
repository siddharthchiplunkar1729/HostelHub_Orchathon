import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationsService } from '../../core/services/applications.service';
import { AuthService } from '../../core/services/auth.service';
import { HostelBlockDetail, HostelService } from '../../core/services/hostel.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page" *ngIf="hostel; else loadingOrEmpty">
      <section class="hero-card">
        <div class="eyebrow">{{ hostel.type }} residence</div>
        <h1>{{ hostel.blockName }}</h1>
        <p>{{ hostel.description || 'Verified student accommodation with managed occupancy, facilities, and reviews.' }}</p>
        <div class="actions-row">
          <a class="btn ghost" routerLink="/search">Back to search</a>
          <button class="btn" type="button" (click)="bookHostel()" [disabled]="hostel.availableRooms < 1">
            {{ hostel.availableRooms < 1 ? 'Currently full' : 'Book this hostel' }}
          </button>
        </div>
        <p class="muted" *ngIf="message">{{ message }}</p>
      </section>

      <div class="detail-layout">
        <div class="stack">
          <img class="listing-image" [src]="hostel.images[0] || fallbackImage" [alt]="hostel.blockName">

          <section class="card">
            <div class="section-header">
              <div>
                <h2>Overview</h2>
                <p class="muted">{{ hostel.location }} - Average rating {{ hostel.averageRating || hostel.rating || '4.5' }}</p>
              </div>
            </div>
            <div class="meta-grid">
              <div class="stat-card">
                <div class="muted">Total rooms</div>
                <strong>{{ hostel.totalRooms }}</strong>
              </div>
              <div class="stat-card">
                <div class="muted">Available</div>
                <strong>{{ hostel.availableRooms }}</strong>
              </div>
              <div class="stat-card">
                <div class="muted">Occupied</div>
                <strong>{{ hostel.occupiedRooms }}</strong>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>Facilities</h2>
            <div class="chip-row">
              <span class="chip" *ngFor="let facility of hostel.facilities">{{ facility }}</span>
            </div>
          </section>

          <section class="card" *ngIf="hostel.rooms?.length">
            <h2>Room map</h2>
            <div class="cards-grid">
              <article class="stat-card" *ngFor="let room of hostel.rooms?.slice(0, 8)">
                <div class="muted">{{ room.roomNumber }}</div>
                <strong>{{ room.status }}</strong>
                <div class="muted">{{ room.occupants }}/{{ room.capacity }} occupants</div>
              </article>
            </div>
          </section>

          <section class="card" *ngIf="hostel.reviews?.length">
            <div class="section-header">
              <div>
                <h2>Resident reviews</h2>
                <p class="muted">{{ hostel.totalReviews || hostel.reviews?.length }} reviews loaded</p>
              </div>
            </div>
            <div class="list">
              <article class="stat-card" *ngFor="let review of hostel.reviews?.slice(0, 4)">
                <strong>{{ review.studentId }}</strong>
                <div class="muted">Rating {{ review.rating }}/5 - Helpful {{ review.helpful }}</div>
                <p>{{ review.reviewText }}</p>
              </article>
            </div>
          </section>
        </div>

        <aside class="stack">
          <section class="card">
            <h3>Warden information</h3>
            <div class="list">
              <div><strong>{{ hostel.wardenInfo.name }}</strong></div>
              <div class="muted">{{ hostel.wardenInfo.phone }}</div>
              <div class="muted" *ngIf="hostel.wardenInfo.email">{{ hostel.wardenInfo.email }}</div>
            </div>
          </section>

          <section class="card">
            <h3>Apply for Admission</h3>
            <p class="muted">Submit your application now. If approved, please visit the hostel physically within 12 hours to complete fee payment.</p>
            <div class="actions-row">
              <a class="btn" (click)="bookHostel()" style="cursor: pointer; width: 100%; justify-content: center;">Apply to Hostel</a>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <ng-template #loadingOrEmpty>
      <div class="empty-state">
        {{ loading ? 'Loading hostel details...' : 'The hostel block could not be loaded.' }}
      </div>
    </ng-template>
  `
})
export class HostelDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hostelService = inject(HostelService);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly authService = inject(AuthService);

  readonly fallbackImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80';

  hostel: HostelBlockDetail | null = null;
  loading = true;
  message = '';

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loading = false;
        return;
      }

      this.loading = true;
      this.hostelService.getHostelBlock(id).subscribe({
        next: (data) => {
          this.hostel = data;
          this.loading = false;
        },
        error: () => {
          this.hostel = null;
          this.loading = false;
        }
      });
    });
  }

  bookHostel(): void {
    if (!this.hostel) return;
    
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: `/booking`, hostelId: this.hostel._id, blockName: this.hostel.blockName } });
      return;
    }

    if (user.role !== 'Student') {
      this.message = 'Only students can book hostels.';
      return;
    }

    this.router.navigate(['/booking'], { 
      queryParams: { 
        hostelId: this.hostel._id,
        blockName: this.hostel.blockName
      } 
    });
  }
}
