import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  SaveHostelPayload,
  SaveMessMenuPayload,
  SaveNoticePayload,
  WardenApplication,
  WardenDashboardResponse,
  WardenMessMenu,
  WardenNotice,
  WardenService
} from '../../core/services/warden.service';
import { AuthService } from '../../core/services/auth.service';
import { HostelBlockSummary } from '../../core/services/hostel.service';

type WardenSection = 'overview' | 'applications' | 'complaints' | 'notices' | 'mess' | 'hostels';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page" *ngIf="isWarden; else notWarden">
      <section class="hero-card warden-hero">
        <div class="eyebrow">Warden Workspace</div>
        <h1>Block Operations Dashboard</h1>
        <p>Manage applications, notices, dining schedules, and hostel details from one focused control surface.</p>

        <!-- toolbar shown only when blocks exist -->
        <div class="warden-hero__toolbar" *ngIf="blocks().length">
          <div class="field warden-hero__selector">
            <label>Active hostel block</label>
            <select [ngModel]="selectedBlockId()" (ngModelChange)="onBlockChange($event)">
              <option *ngFor="let block of blocks()" [value]="block._id">{{ block.blockName }}</option>
            </select>
          </div>

          <div class="tab-row">
            <button class="filter-tab" [class.active]="activeSection() === 'overview'" (click)="activeSection.set('overview')">Overview</button>
            <button class="filter-tab" [class.active]="activeSection() === 'applications'" (click)="activeSection.set('applications')">Applications</button>
            <button class="filter-tab" [class.active]="activeSection() === 'complaints'" (click)="activeSection.set('complaints')">Complaints</button>
            <button class="filter-tab" [class.active]="activeSection() === 'notices'" (click)="activeSection.set('notices')">Notices</button>
            <button class="filter-tab" [class.active]="activeSection() === 'mess'" (click)="activeSection.set('mess')">Mess menu</button>
            <button class="filter-tab" [class.active]="activeSection() === 'hostels'" (click)="activeSection.set('hostels')">Hostel info</button>
          </div>
        </div>

        <!-- quick create shown when warden has NO blocks yet -->
        <div *ngIf="!loadingDashboard() && !blocks().length" class="actions-row" style="margin-top: 20px;">
          <button class="btn" type="button" (click)="startCreatingBlock()" style="background: white; color: var(--primary); font-weight: 800;">
            ➕ Create Your First Hostel Block
          </button>
        </div>
      </section>

      <div class="loading-state" *ngIf="loadingDashboard()">
        <div class="spinner"></div>
        <p>Loading warden workspace...</p>
      </div>

      <ng-container *ngIf="!loadingDashboard()">
        <section class="stats-grid">
          <article class="stat-card">
            <div class="muted">Managed blocks</div>
            <strong>{{ stats().totalBlocks || blocks().length }}</strong>
          </article>
          <article class="stat-card">
            <div class="muted">Pending applications</div>
            <strong style="color:var(--accent)">{{ stats().pendingApplications || 0 }}</strong>
          </article>
          <article class="stat-card">
            <div class="muted">Approved stays</div>
            <strong style="color:var(--success)">{{ stats().acceptedApplications || 0 }}</strong>
          </article>
          <article class="stat-card">
            <div class="muted">Residents in managed blocks</div>
            <strong style="color:var(--primary)">{{ stats().totalStudents || 0 }}</strong>
          </article>
        </section>

        <section *ngIf="activeSection() === 'overview'" class="warden-section">
          <div class="cards-grid">
            <article class="card block-spotlight" *ngIf="selectedBlock() as block">
              <div class="block-spotlight__media">
                <img [src]="primaryImage(block)" [alt]="block.blockName" (error)="handleImageError($event)">
              </div>
              <div class="block-spotlight__body">
                <div class="section-header" style="margin-bottom:10px">
                  <div>
                    <h2>{{ block.blockName }}</h2>
                    <p class="muted">{{ block.location }} · {{ block.type }}</p>
                  </div>
                  <span class="badge secondary">{{ block.category || 'Standard' }}</span>
                </div>
                <p>{{ block.description || 'No description has been added yet for this hostel block.' }}</p>
                <div class="chip-row">
                  <span class="chip" *ngFor="let facility of block.facilities.slice(0, 5)">{{ facility }}</span>
                </div>
                <div class="overview-stat-grid">
                  <div class="overview-stat">
                    <span class="muted">Total rooms</span>
                    <strong>{{ block.totalRooms }}</strong>
                  </div>
                  <div class="overview-stat">
                    <span class="muted">Available</span>
                    <strong>{{ block.availableRooms }}</strong>
                  </div>
                  <div class="overview-stat">
                    <span class="muted">Occupied</span>
                    <strong>{{ block.occupiedRooms }}</strong>
                  </div>
                </div>
              </div>
            </article>

            <article class="card">
              <h2>Complaint health</h2>
              <div class="overview-stat-grid">
                <div class="overview-stat">
                  <span class="muted">Pending</span>
                  <strong>{{ stats().complaints?.pending || 0 }}</strong>
                </div>
                <div class="overview-stat">
                  <span class="muted">Assigned</span>
                  <strong>{{ stats().complaints?.assigned || 0 }}</strong>
                </div>
                <div class="overview-stat">
                  <span class="muted">In progress</span>
                  <strong>{{ stats().complaints?.inProgress || 0 }}</strong>
                </div>
                <div class="overview-stat">
                  <span class="muted">Resolved today</span>
                  <strong>{{ stats().complaints?.resolvedToday || 0 }}</strong>
                </div>
              </div>
            </article>

            <article class="card">
              <h2>Occupancy snapshot</h2>
              <div class="list">
                <div class="occupancy-row" *ngFor="let row of occupancy()">
                  <div>
                    <strong>{{ row.blockName }}</strong>
                    <div class="muted">{{ row.occupiedRooms }}/{{ row.totalRooms }} rooms occupied</div>
                  </div>
                  <span class="badge">{{ row.occupancyRate }}%</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section *ngIf="activeSection() === 'applications'" class="warden-section">
          <div class="card section-card">
            <div class="section-header">
              <div>
                <h2>Applications review</h2>
                <p class="muted">{{ filteredApplications().length }} applications in this view</p>
              </div>
              <div class="tab-row">
                <button class="filter-tab" [class.active]="applicationFilter() === 'Pending'" (click)="applicationFilter.set('Pending')">Pending</button>
                <button class="filter-tab" [class.active]="applicationFilter() === 'Accepted'" (click)="applicationFilter.set('Accepted')">Accepted</button>
                <button class="filter-tab" [class.active]="applicationFilter() === 'Rejected'" (click)="applicationFilter.set('Rejected')">Rejected</button>
                <button class="filter-tab" [class.active]="applicationFilter() === 'All'" (click)="applicationFilter.set('All')">All</button>
              </div>
            </div>

            <div class="applications-list" *ngIf="filteredApplications().length; else noApplications">
              <article class="app-card" *ngFor="let app of filteredApplications()">
                <div class="app-header">
                  <div>
                    <h3 class="app-title">{{ app.studentId.name }}</h3>
                    <p class="app-meta">{{ app.studentId.email }} · {{ app.createdAt | date:'mediumDate' }}</p>
                  </div>
                  <span class="status-badge" [ngClass]="'status-' + app.status.toLowerCase()">{{ app.status }}</span>
                </div>

                <div class="app-details">
                  <div class="detail-row">
                    <span class="label">Roll number</span>
                    <span class="value">{{ app.studentId.rollNumber || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Department</span>
                    <span class="value">{{ app.studentId.department || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Course</span>
                    <span class="value">{{ app.studentId.course || 'N/A' }} · Year {{ app.studentId.year || 'N/A' }}</span>
                  </div>
                </div>

                <div class="actions-row" *ngIf="app.status === 'Pending'">
                  <button class="btn sm" type="button" (click)="approveApplication(app)">Approve</button>
                  <button class="btn sm ghost" type="button" (click)="openApplicationReview(app, 'Rejected')">Reject with note</button>
                </div>

                <div class="review-form" *ngIf="activeApplicationId() === app._id">
                  <form [formGroup]="reviewForm" (ngSubmit)="submitApplicationReview(app)">
                    <div class="field">
                      <label>Review notes</label>
                      <textarea formControlName="comments" placeholder="Share context for this decision..."></textarea>
                    </div>
                    <div class="actions-row">
                      <button class="btn sm" type="submit" [disabled]="submittingReview()">
                        {{ submittingReview() ? 'Saving...' : 'Submit review' }}
                      </button>
                      <button class="btn sm ghost" type="button" (click)="cancelApplicationReview()">Cancel</button>
                    </div>
                  </form>
                </div>
              </article>
            </div>

            <ng-template #noApplications>
              <div class="empty-state" style="padding:28px">No applications match this filter.</div>
            </ng-template>
          </div>
        </section>

        <section *ngIf="activeSection() === 'complaints'" class="warden-section">
          <div class="card section-card">
            <div class="section-header">
              <div>
                <h2>Complaints queue</h2>
                <p class="muted">Manage and resolve student issues for this block.</p>
              </div>
            </div>

            <div class="loading-state" *ngIf="loadingComplaints()">
              <div class="spinner"></div>
            </div>

            <div class="applications-list" *ngIf="!loadingComplaints() && complaints().length; else noComplaints">
              <article class="app-card" *ngFor="let complaint of complaints()">
                <div class="app-header">
                  <div>
                    <h3 class="app-title">{{ complaint.title }}</h3>
                    <p class="app-meta">{{ complaint.studentId?.name }} (Room {{ complaint.studentId?.roomNumber }}) · {{ complaint.createdAt | date:'mediumDate' }}</p>
                  </div>
                  <span class="status-badge" [ngClass]="'status-' + (complaint.status?.toLowerCase().replace(' ', '') || 'pending')">{{ complaint.status }}</span>
                </div>

                <div class="app-details">
                  <div class="detail-row">
                    <span class="label">Category</span>
                    <span class="value">{{ complaint.category }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Description</span>
                    <span class="value">{{ complaint.description }}</span>
                  </div>
                  <div class="detail-row" *ngIf="complaint.assignedTo">
                    <span class="label">Assigned to</span>
                    <span class="value">{{ complaint.assignedTo }} (ETA: {{ complaint.eta || 'N/A' }})</span>
                  </div>
                </div>

                <div class="actions-row" *ngIf="complaint.status !== 'Resolved'">
                  <button class="btn sm" type="button" (click)="openComplaintAction(complaint, 'resolve')">Resolve</button>
                  <button class="btn sm ghost" type="button" (click)="openComplaintAction(complaint, 'assign')">Assign</button>
                </div>

                <div class="review-form" *ngIf="activeComplaintId() === complaint._id && complaintAction() === 'assign'">
                  <form [formGroup]="assignForm" (ngSubmit)="submitAssignComplaint(complaint)">
                    <div class="filter-grid">
                      <div class="field">
                        <label>Assignee</label>
                        <input formControlName="assignedTo" placeholder="Maintenance Staff Name">
                      </div>
                      <div class="field">
                        <label>ETA</label>
                        <input formControlName="eta" placeholder="Today 4:00 PM">
                      </div>
                    </div>
                    <div class="actions-row">
                      <button class="btn sm" type="submit" [disabled]="assignForm.invalid || submittingComplaint()">
                        {{ submittingComplaint() ? 'Saving...' : 'Assign ticket' }}
                      </button>
                      <button class="btn sm ghost" type="button" (click)="cancelComplaintAction()">Cancel</button>
                    </div>
                  </form>
                </div>

                <div class="review-form" *ngIf="activeComplaintId() === complaint._id && complaintAction() === 'resolve'">
                  <form [formGroup]="resolveForm" (ngSubmit)="submitResolveComplaint(complaint)">
                    <div class="field">
                      <label>Resolution notes</label>
                      <textarea formControlName="resolutionNotes" placeholder="What was done to fix the issue?"></textarea>
                    </div>
                    <div class="actions-row">
                      <button class="btn sm" type="submit" [disabled]="resolveForm.invalid || submittingComplaint()">
                        {{ submittingComplaint() ? 'Saving...' : 'Mark as resolved' }}
                      </button>
                      <button class="btn sm ghost" type="button" (click)="cancelComplaintAction()">Cancel</button>
                    </div>
                  </form>
                </div>
              </article>
            </div>

            <ng-template #noComplaints>
              <div class="empty-state" style="padding:28px" *ngIf="!loadingComplaints()">No complaints found for this block.</div>
            </ng-template>
          </div>
        </section>

        <section *ngIf="activeSection() === 'notices'" class="warden-section two-pane">
          <article class="card section-card">
            <div class="section-header">
              <div>
                <h2>Notice board</h2>
                <p class="muted">Broadcast updates to residents in the active block.</p>
              </div>
            </div>

            <div class="list" *ngIf="notices().length; else noNotices">
              <article class="notice-card" *ngFor="let notice of notices()">
                <div class="section-header" style="margin-bottom:10px">
                  <div>
                    <strong>{{ notice.title }}</strong>
                    <div class="muted">{{ notice.createdAt | date:'mediumDate' }}</div>
                  </div>
                  <span class="badge">{{ notice.priority }}</span>
                </div>
                <p>{{ notice.content }}</p>
                <div class="actions-row">
                  <button class="btn sm ghost" type="button" (click)="editNotice(notice)">Edit</button>
                  <button class="btn sm ghost" type="button" (click)="deleteNotice(notice)">Delete</button>
                </div>
              </article>
            </div>

            <ng-template #noNotices>
              <div class="empty-state" style="padding:28px">No notices have been published for this block yet.</div>
            </ng-template>
          </article>

          <article class="card section-card">
            <div class="section-header">
              <div>
                <h2>{{ editingNoticeId() ? 'Edit notice' : 'Create notice' }}</h2>
                <p class="muted">Residents will see this in their notice feed.</p>
              </div>
            </div>

            <form [formGroup]="noticeForm" (ngSubmit)="saveNotice()" class="form-stack">
              <div class="field">
                <label>Title</label>
                <input formControlName="title" placeholder="Water maintenance update">
              </div>
              <div class="field">
                <label>Priority</label>
                <select formControlName="priority">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div class="field">
                <label>Notice content</label>
                <textarea formControlName="content" placeholder="Tell residents what changed, when, and what they need to do."></textarea>
              </div>
              <div class="field">
                <label>Expires at</label>
                <input formControlName="expiresAt" type="datetime-local">
              </div>
              <div class="actions-row">
                <button class="btn" type="submit" [disabled]="noticeForm.invalid || savingNotice()">
                  {{ savingNotice() ? 'Saving...' : editingNoticeId() ? 'Update notice' : 'Publish notice' }}
                </button>
                <button class="btn ghost" type="button" (click)="resetNoticeForm()">Clear</button>
              </div>
            </form>
          </article>
        </section>

        <section *ngIf="activeSection() === 'mess'" class="warden-section two-pane">
          <article class="card section-card">
            <div class="section-header">
              <div>
                <h2>Weekly mess menu</h2>
                <p class="muted">Tap a day to edit that menu.</p>
              </div>
            </div>

            <div class="menu-grid">
              <button
                class="menu-day"
                type="button"
                *ngFor="let day of menuDays"
                [class.active]="menuForm.get('day')?.value === day"
                (click)="selectMenuDay(day)">
                <div class="menu-day__title">{{ day }}</div>
                <div class="muted">{{ menuLabel(day) }}</div>
              </button>
            </div>
          </article>

          <article class="card section-card">
            <div class="section-header">
              <div>
                <h2>{{ editingMenuId() ? 'Update day menu' : 'Create day menu' }}</h2>
                <p class="muted">Use comma-separated items for each meal.</p>
              </div>
            </div>

            <form [formGroup]="menuForm" (ngSubmit)="saveMenu()" class="form-stack">
              <div class="field">
                <label>Day</label>
                <select formControlName="day">
                  <option *ngFor="let day of menuDays" [value]="day">{{ day }}</option>
                </select>
              </div>
              <div class="field">
                <label>Breakfast</label>
                <input formControlName="breakfast" placeholder="Idli, chutney, tea">
              </div>
              <div class="field">
                <label>Lunch</label>
                <input formControlName="lunch" placeholder="Rice, dal, sabzi, curd">
              </div>
              <div class="field">
                <label>Snacks</label>
                <input formControlName="snacks" placeholder="Samosa, lemonade">
              </div>
              <div class="field">
                <label>Dinner</label>
                <input formControlName="dinner" placeholder="Roti, paneer curry, salad">
              </div>
              <div class="actions-row">
                <button class="btn" type="submit" [disabled]="menuForm.invalid || savingMenu()">
                  {{ savingMenu() ? 'Saving...' : editingMenuId() ? 'Update menu' : 'Save menu' }}
                </button>
                <button class="btn ghost" type="button" (click)="resetMenuForm()">Clear</button>
              </div>
            </form>
          </article>
        </section>

        <section *ngIf="activeSection() === 'hostels'" class="warden-section two-pane">
          <article class="card section-card">
            <div class="section-header">
              <div>
                <h2>Managed hostels</h2>
                <p class="muted">Choose an existing block or create a new one.</p>
              </div>
              <button class="btn ghost btn sm" type="button" (click)="startCreatingBlock()">New hostel</button>
            </div>

            <div class="list" *ngIf="blocks().length; else noBlocks">
              <button
                class="managed-block"
                type="button"
                *ngFor="let block of blocks()"
                [class.active]="selectedBlockId() === block._id && !creatingBlock()"
                (click)="selectManagedBlock(block)">
                <div>
                  <strong>{{ block.blockName }}</strong>
                  <div class="muted">{{ block.location }} · {{ block.type }}</div>
                </div>
                <span class="badge secondary">{{ block.availableRooms }} free</span>
              </button>
            </div>

            <ng-template #noBlocks>
              <div class="empty-state" style="padding:28px">No managed hostel blocks yet. Create your first one below.</div>
            </ng-template>
          </article>

          <article class="card section-card">
            <div class="section-header">
              <div>
                <h2>{{ creatingBlock() ? 'Create hostel block' : 'Update hostel details' }}</h2>
                <p class="muted">Keep resident-facing information accurate and deployable.</p>
              </div>
            </div>

            <form [formGroup]="hostelForm" (ngSubmit)="saveHostel()" class="form-stack">
              <div class="filter-grid">
                <div class="field">
                  <label>Block name</label>
                  <input formControlName="blockName" placeholder="North Residency">
                </div>
                <div class="field">
                  <label>Type</label>
                  <select formControlName="type">
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Co-ed">Co-ed</option>
                  </select>
                </div>
              </div>

              <div class="field">
                <label>Description</label>
                <textarea formControlName="description" placeholder="Describe the block, vibe, and resident experience."></textarea>
              </div>

              <div class="filter-grid">
                <div class="field">
                  <label>Location</label>
                  <input formControlName="location" placeholder="North Campus">
                </div>
                <div class="field">
                  <label>Category</label>
                  <input formControlName="category" placeholder="Premium">
                </div>
              </div>

              <div class="filter-grid three-up">
                <div class="field">
                  <label>Total rooms</label>
                  <input formControlName="totalRooms" type="number" min="1">
                </div>
                <div class="field">
                  <label>Available rooms</label>
                  <input formControlName="availableRooms" type="number" min="0">
                </div>
                <div class="field">
                  <label>Occupied rooms</label>
                  <input formControlName="occupiedRooms" type="number" min="0">
                </div>
              </div>

              <div class="field">
                <label>Virtual tour URL</label>
                <input formControlName="virtualTourUrl" placeholder="https://example.com/tour">
              </div>

              <div class="field">
                <label>Image URLs</label>
                <textarea formControlName="imagesText" placeholder="One image URL per line or comma separated"></textarea>
              </div>

              <div class="field">
                <label>Facilities</label>
                <textarea formControlName="facilitiesText" placeholder="WiFi, Laundry, Gym, Mess"></textarea>
              </div>

              <div class="actions-row">
                <button class="btn" type="submit" [disabled]="hostelForm.invalid || savingHostel()">
                  {{ savingHostel() ? 'Saving...' : creatingBlock() ? 'Create hostel' : 'Update hostel' }}
                </button>
                <button class="btn ghost" type="button" (click)="resetHostelForm()">Reset</button>
              </div>
            </form>
          </article>
        </section>

        <p class="muted" *ngIf="message()" style="text-align:center;margin-top:8px">{{ message() }}</p>
      </ng-container>
    </div>

    <ng-template #notWarden>
      <div class="empty-state" style="margin-top:60px">
        <span class="icon">Access</span>
        <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 8px">Access Denied</h2>
        <p>Only wardens can access this panel. Log in as a warden to continue.</p>
        <a class="btn" routerLink="/auth/login" style="margin-top:20px">Sign in as warden</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .warden-hero {
      display: grid;
      gap: 22px;
    }

    .warden-hero__toolbar {
      display: grid;
      gap: 16px;
      align-items: end;
    }

    .warden-hero__selector {
      max-width: 320px;
      margin-bottom: 0;
    }

    .warden-section {
      display: grid;
      gap: 18px;
    }

    .two-pane {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .section-card {
      padding: 24px;
    }

    .tab-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .block-spotlight {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0;
    }

    .block-spotlight__media {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: linear-gradient(135deg, #dbe7ff, #eafaf8);
    }

    .block-spotlight__media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .block-spotlight__body {
      padding: 24px;
      display: grid;
      gap: 16px;
      align-content: start;
    }

    .overview-stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }

    .overview-stat {
      padding: 14px;
      border-radius: 16px;
      background: var(--surface-alt);
      border: 1px solid rgba(15, 23, 42, 0.05);
      display: grid;
      gap: 6px;
    }

    .overview-stat strong {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text);
    }

    .occupancy-row,
    .managed-block {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      padding: 14px 16px;
      border-radius: 16px;
      background: var(--surface-alt);
      border: 1px solid rgba(15, 23, 42, 0.06);
    }

    .managed-block {
      width: 100%;
      cursor: pointer;
      text-align: left;
      transition: border-color .2s, transform .2s, box-shadow .2s;
    }

    .managed-block.active,
    .managed-block:hover {
      border-color: rgba(139, 92, 246, 0.35);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .applications-list {
      display: grid;
      gap: 16px;
    }

    .app-card,
    .notice-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 18px;
      box-shadow: var(--shadow-sm);
    }

    .app-header {
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:12px;
      margin-bottom:12px;
    }

    .app-title {
      margin:0;
      font-size:1.05rem;
      font-weight:800;
      letter-spacing:-0.02em;
    }

    .app-meta {
      margin:4px 0 0;
      font-size:0.82rem;
      color:var(--muted);
    }

    .status-badge {
      display:inline-flex;
      align-items:center;
      padding:6px 12px;
      border-radius:var(--radius-full);
      font-size:0.75rem;
      font-weight:700;
      letter-spacing:0.05em;
      text-transform:uppercase;
      white-space:nowrap;
    }

    .status-badge.status-pending {
      background:var(--accent-light);
      color:#92400e;
    }

    .status-badge.status-accepted {
      background:var(--success-light);
      color:var(--success);
    }

    .status-badge.status-rejected {
      background:var(--danger-light);
      color:var(--danger);
    }

    .app-details {
      margin:12px 0;
      padding:12px;
      background:var(--surface-alt);
      border-radius:var(--radius-sm);
    }

    .detail-row {
      display:flex;
      justify-content:space-between;
      gap:12px;
      font-size:0.875rem;
      padding:6px 0;
    }

    .detail-row .label {
      font-weight:700;
      color:var(--muted);
      min-width:100px;
    }

    .detail-row .value {
      color:var(--text);
      text-align: right;
    }

    .review-form {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }

    .form-stack {
      display: grid;
      gap: 14px;
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .menu-day {
      border: 1px solid var(--border);
      background: white;
      border-radius: 18px;
      padding: 16px 14px;
      text-align: left;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: transform .2s, border-color .2s, box-shadow .2s;
    }

    .menu-day:hover,
    .menu-day.active {
      border-color: rgba(139, 92, 246, 0.35);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }

    .menu-day__title {
      font-size: 0.95rem;
      font-weight: 800;
      margin-bottom: 6px;
      color: var(--text);
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .filter-grid.three-up {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 1100px) {
      .two-pane {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .section-card {
        padding: 18px;
      }

      .tab-row,
      .warden-hero__toolbar {
        width: 100%;
      }

      .filter-grid,
      .filter-grid.three-up,
      .menu-grid {
        grid-template-columns: 1fr;
      }

      .block-spotlight__body {
        padding: 18px;
      }

      .app-header,
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .detail-row .value {
        text-align: left;
      }
    }
  `]
})
export class WardenPageComponent {
  private readonly authService = inject(AuthService);
  private readonly wardenService = inject(WardenService);
  private readonly fb = inject(FormBuilder);

  readonly fallbackImage = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80';
  readonly menuDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  readonly isWarden = ['Warden', 'Admin'].includes(this.authService.currentUser()?.role ?? '');

  readonly activeSection = signal<WardenSection>('overview');
  readonly applicationFilter = signal<'Pending' | 'Accepted' | 'Rejected' | 'All'>('Pending');
  readonly loadingDashboard = signal(true);
  readonly loadingNotices = signal(false);
  readonly loadingMenus = signal(false);
  readonly savingNotice = signal(false);
  readonly savingMenu = signal(false);
  readonly savingHostel = signal(false);
  readonly submittingReview = signal(false);
  readonly creatingBlock = signal(false);
  readonly activeApplicationId = signal<string | null>(null);
  readonly editingNoticeId = signal<string | null>(null);
  readonly editingMenuId = signal<string | null>(null);
  readonly reviewDecision = signal<'Accepted' | 'Rejected'>('Rejected');
  readonly message = signal('');

  readonly dashboard = signal<WardenDashboardResponse | null>(null);
  readonly blocks = computed(() => this.dashboard()?.blocks ?? []);
  readonly occupancy = computed(() => this.dashboard()?.occupancy ?? []);
  readonly stats = computed(() => this.dashboard()?.stats ?? {
    totalBlocks: 0,
    totalStudents: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    complaints: { pending: 0, assigned: 0, inProgress: 0, resolvedToday: 0 }
  });
  readonly applications = computed(() => this.dashboard()?.applications ?? []);
  readonly selectedBlockId = signal<string>('');
  readonly selectedBlock = computed<HostelBlockSummary | null>(() =>
    this.blocks().find((block) => block._id === this.selectedBlockId()) ?? null
  );

  readonly notices = signal<WardenNotice[]>([]);
  readonly weeklyMenus = signal<WardenMessMenu[]>([]);
  
  readonly complaints = signal<any[]>([]);
  readonly loadingComplaints = signal(false);
  readonly activeComplaintId = signal<string | null>(null);
  readonly complaintAction = signal<'assign' | 'resolve' | null>(null);
  readonly submittingComplaint = signal(false);

  readonly assignForm = this.fb.nonNullable.group({
    assignedTo: ['', Validators.required],
    eta: ['']
  });

  readonly resolveForm = this.fb.nonNullable.group({
    resolutionNotes: ['', Validators.required],
    resolutionPhotos: ['']
  });

  readonly reviewForm = this.fb.nonNullable.group({
    comments: ['']
  });

  readonly noticeForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    priority: ['Medium', Validators.required],
    content: ['', [Validators.required, Validators.minLength(10)]],
    expiresAt: ['']
  });

  readonly menuForm = this.fb.nonNullable.group({
    day: ['Monday', Validators.required],
    breakfast: ['', Validators.required],
    lunch: ['', Validators.required],
    snacks: ['', Validators.required],
    dinner: ['', Validators.required]
  });

  readonly hostelForm = this.fb.nonNullable.group({
    blockName: ['', Validators.required],
    type: ['Boys', Validators.required],
    description: ['', Validators.required],
    totalRooms: [100, [Validators.required, Validators.min(1)]],
    availableRooms: [20, [Validators.required, Validators.min(0)]],
    occupiedRooms: [80, [Validators.required, Validators.min(0)]],
    location: ['', Validators.required],
    category: ['Standard', Validators.required],
    virtualTourUrl: [''],
    imagesText: [''],
    facilitiesText: ['WiFi, Mess, Laundry']
  });

  readonly filteredApplications = computed(() => {
    const selectedBlockId = this.selectedBlockId();
    const filter = this.applicationFilter();
    return this.applications()
      .filter((application) => !selectedBlockId || application.hostelBlockId === selectedBlockId)
      .filter((application) => filter === 'All' || application.status === filter);
  });

  constructor() {
    if (this.isWarden) {
      this.loadDashboard();
    }
  }

  loadDashboard(): void {
    this.loadingDashboard.set(true);
    this.wardenService.getWardenDashboard().subscribe({
      next: (response) => {
        this.dashboard.set(response);
        const currentBlockId = this.selectedBlockId();
        const availableBlocks = response.blocks ?? [];
        const fallbackBlockId = availableBlocks[0]?._id ?? '';
        const nextBlockId = availableBlocks.some((block) => block._id === currentBlockId)
          ? currentBlockId
          : fallbackBlockId;

        this.selectedBlockId.set(nextBlockId);
        this.loadingDashboard.set(false);
        this.syncHostelForm();
        this.loadBlockWorkspace();
      },
      error: () => {
        this.dashboard.set(null);
        this.loadingDashboard.set(false);
        this.message.set('Failed to load the warden dashboard.');
      }
    });
  }

  onBlockChange(blockId: string): void {
    this.selectedBlockId.set(blockId);
    this.creatingBlock.set(false);
    this.syncHostelForm();
    this.loadBlockWorkspace();
  }

  selectManagedBlock(block: HostelBlockSummary): void {
    this.selectedBlockId.set(block._id);
    this.creatingBlock.set(false);
    this.activeSection.set('hostels');
    this.syncHostelForm();
    this.loadBlockWorkspace();
  }

  approveApplication(app: WardenApplication): void {
    this.reviewDecision.set('Accepted');
    this.activeApplicationId.set(app._id);
    this.reviewForm.reset();
    this.submitApplicationReview(app);
  }

  openApplicationReview(app: WardenApplication, decision: 'Accepted' | 'Rejected'): void {
    this.reviewDecision.set(decision);
    this.activeApplicationId.set(app._id);
    this.reviewForm.reset();
  }

  cancelApplicationReview(): void {
    this.activeApplicationId.set(null);
    this.reviewDecision.set('Rejected');
    this.reviewForm.reset();
  }

  submitApplicationReview(app: WardenApplication): void {
    this.submittingReview.set(true);
    this.wardenService.reviewApplication(app._id, this.reviewDecision(), this.reviewForm.getRawValue().comments).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.activeApplicationId.set(null);
        this.reviewForm.reset();
        this.message.set(`Application ${this.reviewDecision().toLowerCase()} successfully.`);
        this.loadDashboard();
      },
      error: (error) => {
        this.submittingReview.set(false);
        this.message.set(error.error?.error ?? 'Failed to review application.');
      }
    });
  }

  editNotice(notice: WardenNotice): void {
    this.editingNoticeId.set(notice._id);
    this.noticeForm.setValue({
      title: notice.title ?? '',
      priority: notice.priority ?? 'Medium',
      content: notice.content ?? '',
      expiresAt: this.toDateTimeLocal(notice.expiresAt)
    });
  }

  resetNoticeForm(): void {
    this.editingNoticeId.set(null);
    this.noticeForm.reset({
      title: '',
      priority: 'Medium',
      content: '',
      expiresAt: ''
    });
  }

  saveNotice(): void {
    const blockId = this.selectedBlockId();
    if (!blockId || this.noticeForm.invalid) {
      return;
    }

    this.savingNotice.set(true);
    const formValue = this.noticeForm.getRawValue();
    const payload: SaveNoticePayload = {
      hostelBlockId: blockId,
      title: formValue.title.trim(),
      priority: formValue.priority,
      content: formValue.content.trim(),
      expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt).toISOString() : null
    };

    const request$ = this.editingNoticeId()
      ? this.wardenService.updateNotice(this.editingNoticeId()!, payload)
      : this.wardenService.createNotice(payload);

    request$.subscribe({
      next: () => {
        this.savingNotice.set(false);
        this.resetNoticeForm();
        this.message.set(this.editingNoticeId() ? 'Notice updated successfully.' : 'Notice published successfully.');
        this.loadNotices();
      },
      error: (error) => {
        this.savingNotice.set(false);
        this.message.set(error.error?.error ?? 'Failed to save notice.');
      }
    });
  }

  deleteNotice(notice: WardenNotice): void {
    if (!globalThis.confirm(`Delete "${notice.title}"?`)) {
      return;
    }

    this.wardenService.deleteNotice(notice._id).subscribe({
      next: () => {
        this.message.set('Notice deleted successfully.');
        this.loadNotices();
        if (this.editingNoticeId() === notice._id) {
          this.resetNoticeForm();
        }
      },
      error: (error) => {
        this.message.set(error.error?.error ?? 'Failed to delete notice.');
      }
    });
  }

  selectMenuDay(day: string): void {
    const existing = this.weeklyMenus().find((menu) => menu.day === day);
    this.editingMenuId.set(existing?._id ?? null);
    this.menuForm.setValue({
      day,
      breakfast: existing?.breakfast ?? '',
      lunch: existing?.lunch ?? '',
      snacks: existing?.snacks ?? '',
      dinner: existing?.dinner ?? ''
    });
  }

  resetMenuForm(): void {
    this.editingMenuId.set(null);
    this.menuForm.reset({
      day: 'Monday',
      breakfast: '',
      lunch: '',
      snacks: '',
      dinner: ''
    });
  }

  saveMenu(): void {
    const blockId = this.selectedBlockId();
    if (!blockId || this.menuForm.invalid) {
      return;
    }

    this.savingMenu.set(true);
    const formValue = this.menuForm.getRawValue();
    const payload: SaveMessMenuPayload = {
      hostelBlockId: blockId,
      day: formValue.day,
      breakfast: formValue.breakfast.trim(),
      lunch: formValue.lunch.trim(),
      snacks: formValue.snacks.trim(),
      dinner: formValue.dinner.trim()
    };

    const request$ = this.editingMenuId()
      ? this.wardenService.updateMessMenu(this.editingMenuId()!, payload)
      : this.wardenService.createMessMenu(payload);

    request$.subscribe({
      next: () => {
        this.savingMenu.set(false);
        this.message.set(this.editingMenuId() ? 'Mess menu updated successfully.' : 'Mess menu created successfully.');
        const selectedDay = this.menuForm.getRawValue().day;
        this.loadMenus(() => this.selectMenuDay(selectedDay));
      },
      error: (error) => {
        this.savingMenu.set(false);
        this.message.set(error.error?.error ?? 'Failed to save mess menu.');
      }
    });
  }

  startCreatingBlock(): void {
    this.creatingBlock.set(true);
    this.activeSection.set('hostels');
    this.hostelForm.reset({
      blockName: '',
      type: 'Boys',
      description: '',
      totalRooms: 100,
      availableRooms: 20,
      occupiedRooms: 80,
      location: '',
      category: 'Standard',
      virtualTourUrl: '',
      imagesText: '',
      facilitiesText: 'WiFi, Mess, Laundry'
    });
  }

  resetHostelForm(): void {
    if (this.creatingBlock()) {
      this.startCreatingBlock();
      return;
    }
    this.syncHostelForm();
  }

  saveHostel(): void {
    if (this.hostelForm.invalid) {
      return;
    }

    this.savingHostel.set(true);
    const payload = this.toHostelPayload();
    const request$ = this.creatingBlock() || !this.selectedBlockId()
      ? this.wardenService.createHostel(payload)
      : this.wardenService.updateHostel(this.selectedBlockId(), payload);

    request$.subscribe({
      next: (response) => {
        this.savingHostel.set(false);
        this.message.set(this.creatingBlock() ? 'Hostel block created successfully.' : 'Hostel information updated successfully.');
        this.creatingBlock.set(false);
        const createdId = response?._id ?? response?.id ?? this.selectedBlockId();
        this.loadDashboard();
        if (createdId) {
          this.selectedBlockId.set(createdId);
        }
      },
      error: (error) => {
        this.savingHostel.set(false);
        this.message.set(error.error?.error ?? 'Failed to save hostel information.');
      }
    });
  }

  menuLabel(day: string): string {
    const menu = this.weeklyMenus().find((entry) => entry.day === day);
    return menu ? `${menu.breakfast || 'Breakfast set'} / ${menu.dinner || 'Dinner set'}` : 'No menu set yet';
  }

  primaryImage(block: HostelBlockSummary): string {
    return block.images?.[0]?.trim() || this.fallbackImage;
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src === this.fallbackImage) {
      return;
    }
    image.src = this.fallbackImage;
  }

  private loadBlockWorkspace(): void {
    this.resetNoticeForm();
    this.resetMenuForm();
    this.loadNotices();
    this.loadMenus();
    this.loadComplaints();
  }

  private loadComplaints(): void {
    const blockId = this.selectedBlockId();
    if (!blockId) {
      this.complaints.set([]);
      return;
    }

    this.loadingComplaints.set(true);
    this.wardenService.getComplaints(blockId).subscribe({
      next: (complaints) => {
        this.complaints.set(complaints);
        this.loadingComplaints.set(false);
      },
      error: () => {
        this.complaints.set([]);
        this.loadingComplaints.set(false);
      }
    });
  }

  openComplaintAction(complaint: any, action: 'assign' | 'resolve'): void {
    this.activeComplaintId.set(complaint._id);
    this.complaintAction.set(action);
    if (action === 'assign') {
      this.assignForm.reset({ assignedTo: complaint.assignedTo || '', eta: complaint.eta || '' });
    } else {
      this.resolveForm.reset({ resolutionNotes: '', resolutionPhotos: '' });
    }
  }

  cancelComplaintAction(): void {
    this.activeComplaintId.set(null);
    this.complaintAction.set(null);
  }

  submitAssignComplaint(complaint: any): void {
    if (this.assignForm.invalid) return;
    this.submittingComplaint.set(true);
    this.wardenService.assignComplaint(complaint._id, this.assignForm.getRawValue()).subscribe({
      next: () => {
        this.submittingComplaint.set(false);
        this.cancelComplaintAction();
        this.message.set('Complaint assigned successfully.');
        this.loadComplaints();
        this.loadDashboard();
      },
      error: (err) => {
        this.submittingComplaint.set(false);
        this.message.set(err.error?.error || 'Failed to assign complaint.');
      }
    });
  }

  submitResolveComplaint(complaint: any): void {
    if (this.resolveForm.invalid) return;
    this.submittingComplaint.set(true);
    const raw = this.resolveForm.getRawValue();
    const payload = {
      resolutionNotes: raw.resolutionNotes,
      resolutionPhotos: raw.resolutionPhotos ? this.parseDelimitedList(raw.resolutionPhotos) : []
    };
    this.wardenService.resolveComplaint(complaint._id, payload).subscribe({
      next: () => {
        this.submittingComplaint.set(false);
        this.cancelComplaintAction();
        this.message.set('Complaint resolved successfully.');
        this.loadComplaints();
        this.loadDashboard();
      },
      error: (err) => {
        this.submittingComplaint.set(false);
        this.message.set(err.error?.error || 'Failed to resolve complaint.');
      }
    });
  }

  private loadNotices(): void {
    const blockId = this.selectedBlockId();
    if (!blockId) {
      this.notices.set([]);
      return;
    }

    this.loadingNotices.set(true);
    this.wardenService.getNotices(blockId).subscribe({
      next: (notices) => {
        this.notices.set(notices);
        this.loadingNotices.set(false);
      },
      error: () => {
        this.notices.set([]);
        this.loadingNotices.set(false);
      }
    });
  }

  private loadMenus(afterLoad?: () => void): void {
    const blockId = this.selectedBlockId();
    if (!blockId) {
      this.weeklyMenus.set([]);
      return;
    }

    this.loadingMenus.set(true);
    this.wardenService.getWeeklyMessMenu(blockId).subscribe({
      next: (response) => {
        this.weeklyMenus.set(response.menus ?? []);
        this.loadingMenus.set(false);
        afterLoad?.();
      },
      error: () => {
        this.weeklyMenus.set([]);
        this.loadingMenus.set(false);
      }
    });
  }

  private syncHostelForm(): void {
    const block = this.selectedBlock();
    if (!block) {
      this.startCreatingBlock();
      return;
    }

    this.hostelForm.reset({
      blockName: block.blockName ?? '',
      type: block.type ?? 'Boys',
      description: block.description ?? '',
      totalRooms: block.totalRooms ?? 0,
      availableRooms: block.availableRooms ?? 0,
      occupiedRooms: block.occupiedRooms ?? 0,
      location: block.location ?? '',
      category: block.category ?? 'Standard',
      virtualTourUrl: block.virtualTourUrl ?? '',
      imagesText: (block.images ?? []).join('\n'),
      facilitiesText: (block.facilities ?? []).join(', ')
    });
  }

  private toHostelPayload(): SaveHostelPayload {
    const raw = this.hostelForm.getRawValue();
    return {
      blockName: raw.blockName.trim(),
      type: raw.type,
      description: raw.description.trim(),
      totalRooms: Number(raw.totalRooms),
      availableRooms: Number(raw.availableRooms),
      occupiedRooms: Number(raw.occupiedRooms),
      location: raw.location.trim(),
      category: raw.category.trim(),
      virtualTourUrl: raw.virtualTourUrl.trim() || null,
      images: this.parseDelimitedList(raw.imagesText),
      facilities: this.parseDelimitedList(raw.facilitiesText)
    };
  }

  private parseDelimitedList(value: string): string[] {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private toDateTimeLocal(value?: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
