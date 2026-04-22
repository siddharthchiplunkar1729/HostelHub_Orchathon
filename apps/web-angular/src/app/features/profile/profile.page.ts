import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, AuthStudent, AuthUser } from '../../core/services/auth.service';
import { StudentDetail, StudentService } from '../../core/services/student.service';
import { WardenService } from '../../core/services/warden.service';
import { HostelBlockSummary } from '../../core/services/hostel.service';
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page" *ngIf="user; else guestState">
      <!-- Hero -->
      <section class="hero-card">
        <div class="eyebrow">{{ user.role }} account</div>
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;position:relative;z-index:1">
          <div class="profile-avatar">{{ initials }}</div>
          <div>
            <h1 style="margin:0 0 6px;font-size:2rem">{{ user.name }}</h1>
            <p style="margin:0;color:rgba(255,255,255,0.75)">{{ user.email }}</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:0.875rem">{{ user.phone || 'Phone not available' }}</p>
          </div>
        </div>
        <div class="actions-row" style="margin-top:24px">
          <a class="btn ghost" routerLink="/">Back home</a>
          <a class="btn ghost" *ngIf="user.role === 'Student'" routerLink="/dashboard">Dashboard</a>
          <a class="btn ghost" *ngIf="user.role === 'Warden'" routerLink="/warden">Warden Panel</a>
        </div>
      </section>

      <!-- Info cards -->
      <section class="grid two">
        <article class="card">
          <h2 style="margin-bottom:16px">Account Status</h2>
          <div class="list">
            <div class="info-row">
              <span class="muted">Role</span>
              <span class="badge">{{ user.role }}</span>
            </div>
            <div class="info-row">
              <span class="muted">Dashboard access</span>
              <span class="badge" [class.success]="user.canAccessDashboard" [class.warn]="!user.canAccessDashboard">
                {{ user.canAccessDashboard ? 'Enabled' : 'Pending approval' }}
              </span>
            </div>
            <div class="info-row" *ngIf="student">
              <span class="muted">Roll number</span>
              <strong>{{ student.rollNumber }}</strong>
            </div>
            <div class="info-row" *ngIf="student">
              <span class="muted">Course</span>
              <strong>{{ student.course }} – Year {{ student.year }}</strong>
            </div>
          </div>
        </article>

        <article class="card">
          <h2 style="margin-bottom:16px">Student Details</h2>
          <div class="list" *ngIf="studentDetail; else noStudentProfile">
            <div class="info-row">
              <span class="muted">Department</span>
              <strong>{{ studentDetail.department }}</strong>
            </div>
            <div class="info-row">
              <span class="muted">Enrollment</span>
              <span class="status-pill" [class.pending]="studentDetail.enrollmentStatus !== 'Enrolled'">
                {{ studentDetail.enrollmentStatus }}
              </span>
            </div>
            <div class="info-row">
              <span class="muted">Hostel</span>
              <strong>{{ studentDetail.hostelInfo?.name || 'Not assigned' }}</strong>
            </div>
            <div class="info-row">
              <span class="muted">Room</span>
              <strong>{{ studentDetail.roomNumber || 'Pending' }}</strong>
            </div>
          </div>
          <ng-template #noStudentProfile>
            <div class="empty-state" style="padding:24px">
              {{ user.role === 'Student' ? 'Student profile still loading.' : 'Not linked to a student profile.' }}
            </div>
          </ng-template>
        </article>
      </section>

      <!-- Warden Managed Blocks -->
      <section class="card" *ngIf="user.role === 'Warden' || user.role === 'Admin'" style="margin-top: 24px;">
        <h2 style="margin-bottom:16px">Managed Hostel Blocks</h2>
        <div class="cards-grid" *ngIf="managedBlocks.length; else noBlocks">
          <article class="stat-card" *ngFor="let block of managedBlocks">
            <strong>{{ block.blockName }}</strong>
            <div class="muted">{{ block.location }} • {{ block.type }}</div>
            <div style="margin-top: 8px;">
              <span class="badge" style="margin-right: 8px;">{{ block.availableRooms }} available</span>
              <span class="badge secondary">{{ block.totalRooms }} total rooms</span>
            </div>
          </article>
        </div>
        <ng-template #noBlocks>
          <div class="empty-state" style="padding: 24px;">
            No blocks managed currently.
          </div>
        </ng-template>
      </section>

      <p class="muted" *ngIf="message" style="text-align:center">{{ message }}</p>
    </div>

    <ng-template #guestState>
      <div class="empty-state" style="margin-top:60px">
        <span class="icon">👤</span>
        <h2 style="font-size:1.1rem;font-weight:800;margin:0 0 8px">Not logged in</h2>
        <p>Please log in to view your profile.</p>
        <a class="btn" routerLink="/auth/login" style="margin-top:20px">Sign in →</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .profile-avatar {
      width:80px;height:80px;border-radius:50%;
      background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.35);
      display:flex;align-items:center;justify-content:center;
      font-size:2rem;font-weight:900;color:white;flex-shrink:0;
    }
    .info-row {
      display:flex;justify-content:space-between;align-items:center;gap:12px;
      padding:10px 0;border-bottom:1px solid var(--border);
    }
    .info-row:last-child { border-bottom:none;padding-bottom:0; }
    .info-row .muted { font-size:0.875rem; }
    .info-row strong { font-weight:700;font-size:0.9rem; }
  `]
})
export class ProfilePageComponent {
  private readonly authService = inject(AuthService);
  private readonly studentService = inject(StudentService);
  private readonly wardenService = inject(WardenService);

  user: AuthUser | null = this.authService.currentUser();
  student: AuthStudent | null = this.authService.currentStudent();
  studentDetail: StudentDetail | null = null;
  managedBlocks: HostelBlockSummary[] = [];
  message = '';

  get initials() {
    return this.user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  }

  constructor() {
    if (this.student?.id) {
      this.studentService.getStudentById(this.student.id).subscribe({
        next: (d)  => { this.studentDetail = d; },
        error: ()  => { this.message = 'Detailed student info could not be loaded.'; }
      });
    }

    if (this.user?.role === 'Warden' || this.user?.role === 'Admin') {
      this.wardenService.getManagedBlocks().subscribe({
        next: (blocks) => { this.managedBlocks = blocks; },
        error: () => {}
      });
    }
  }
}
