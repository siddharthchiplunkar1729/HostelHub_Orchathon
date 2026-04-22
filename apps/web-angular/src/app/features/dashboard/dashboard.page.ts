import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardPayload, DashboardService } from '../../core/services/dashboard.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page" *ngIf="isLoggedIn; else loginPrompt">
      <!-- Hero -->
      <section class="hero-card">
        <div class="eyebrow">Student dashboard</div>
        <h1>Welcome back{{ data?.student?.name ? ', ' + data?.student?.name : '' }}. 👋</h1>
        <p>Your personal hub for hostel management, notices, mess schedule, and more.</p>
        <div class="actions-row">
          <a class="btn ghost" routerLink="/dashboard/profile">My Profile</a>
          <a class="btn ghost" routerLink="/dashboard/notices">Notices</a>
          <a class="btn ghost" routerLink="/dashboard/mess-menu">Mess Menu</a>
          <a class="btn"       routerLink="/fee-payment">Fee Payment</a>
        </div>
      </section>

      <!-- Stats -->
      <section class="stats-grid" *ngIf="data?.student">
        <article class="stat-card">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Enrollment</div>
              <strong [style.color]="data?.student?.enrollmentStatus === 'Enrolled' ? 'var(--success)' : 'var(--accent)'">
                {{ data?.student?.enrollmentStatus || 'Pending' }}
              </strong>
            </div>
            <span style="font-size:1.8rem">🎓</span>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Room</div>
              <strong>{{ data?.student?.roomNumber || 'Pending' }}</strong>
            </div>
            <span style="font-size:1.8rem">🛏️</span>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Fee status</div>
              <strong [style.color]="data?.student?.feeStatus?.isPaid ? 'var(--success)' : 'var(--danger)'">
                {{ data?.student?.feeStatus?.isPaid ? 'Paid ✓' : 'Pending' }}
              </strong>
            </div>
            <span style="font-size:1.8rem">💳</span>
          </div>
        </article>
      </section>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading dashboard data…</p>
      </div>

      <!-- Application Tracking (For Pending Students) -->
      <section class="card" *ngIf="!loading && data?.student?.enrollmentStatus === 'Pending'" style="margin-bottom: 24px; background: var(--surface-alt); border: 2px dashed var(--border);">
        <div class="section-header" style="margin-bottom: 12px;">
          <div>
            <h2 style="font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.5rem;">⏳</span> Application under review
            </h2>
            <p class="muted">Your application for hostel accommodation is currently being processed by the administration.</p>
          </div>
        </div>
        <div class="actions-row">
          <a class="btn" routerLink="/applications">Track Application Status</a>
          <a class="btn ghost" routerLink="/search">Browse other hostels</a>
        </div>
      </section>

      <!-- Complaints + Notices grid -->
      <section class="grid two" *ngIf="!loading">
        <!-- Complaints -->
        <article class="card">
          <div class="section-header">
            <div>
              <h2>Support Tickets</h2>
              <p class="muted">Latest complaints for your profile</p>
            </div>
            <a routerLink="/complaints">View all</a>
          </div>
          <div class="list" *ngIf="data?.complaints?.length; else noComplaints">
            <div class="complaint-row" *ngFor="let c of data?.complaints">
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:0.9rem;margin-bottom:2px">{{ c.title }}</div>
                <div class="muted">{{ c.createdAt | date:'mediumDate' }}</div>
              </div>
              <span class="status-pill" [class.pending]="c.status !== 'Resolved'">{{ c.status }}</span>
            </div>
          </div>
          <ng-template #noComplaints>
            <div class="empty-state" style="padding:28px">No complaints yet. 🎉</div>
          </ng-template>
        </article>

        <!-- Notices -->
        <article class="card">
          <div class="section-header">
            <div>
              <h2>Notices</h2>
              <p class="muted">Official updates from administration</p>
            </div>
            <a routerLink="/dashboard/notices">Archive</a>
          </div>
          <div class="list" *ngIf="data?.notices?.length; else noNotices">
            <div class="notice-row" *ngFor="let n of data?.notices?.slice(0, 3)">
              <span class="badge" [class.danger]="n.priority === 'High'" [class.accent]="n.priority === 'Medium'">{{ n.priority }}</span>
              <div>
                <div style="font-weight:700;font-size:0.9rem;margin-bottom:2px">{{ n.title }}</div>
                <p class="muted" style="margin:0;font-size:0.82rem">{{ n.content }}</p>
              </div>
            </div>
          </div>
          <ng-template #noNotices>
            <div class="empty-state" style="padding:28px">No notices right now.</div>
          </ng-template>
        </article>
      </section>

      <!-- Mess menu section -->
      <section class="card" *ngIf="data?.messMenu && !loading">
        <div class="section-header">
          <div>
            <h2>Today's Mess Menu</h2>
            <p class="muted">{{ data?.messMenu?.day }}</p>
          </div>
          <a routerLink="/dashboard/mess-menu">Full week</a>
        </div>
        <div class="cards-grid">
          <article class="meal-card">
            <div class="meal-icon">🌅</div>
            <strong>Breakfast</strong>
            <p style="margin:6px 0 0;font-size:0.875rem">{{ data?.messMenu?.breakfast || 'Not posted' }}</p>
          </article>
          <article class="meal-card">
            <div class="meal-icon">☀️</div>
            <strong>Lunch</strong>
            <p style="margin:6px 0 0;font-size:0.875rem">{{ data?.messMenu?.lunch || 'Not posted' }}</p>
          </article>
          <article class="meal-card">
            <div class="meal-icon">🍎</div>
            <strong>Snacks</strong>
            <p style="margin:6px 0 0;font-size:0.875rem">{{ data?.messMenu?.snacks || 'Not posted' }}</p>
          </article>
          <article class="meal-card">
            <div class="meal-icon">🌙</div>
            <strong>Dinner</strong>
            <p style="margin:6px 0 0;font-size:0.875rem">{{ data?.messMenu?.dinner || 'Not posted' }}</p>
          </article>
        </div>
      </section>

      <p class="muted" *ngIf="message" style="text-align:center">{{ message }}</p>
    </div>

    <ng-template #loginPrompt>
      <div class="empty-state" style="margin-top:40px">
        <span class="icon">🔐</span>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">Login required</h2>
        <p>Log in as a student to unlock your personalised dashboard.</p>
        <a class="btn" routerLink="/auth/login" style="margin-top:20px">Sign in →</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .stat-card-inner { display:flex;justify-content:space-between;align-items:center;gap:12px; }
    .complaint-row { display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface-alt);border-radius:var(--radius-sm); }
    .notice-row { display:flex;align-items:flex-start;gap:12px;padding:12px;background:var(--surface-alt);border-radius:var(--radius-sm); }
    .meal-card { background:var(--surface-alt);border-radius:var(--radius);padding:18px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px; }
    .meal-icon { font-size:2rem;margin-bottom:4px; }
    .meal-card strong { font-weight:800;font-size:0.95rem; }
  `]
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  readonly isLoggedIn = this.authService.isAuthenticated();
  data: DashboardPayload | null = null;
  loading = false;
  message = '';

  constructor() {
    if (this.isLoggedIn) { this.load(); }
  }

  load(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (r)  => { this.data = r; this.loading = false; },
      error: (e) => { this.message = e.error?.error ?? 'Dashboard data could not be loaded.'; this.loading = false; }
    });
  }
}
