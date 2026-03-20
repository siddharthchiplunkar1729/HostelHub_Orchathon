import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApplicationSummary, ApplicationsService } from '../../core/services/applications.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <section class="hero-card">
        <div class="eyebrow">📋 Applications</div>
        <h1>Track Your Hostel Applications</h1>
        <p>Monitor the status of all your hostel applications from submission through approval.</p>
        <div class="actions-row">
          <a class="btn ghost" routerLink="/search">Browse More Hostels</a>
          <a class="btn" routerLink="/dashboard">Go to Dashboard</a>
        </div>
      </section>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading your applications…</p>
      </div>

      <!-- Applications list -->
      <section *ngIf="!loading && applications.length" class="cards-grid">
        <article class="application-card" *ngFor="let application of applications">
          <div class="application-header">
            <div>
              <h3 style="margin:0 0 4px;font-size:1.1rem;font-weight:800;letter-spacing:-0.02em">
                {{ application.hostelBlockId.blockName }}
              </h3>
              <p class="muted" style="margin:0;font-size:0.82rem">
                📍 {{ application.hostelBlockId.location }} · {{ application.hostelBlockId.type }}
              </p>
            </div>
            <span class="status-badge" [ngClass]="'status-' + getStatusClass(application.status)">
              {{ application.status }}
            </span>
          </div>

          <div class="application-meta">
            <div class="meta-item">
              <div class="muted">Applied on</div>
              <strong>{{ application.createdAt | date:'mediumDate' }}</strong>
            </div>
            <div class="meta-item">
              <div class="muted">Status</div>
              <strong [style.color]="getStatusColor(application.status)">
                {{ getStatusIcon(application.status) }} {{ application.status }}
              </strong>
            </div>
          </div>

          <p class="muted" style="margin:12px 0;font-size:0.85rem;line-height:1.5">
            {{ getStatusMessage(application.status) }}
          </p>

          <div class="application-actions">
            <a class="btn sm ghost" [routerLink]="['/hostels', application.hostelBlockId._id]">View Listing</a>
            <button class="btn sm ghost" type="button" (click)="toggleDetails(application._id)">
              {{ expandedId === application._id ? 'Hide' : 'Show' }} Details
            </button>
          </div>

          <!-- Expanded details -->
          <div *ngIf="expandedId === application._id" class="application-details">
            <div class="details-divider"></div>
            <div class="detail-row">
              <span class="label">Application ID</span>
              <span class="value">{{ application._id }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Block Type</span>
              <span class="value">{{ application.hostelBlockId.type }}</span>
            </div>
            <div class="detail-row" *ngIf="application.applicationData">
              <span class="label">Application Data</span>
              <span class="value">{{ application.applicationData }}</span>
            </div>
          </div>
        </article>
      </section>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !applications.length">
        <span class="icon">📋</span>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">No applications yet</h2>
        <p>You haven't applied to any hostels yet. Start your search to submit your first application.</p>
        <a class="btn" routerLink="/search" style="margin-top:20px">Search Hostels →</a>
      </div>
    </div>
  `,
  styles: [`
    .application-card {
      background:white;border:1px solid var(--border);border-radius:var(--radius-xl);
      padding:20px;box-shadow:var(--shadow-sm);transition:all 0.25s;
    }
    .application-card:hover {
      box-shadow:var(--shadow);transform:translateY(-2px);
    }

    .application-header {
      display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px;
    }

    .status-badge {
      display:inline-flex;align-items:center;padding:6px 12px;border-radius:var(--radius-full);
      font-size:0.75rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;
      white-space:nowrap;
    }
    .status-badge.status-pending {
      background:var(--accent-light);color:#92400e;
    }
    .status-badge.status-accepted {
      background:var(--success-light);color:var(--success);
    }
    .status-badge.status-rejected {
      background:var(--danger-light);color:var(--danger);
    }
    .status-badge.status-approved {
      background:var(--success-light);color:var(--success);
    }

    .application-meta {
      display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;
    }
    .meta-item {
      display:flex;flex-direction:column;gap:2px;
    }
    .meta-item .muted {
      font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;
    }

    .application-actions {
      display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;
    }

    .application-details {
      margin-top:16px;
    }
    .details-divider {
      height:1px;background:var(--border);margin-bottom:12px;
    }
    .detail-row {
      display:flex;justify-content:space-between;gap:12px;padding:8px 0;font-size:0.875rem;
    }
    .detail-row .label {
      font-weight:700;color:var(--muted);min-width:100px;
    }
    .detail-row .value {
      color:var(--text);word-break:break-word;text-align:right;
    }
  `]
})
export class ApplicationsPageComponent {
  private readonly applicationsService = inject(ApplicationsService);

  applications: ApplicationSummary[] = [];
  loading = true;
  expandedId: string | null = null;

  constructor() {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.applicationsService.getMyApplications().subscribe({
      next: (data) => {
        this.applications = data;
        this.loading = false;
      },
      error: () => {
        this.applications = [];
        this.loading = false;
      }
    });
  }

  toggleDetails(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Pending': 'pending',
      'Accepted': 'accepted',
      'Approved': 'approved',
      'Rejected': 'rejected'
    };
    return statusMap[status] || 'pending';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'Pending': '⏳',
      'Accepted': '✅',
      'Approved': '✅',
      'Rejected': '❌'
    };
    return icons[status] || '📋';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Pending': 'var(--accent)',
      'Accepted': 'var(--success)',
      'Approved': 'var(--success)',
      'Rejected': 'var(--danger)'
    };
    return colors[status] || 'var(--text)';
  }

  getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      'Pending': 'Your application is under review. The warden will respond soon.',
      'Accepted': 'Great! Your application has been accepted. Check your email for next steps.',
      'Approved': 'Your application is approved! You can now move in. Contact the warden for check-in details.',
      'Rejected': 'Unfortunately, your application was not approved. Consider applying to other hostels.'
    };
    return messages[status] || 'Your application is being processed.';
  }
}
