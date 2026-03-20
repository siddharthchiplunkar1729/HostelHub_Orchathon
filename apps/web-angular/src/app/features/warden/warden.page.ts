import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApplicationsService } from '../../core/services/applications.service';
import { WardenService } from '../../core/services/warden.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page" *ngIf="isWarden; else notWarden">
      <!-- Warden header bar -->
      <section class="admin-header" style="background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%); border-bottom: none; margin-bottom: 24px;">
        <div style="display:flex;align-items:center;gap:16px">
          <div class="icon-box" style="width:52px;height:52px;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);border-radius:14px;font-size:1.5rem;display:flex;align-items:center;justify-content:center">🏢</div>
          <div>
            <h1 style="margin:0;font-size:1.5rem;font-weight:900;letter-spacing:-0.03em;color:white">Warden Command</h1>
            <p style="margin:0;font-size:0.75rem;color:rgba(255,255,255,0.7);font-weight:700;text-transform:uppercase;letter-spacing:0.12em">Block Management Authority</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <a routerLink="/notices" class="btn sm" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white">Manage Notices</a>
          <a routerLink="/mess-menu" class="btn sm" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white">Mess Menu</a>
        </div>
      </section>

      <!-- Stats grid -->
      <section class="stats-grid">
        <article class="stat-card">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Pending Applications</div>
              <strong style="color:var(--accent)">{{ pendingCount }}</strong>
            </div>
            <div style="font-size:1.5rem">⏳</div>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Total Applications</div>
              <strong style="color:var(--primary)">{{ applications.length }}</strong>
            </div>
            <div style="font-size:1.5rem">📋</div>
          </div>
        </article>
        <article class="stat-card">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Approved</div>
              <strong style="color:var(--success)">{{ approvedCount }}</strong>
            </div>
            <div style="font-size:1.5rem">✅</div>
          </div>
        </article>
      </section>

      <!-- Filter tabs -->
      <section class="card glass" style="padding:12px 20px; margin-bottom: 24px; border: 1px solid rgba(124, 58, 237, 0.1);">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'Pending'"
            (click)="activeFilter = 'Pending'">
            <span style="font-size:1.1rem;margin-right:6px">⏳</span> Pending
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'Approved'"
            (click)="activeFilter = 'Approved'">
            <span style="font-size:1.1rem;margin-right:6px">✅</span> Approved
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'Rejected'"
            (click)="activeFilter = 'Rejected'">
            <span style="font-size:1.1rem;margin-right:6px">❌</span> Rejected
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'All'"
            (click)="activeFilter = 'All'">
            Show All
          </button>
        </div>
      </section>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading applications…</p>
      </div>

      <!-- Applications list -->
      <section class="applications-list" *ngIf="!loading && filteredApplications.length">
        <article class="app-card" *ngFor="let app of filteredApplications" [class.expanded]="expandedId === app._id">
          <div class="app-header">
            <div class="app-info">
              <h3 class="app-title">{{ app.studentName || 'Student' }}</h3>
              <p class="app-meta">{{ app.email }} · {{ app.createdAt | date:'mediumDate' }}</p>
            </div>
            <span class="status-badge" [ngClass]="'status-' + app.status.toLowerCase()">
              {{ app.status }}
            </span>
          </div>

          <div class="app-details">
            <div class="detail-row">
              <span class="label">Roll Number</span>
              <span class="value">{{ app.rollNumber || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Course</span>
              <span class="value">{{ app.course || 'N/A' }} - Year {{ app.year || 'N/A' }}</span>
            </div>
          </div>

          <button type="button" class="btn sm ghost" (click)="toggleExpanded(app._id)" *ngIf="app.status === 'Pending'">
            {{ expandedId === app._id ? 'Hide' : 'Show' }} Review Form
          </button>

          <!-- Review form (expanded) -->
          <div *ngIf="expandedId === app._id && app.status === 'Pending'" class="review-form">
            <div class="form-divider"></div>
            <form [formGroup]="reviewForm" (ngSubmit)="submitReview(app)">
              <div class="field">
                <label>Your Decision</label>
                <div class="decision-buttons">
                  <button
                    type="button"
                    class="decision-btn approve"
                    [class.active]="reviewForm.get('decision')?.value === 'Accepted'"
                    (click)="reviewForm.patchValue({ decision: 'Accepted' })">
                    ✅ Approve
                  </button>
                  <button
                    type="button"
                    class="decision-btn reject"
                    [class.active]="reviewForm.get('decision')?.value === 'Rejected'"
                    (click)="reviewForm.patchValue({ decision: 'Rejected' })">
                    ❌ Reject
                  </button>
                </div>
              </div>

              <div class="field">
                <label>Comments (optional)</label>
                <textarea formControlName="comments" placeholder="Add any remarks about this application…"></textarea>
              </div>

              <button class="btn" type="submit" [disabled]="reviewForm.invalid || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Review' }}
              </button>
            </form>
          </div>
        </article>
      </section>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !filteredApplications.length">
        <span class="icon">📭</span>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">
          {{ activeFilter === 'All' ? 'No applications' : 'No ' + activeFilter.toLowerCase() + ' applications' }}
        </h2>
        <p>{{ activeFilter === 'All' ? 'No applications for this hostel block yet.' : 'All done with ' + activeFilter.toLowerCase() + ' applications!' }}</p>
      </div>

      <p class="muted" *ngIf="message" style="text-align:center;margin-top:16px">{{ message }}</p>
    </div>

    <ng-template #notWarden>
      <div class="empty-state" style="margin-top:60px">
        <span class="icon">🔐</span>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">Access Denied</h2>
        <p>Only wardens can access this panel. Log in as a warden to continue.</p>
        <a class="btn" routerLink="/auth/login" style="margin-top:20px">Sign in as Warden →</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .applications-list { display:grid;gap:16px; }

    .app-card {
      background:white;border:1px solid var(--border);border-radius:var(--radius-xl);
      padding:20px;box-shadow:var(--shadow-sm);transition:all 0.25s;
    }
    .app-card:hover {
      box-shadow:var(--shadow);transform:translateY(-2px);
    }
    .app-card.expanded {
      border-color:var(--primary);box-shadow:var(--shadow-lg);
    }

    .app-header {
      display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;
    }

    .app-info {
      flex:1;
    }

    .app-title {
      margin:0;font-size:1.1rem;font-weight:800;letter-spacing:-0.02em;
    }

    .app-meta {
      margin:4px 0 0;font-size:0.82rem;color:var(--muted);
    }

    .status-badge {
      display:inline-flex;align-items:center;padding:6px 12px;border-radius:var(--radius-full);
      font-size:0.75rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;
      white-space:nowrap;
    }
    .status-badge.status-pending {
      background:var(--accent-light);color:#92400e;
    }
    .status-badge.status-approved {
      background:var(--success-light);color:var(--success);
    }
    .status-badge.status-rejected {
      background:var(--danger-light);color:var(--danger);
    }

    .app-details {
      margin:12px 0;padding:12px;background:var(--surface-alt);border-radius:var(--radius-sm);
    }

    .detail-row {
      display:flex;justify-content:space-between;gap:12px;font-size:0.875rem;padding:6px 0;
    }
    .detail-row .label { font-weight:700;color:var(--muted);min-width:100px; }
    .detail-row .value { color:var(--text); }

    .form-divider {
      height:1px;background:var(--border);margin:16px 0;
    }

    .review-form {
      margin-top:16px;padding:16px;background:var(--surface-alt);border-radius:var(--radius-sm);
    }

    .decision-buttons {
      display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;
    }

    .decision-btn {
      padding:12px;border:2px solid var(--border);border-radius:var(--radius-sm);
      background:white;cursor:pointer;font-weight:600;font-size:0.9rem;
      transition:all 0.2s;
    }
    .decision-btn:hover { border-color:var(--primary);background:var(--primary-light); }
    .decision-btn.approve.active { border-color:var(--success);background:var(--success-light);color:var(--success); }
    .decision-btn.reject.active { border-color:var(--danger);background:var(--danger-light);color:var(--danger); }
  `]
})
export class WardenPageComponent {
  private readonly authService = inject(AuthService);
  private readonly wardenService = inject(WardenService);
  private readonly fb = inject(FormBuilder);

  isWarden = this.authService.currentUser()?.role === 'Warden';
  applications: any[] = [];
  stats: any = {
    pendingApplications: 0,
    acceptedApplications: 0
  };
  activeFilter = 'Pending';
  expandedId: string | null = null;
  loading = true;
  submitting = false;
  message = '';

  readonly reviewForm = this.fb.nonNullable.group({
    decision: ['', Validators.required],
    comments: ['']
  });

  get pendingCount() {
    return this.stats.pendingApplications;
  }

  get approvedCount() {
    return this.stats.acceptedApplications;
  }

  get filteredApplications() {
    if (this.activeFilter === 'All') return this.applications;
    const filter = this.activeFilter === 'Approved' ? 'Accepted' : this.activeFilter;
    return this.applications.filter(a => a.status === filter);
  }

  constructor() {
    if (this.isWarden) {
      this.loadApplications();
    }
  }

  loadApplications(): void {
    this.loading = true;
    this.wardenService.getWardenDashboard().subscribe({
      next: (res) => {
        this.applications = (res.applications || []).map((app: any) => ({
          ...app,
          studentName: app.studentId?.name || 'Student',
          email: app.studentId?.email,
          rollNumber: app.studentId?.rollNumber,
          course: app.studentId?.course,
          year: app.studentId?.year
        }));
        this.stats = res.stats || this.stats;
        this.loading = false;
      },
      error: () => {
        this.applications = [];
        this.loading = false;
      }
    });
  }

  toggleExpanded(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  submitReview(app: any): void {
    if (this.reviewForm.invalid) {
      this.message = 'Please complete all required fields.';
      return;
    }

    this.submitting = true;
    const { decision, comments } = this.reviewForm.getRawValue();

    this.wardenService.reviewApplication(app._id, decision as any, comments).subscribe({
      next: (res) => {
        app.status = decision;
        this.expandedId = null;
        this.message = `Application ${decision.toLowerCase()}. Review submitted successfully.`;
        this.submitting = false;
        this.reviewForm.reset();
        // Update stats locally
        if (decision === 'Accepted') {
          this.stats.acceptedApplications++;
          this.stats.pendingApplications--;
        } else if (decision === 'Rejected') {
          this.stats.pendingApplications--;
        }
      },
      error: (err) => {
        this.message = err.error?.error || 'Failed to submit review.';
        this.submitting = false;
      }
    });
  }
}
