import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OperationsService } from '../../core/services/operations.service';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <section class="hero-card">
        <div class="eyebrow">📢 Notices</div>
        <h1>Official Hostel Updates</h1>
        <p>Stay informed with important announcements, policies, and updates from your hostel administration.</p>
        <div class="actions-row">
          <a class="btn ghost" routerLink="/dashboard">Back to Dashboard</a>
        </div>
      </section>

      <!-- Filter tabs -->
      <section class="card" style="padding:16px 24px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'All'"
            (click)="activeFilter = 'All'">
            All Notices
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'High'"
            (click)="activeFilter = 'High'">
            🔴 High Priority
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'Medium'"
            (click)="activeFilter = 'Medium'">
            🟡 Medium Priority
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'Low'"
            (click)="activeFilter = 'Low'">
            🟢 Low Priority
          </button>
        </div>
      </section>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading notices…</p>
      </div>

      <!-- Notices list -->
      <section class="notices-list" *ngIf="!loading && filteredNotices.length">
        <article class="notice-card" *ngFor="let notice of filteredNotices">
          <div class="notice-header">
            <div class="notice-badge" [ngClass]="'priority-' + (notice.priority || 'low')">
              {{ getPriorityIcon(notice.priority) }} {{ notice.priority || notice.type || 'General' }}
            </div>
            <div class="notice-date">{{ notice.createdAt | date:'mediumDate' }}</div>
          </div>

          <h3 class="notice-title">{{ notice.title || 'Hostel Notice' }}</h3>
          
          <div class="notice-meta" *ngIf="notice.hostelName">
            <span class="muted">📍 {{ notice.hostelName }}</span>
          </div>

          <p class="notice-content">{{ notice.content || 'Notice details are available.' }}</p>

          <button class="btn sm ghost" type="button" (click)="toggleExpanded(notice._id)">
            {{ expandedId === notice._id ? 'Hide Details' : 'Read More' }}
          </button>

          <!-- Expanded details -->
          <div *ngIf="expandedId === notice._id" class="notice-expanded">
            <div class="expanded-divider"></div>
            <div class="expanded-content">
              <h4>Full Notice</h4>
              <p>{{ notice.content }}</p>
              <div class="notice-footer">
                <small class="muted">Type: {{ notice.type }}</small>
                <small class="muted">Posted: {{ notice.createdAt | date:'full' }}</small>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !filteredNotices.length">
        <span class="icon">📋</span>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">
          {{ notices.length === 0 ? 'No notices available' : 'No notices match your filter' }}
        </h2>
        <p>{{ notices.length === 0 ? 'Check back later for updates.' : 'Try adjusting your filter.' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .notices-list { display:grid;gap:16px; }

    .notice-card {
      background:white;border:1px solid var(--border);border-radius:var(--radius-xl);
      padding:24px;box-shadow:var(--shadow-sm);transition:all 0.25s;
    }
    .notice-card:hover {
      box-shadow:var(--shadow);border-color:var(--primary-deep);
    }

    .notice-header {
      display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;
    }

    .notice-badge {
      display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:var(--radius-full);
      font-size:0.75rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;
      white-space:nowrap;
    }
    .notice-badge.priority-high {
      background:var(--danger-light);color:var(--danger);
    }
    .notice-badge.priority-medium {
      background:var(--accent-light);color:#92400e;
    }
    .notice-badge.priority-low {
      background:var(--success-light);color:var(--success);
    }

    .notice-date {
      font-size:0.8rem;color:var(--muted);font-weight:600;
    }

    .notice-title {
      font-size:1.2rem;font-weight:800;letter-spacing:-0.02em;margin:0 0 8px;color:var(--text);
    }

    .notice-meta {
      margin-bottom:12px;
      font-size:0.875rem;
    }

    .notice-content {
      color:var(--text);line-height:1.6;margin:0 0 16px;font-size:0.95rem;
    }

    .notice-expanded {
      margin-top:16px;
    }
    .expanded-divider {
      height:1px;background:var(--border);margin-bottom:12px;
    }
    .expanded-content {
      padding:12px;background:var(--surface-alt);border-radius:var(--radius-sm);
    }
    .expanded-content h4 {
      margin:0 0 8px;font-size:0.95rem;font-weight:800;
    }
    .expanded-content p {
      margin:0 0 12px;color:var(--text);line-height:1.6;
    }
    .notice-footer {
      display:flex;gap:16px;flex-wrap:wrap;font-size:0.8rem;
    }
  `]
})
export class NoticesPageComponent {
  private readonly operationsService = inject(OperationsService);

  notices: any[] = [];
  loading = true;
  activeFilter = 'All';
  expandedId: string | null = null;

  get filteredNotices() {
    if (this.activeFilter === 'All') {
      return this.notices;
    }
    return this.notices.filter(n => (n.priority || n.type) === this.activeFilter);
  }

  constructor() {
    this.loadNotices();
  }

  loadNotices(): void {
    this.operationsService.getNotices().subscribe({
      next: (data) => {
        this.notices = data;
        this.loading = false;
      },
      error: () => {
        this.notices = [];
        this.loading = false;
      }
    });
  }

  toggleExpanded(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  getPriorityIcon(priority: string | undefined): string {
    const icons: Record<string, string> = {
      'High': '🔴',
      'Medium': '🟡',
      'Low': '🟢'
    };
    return icons[priority || 'Low'] || '📌';
  }
}
