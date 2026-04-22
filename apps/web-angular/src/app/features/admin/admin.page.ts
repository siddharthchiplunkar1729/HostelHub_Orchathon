import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminHostelSummary, HostelService } from '../../core/services/hostel.service';
import { AdminService, AdminUserSummary } from '../../core/services/admin.service';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <!-- Admin header bar -->
      <section class="admin-header-bar">
        <div class="admin-header-bar-left">
          <div class="icon-box" style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:14px;font-size:1.4rem;">🛡️</div>
          <div>
            <h1 style="margin:0;font-size:1.5rem;font-weight:900;letter-spacing:-0.02em">Admin Console</h1>
            <p style="margin:0;font-size:0.72rem;color:rgba(255,255,255,0.6);font-weight:700;text-transform:uppercase;letter-spacing:0.15em">Marketplace Orchestrator</p>
          </div>
        </div>
        <div class="admin-header-bar-right">
          <div style="text-align:right">
            <p style="margin:0;font-size:0.875rem;font-weight:700">University Administrator</p>
            <p style="margin:0;font-size:0.75rem;color:rgba(255,255,255,0.55)">admin&#64;hostelhub.com</p>
          </div>
          <div class="avatar" style="width:48px;height:48px;font-size:1.1rem;border:2px solid rgba(255,255,255,0.25);">A</div>
        </div>
      </section>

      <!-- Stats grid -->
      <section class="stats-grid">
        <article class="stat-card stat-card--accent">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Pending Approvals</div>
              <strong style="color:var(--accent)">{{ pending }}</strong>
            </div>
            <div class="stat-icon" style="background:var(--accent-light);color:var(--accent)">⏳</div>
          </div>
        </article>
        <article class="stat-card stat-card--success">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Approved Hostels</div>
              <strong style="color:var(--success)">{{ approved }}</strong>
            </div>
            <div class="stat-icon" style="background:var(--success-light);color:var(--success)">✅</div>
          </div>
        </article>
        <article class="stat-card stat-card--primary">
          <div class="stat-card-inner">
            <div>
              <div class="muted">Total Listings</div>
              <strong style="color:var(--primary)">{{ hostels.length }}</strong>
            </div>
            <div class="stat-icon" style="background:var(--primary-light);color:var(--primary)">🏢</div>
          </div>
        </article>
      </section>

      <!-- Admin Navigation Tabs -->
      <div class="tab-row" style="margin: 24px 0;">
        <button class="filter-tab" [class.active]="activeTab === 'hostels'" (click)="activeTab = 'hostels'">Hostel Listings</button>
        <button class="filter-tab" [class.active]="activeTab === 'users'" (click)="activeTab = 'users'; loadUsers()">User Management</button>
      </div>

      <ng-container *ngIf="activeTab === 'hostels'">
      <!-- Search + filter bar -->
      <section class="card" style="padding:20px 24px">
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
          <div class="search-wrap" style="flex:1;min-width:200px">
            <span class="search-icon">🔍</span>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search by block name or warden…">
          </div>
          <div class="field" style="min-width:180px">
            <select [(ngModel)]="selectedLocation" style="padding:10px 14px;border-radius:var(--radius-full)">
              <option value="">All Regions</option>
              <option *ngFor="let loc of locationOptions" [value]="loc">{{ loc }}</option>
            </select>
          </div>
          <div class="filter-tabs">
            <button *ngFor="let t of filterOptions"
              class="filter-tab" [class.active]="activeFilter === t"
              (click)="activeFilter = t">{{ t }}</button>
          </div>
        </div>
      </section>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Fetching listing requests…</p>
      </div>

      <!-- Hostel list -->
      <section *ngIf="!loading && filteredHostels.length" class="list">
        <article class="hostel-admin-card" *ngFor="let hostel of filteredHostels">
          <div class="hostel-admin-info">
            <div class="icon-box" style="width:56px;height:56px;background:var(--primary-light);border-radius:var(--radius-sm);font-size:1.5rem">🏢</div>
            <div>
              <h3 style="margin:0 0 4px;font-size:1.1rem;font-weight:800;letter-spacing:-0.02em">{{ hostel.blockName }}</h3>
              <p class="muted" style="margin:0;font-size:0.82rem">{{ hostel.type }} · {{ hostel.location }}</p>
            </div>
          </div>

          <div class="hostel-admin-stats">
            <div class="hostel-stat">
              <div class="muted">Rooms</div>
              <strong>{{ hostel.availableRooms }}<small style="font-weight:600;font-size:0.75rem;color:var(--muted)">/{{ hostel.totalRooms }}</small></strong>
            </div>
            <div class="hostel-stat">
              <div class="muted">Rating</div>
              <strong>⭐ {{ hostel.rating.toFixed(1) }}</strong>
            </div>
          </div>

          <div class="hostel-admin-warden">
            <div class="avatar" style="width:40px;height:40px;font-size:0.9rem">{{ hostel.wardenInfo.name.charAt(0) }}</div>
            <div>
              <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted)">Warden</div>
              <div style="font-size:0.875rem;font-weight:700">{{ hostel.wardenInfo.name }}</div>
            </div>
          </div>

          <div class="hostel-admin-actions">
            <span class="status-pill" [class.pending]="hostel.approvalStatus !== 'Approved'" [class.rejected]="hostel.approvalStatus === 'Rejected'">
              {{ hostel.approvalStatus }}
            </span>
            <a class="btn sm ghost" [routerLink]="['/hostels', hostel._id]">View</a>
            <button class="btn sm" *ngIf="hostel.approvalStatus === 'Pending'" type="button" (click)="toggleApprovalForm(hostel._id)">
              {{ expandedId === hostel._id ? 'Cancel' : 'Review' }}
            </button>
          </div>

          <!-- Approval form (expanded) -->
          <div *ngIf="expandedId === hostel._id && hostel.approvalStatus === 'Pending'" class="approval-form">
            <div class="form-divider"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <button
                type="button"
                class="decision-btn approve"
                [class.active]="selectedDecision === 'Approved'"
                (click)="selectedDecision = 'Approved'">
                ✅ Approve
              </button>
              <button
                type="button"
                class="decision-btn reject"
                [class.active]="selectedDecision === 'Rejected'"
                (click)="selectedDecision = 'Rejected'">
                ❌ Reject
              </button>
            </div>
            <textarea
              [(ngModel)]="approvalComments"
              placeholder="Add remarks about this decision…"
              style="width:100%;min-height:80px;padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:inherit;font-size:0.875rem;margin-bottom:12px">
            </textarea>
            <div style="display:flex;gap:8px">
              <button class="btn sm" type="button" (click)="submitApproval(hostel)" [disabled]="!selectedDecision || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Decision' }}
              </button>
              <button class="btn sm ghost" type="button" (click)="toggleApprovalForm(null)">Cancel</button>
            </div>
          </div>
        </article>
      </section>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && !filteredHostels.length">
        <span class="icon">✨</span>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">No listing requests!</h2>
        <p>All clear. New requests will appear here for verification.</p>
      </div>
      </ng-container>

      <ng-container *ngIf="activeTab === 'users'">
        <section class="card" style="padding:20px 24px">
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
            <div class="search-wrap" style="flex:1;min-width:200px">
              <span class="search-icon">🔍</span>
              <input type="text" [(ngModel)]="userSearchQuery" placeholder="Search users by name, email or role...">
            </div>
            <div class="field" style="min-width:180px">
              <select [(ngModel)]="userRoleFilter" style="padding:10px 14px;border-radius:var(--radius-full)">
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Warden">Warden</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
        </section>

        <div class="loading-state" *ngIf="loadingUsers">
          <div class="spinner"></div>
          <p>Fetching user accounts...</p>
        </div>

        <section *ngIf="!loadingUsers && filteredUsers.length" class="list">
          <article class="hostel-admin-card" *ngFor="let u of filteredUsers">
            <div class="hostel-admin-info">
              <div class="icon-box" style="width:56px;height:56px;background:var(--primary-light);border-radius:50%;font-size:1.5rem">👤</div>
              <div>
                <h3 style="margin:0 0 4px;font-size:1.1rem;font-weight:800;letter-spacing:-0.02em">{{ u.name }}</h3>
                <p class="muted" style="margin:0;font-size:0.82rem">{{ u.email }} · {{ u.phone || 'No phone' }}</p>
              </div>
            </div>
            
            <div class="hostel-admin-stats">
              <div class="hostel-stat">
                <div class="muted">Role</div>
                <strong [ngClass]="{'color-primary': u.role === 'Admin', 'color-accent': u.role === 'Warden'}">{{ u.role }}</strong>
              </div>
            </div>

            <div class="hostel-admin-actions">
              <div class="field" style="margin: 0;">
                <select [ngModel]="u.role" (ngModelChange)="updateUserRole(u._id, $event)" [disabled]="u.role === 'Admin'" style="padding: 6px 12px; font-size: 0.9rem;">
                  <option value="Student">Student</option>
                  <option value="Warden">Warden</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
          </article>
        </section>

        <div class="empty-state" *ngIf="!loadingUsers && !filteredUsers.length">
          <span class="icon">🔍</span>
          <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">No users found</h2>
          <p>Try adjusting your search filters.</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .admin-header-bar {
      display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;
      padding:28px 32px;border-radius:var(--radius-xl);
      background:linear-gradient(135deg,#0c1f6e 0%,#1d4ed8 60%);
      color:white;box-shadow:0 16px 40px rgba(29,78,216,0.3);
    }
    .admin-header-bar-left,.admin-header-bar-right { display:flex;align-items:center;gap:16px; }

    .stat-card-inner { display:flex;justify-content:space-between;align-items:center;gap:12px; }
    .stat-icon { width:52px;height:52px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:1.3rem;transition:transform .3s; }
    .stat-card:hover .stat-icon { transform:scale(1.1); }

    .hostel-admin-card {
      background:white;border:1px solid var(--border);border-radius:var(--radius-xl);
      padding:20px 24px;display:flex;align-items:center;flex-wrap:wrap;gap:16px;
      box-shadow:var(--shadow-sm);transition:box-shadow .25s,transform .25s;
    }
    .hostel-admin-card:hover { box-shadow:var(--shadow);transform:translateY(-2px); }
    .hostel-admin-info { display:flex;align-items:center;gap:14px;flex:1;min-width:200px; }
    .hostel-admin-stats { display:flex;gap:24px;padding:0 24px;border-left:1px solid var(--border);border-right:1px solid var(--border); }
    .hostel-stat { text-align:center; }
    .hostel-stat .muted { font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em; }
    .hostel-stat strong { font-size:1.1rem;font-weight:900;display:block;margin-top:2px; }
    .hostel-admin-warden { display:flex;align-items:center;gap:10px; }
    .hostel-admin-actions { display:flex;align-items:center;gap:10px;margin-left:auto;flex-wrap:wrap; }

    .form-divider { height:1px;background:var(--border);margin:16px 0; }

    .approval-form {
      margin-top:16px;padding:16px;background:var(--surface-alt);border-radius:var(--radius-sm);
    }

    .decision-btn {
      padding:12px;border:2px solid var(--border);border-radius:var(--radius-sm);
      background:white;cursor:pointer;font-weight:600;font-size:0.9rem;
      transition:all 0.2s;
    }
    .decision-btn:hover { border-color:var(--primary);background:var(--primary-light); }
    .decision-btn.approve.active { border-color:var(--success);background:var(--success-light);color:var(--success); }
    .decision-btn.approve.active { border-color:var(--success);background:var(--success-light);color:var(--success); }
    .decision-btn.reject.active { border-color:var(--danger);background:var(--danger-light);color:var(--danger); }
    .color-primary { color: var(--primary) !important; }
    .color-accent { color: var(--accent) !important; }
  `]
})
export class AdminPageComponent {
  private readonly hostelService = inject(HostelService);
  private readonly adminService = inject(AdminService);

  hostels: AdminHostelSummary[] = [];
  loading = true;
  searchQuery = '';
  activeFilter = 'All';
  activeTab: 'hostels' | 'users' = 'hostels';
  expandedId: string | null = null;
  selectedDecision: 'Approved' | 'Rejected' | null = null;
  approvalComments = '';
  submitting = false;
  message = '';
  selectedLocation = '';
  readonly filterOptions = ['All', 'Pending', 'Approved', 'Rejected'];
  readonly locationOptions = ['North Campus', 'South Campus', 'East Campus', 'West Campus', 'Off-Campus'];

  users: AdminUserSummary[] = [];
  loadingUsers = false;
  userSearchQuery = '';
  userRoleFilter = '';

  get pending()  { return this.hostels.filter(h => h.approvalStatus === 'Pending').length; }
  get approved() { return this.hostels.filter(h => h.approvalStatus === 'Approved').length; }

  get filteredHostels() {
    return this.hostels.filter(h => {
      const matchFilter = this.activeFilter === 'All' || h.approvalStatus === this.activeFilter;
      const matchLocation = !this.selectedLocation || h.location === this.selectedLocation;
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q || h.blockName.toLowerCase().includes(q) || h.wardenInfo.name.toLowerCase().includes(q);
      return matchFilter && matchLocation && matchSearch;
    });
  }

  get filteredUsers() {
    return this.users.filter(u => {
      const matchRole = !this.userRoleFilter || u.role === this.userRoleFilter;
      const q = this.userSearchQuery.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }

  constructor() {
    this.hostelService.getAdminHostels().subscribe({
      next: (data) => { this.hostels = data; this.loading = false; },
      error: ()   => { this.hostels = [];  this.loading = false; }
    });
  }

  toggleApprovalForm(id: string | null): void {
    this.expandedId = this.expandedId === id ? null : id;
    if (id === null) {
      this.selectedDecision = null;
      this.approvalComments = '';
    }
  }

  submitApproval(hostel: AdminHostelSummary): void {
    if (!this.selectedDecision) {
      this.message = 'Please select a decision.';
      return;
    }

    this.submitting = true;
    this.adminService.approveHostelListing(hostel._id, this.selectedDecision, this.approvalComments).subscribe({
      next: (res) => {
        (hostel as any).approvalStatus = this.selectedDecision;
        this.expandedId = null;
        this.message = `Hostel ${this.selectedDecision?.toLowerCase()}. Decision submitted successfully.`;
        this.submitting = false;
        this.selectedDecision = null;
        this.approvalComments = '';
      },
      error: (err) => {
        this.message = err.error?.error || 'Failed to submit decision.';
        this.submitting = false;
      }
    });
  }

  loadUsers(): void {
    if (this.users.length > 0) return;
    this.loadingUsers = true;
    this.adminService.getUsers().subscribe({
      next: (data) => { this.users = data; this.loadingUsers = false; },
      error: () => { this.users = []; this.loadingUsers = false; }
    });
  }

  updateUserRole(userId: string, role: string): void {
    if (!confirm(`Are you sure you want to change this user's role to ${role}?`)) return;
    
    this.adminService.updateUserRole(userId, role).subscribe({
      next: (res) => {
        const u = this.users.find(u => u._id === userId);
        if (u) u.role = role;
        this.message = 'User role updated successfully.';
      },
      error: (err) => {
        this.message = err.error?.error || 'Failed to update user role.';
      }
    });
  }
}
