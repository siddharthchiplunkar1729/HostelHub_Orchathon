import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OperationsService } from '../../core/services/operations.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <section class="hero-card" style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); border-radius: var(--radius-2xl); color: white; padding: 48px; position:relative; overflow:hidden">
        <div style="position:absolute; top:-20px; right:-20px; font-size:10rem; opacity:0.1; pointer-events:none">📋</div>
        <div class="eyebrow" style="color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2)">RESIDENT SUPPORT</div>
        <h1 style="color: white; font-size: 2.5rem; letter-spacing: -0.04em">Support Center</h1>
        <p style="color: rgba(255,255,255,0.9); max-width: 500px; margin-bottom: 24px">Raise and track maintenance tickets for your hostel block. Our team usually responds within 24 hours.</p>
        <div class="actions-row" *ngIf="isStudent">
          <button class="btn" (click)="showForm = !showForm" style="background: white; color: var(--primary); font-weight: 800">
            {{ showForm ? 'Cancel Request' : 'Raise New Ticket' }}
          </button>
        </div>
      </section>

      <!-- Raise Complaint Form -->
      <section class="card" *ngIf="showForm" style="margin-bottom:24px; animation: slideDown 0.3s ease-out">
        <h2 style="margin-top:0; font-size:1.2rem">New Support Ticket</h2>
        <form [formGroup]="complaintForm" (ngSubmit)="submitComplaint()" style="display:grid; gap:16px">
          <div class="form-group">
            <label>Issue Title</label>
            <input type="text" formControlName="title" placeholder="e.g. Broken Fan, Slow Internet">
          </div>
          <div class="form-group">
            <label>Category</label>
            <select formControlName="category">
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Internet">Internet</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea formControlName="description" placeholder="Describe the issue in detail..." style="min-height:100px"></textarea>
          </div>
          <div style="display:flex; gap:12px">
            <button class="btn" type="submit" [disabled]="complaintForm.invalid || submitting">
              {{ submitting ? 'Submitting...' : 'Submit Ticket' }}
            </button>
            <button class="btn ghost" type="button" (click)="showForm = false">Cancel</button>
          </div>
        </form>
        <p *ngIf="message" style="margin-top:12px; color:var(--accent); font-weight:600">{{ message }}</p>
      </section>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading complaints…</p>
      </div>

      <!-- List -->
      <section class="list" *ngIf="!loading && complaints.length">
        <article class="card complaint-card" *ngFor="let c of complaints">
          <div class="section-header">
            <div>
              <h2 style="font-size:1rem">{{ c.title || 'Complaint record' }}</h2>
              <p class="muted" style="margin:0">{{ c.createdAt | date:'mediumDate' }}</p>
            </div>
            <span class="status-pill"
              [class.pending]="c.status !== 'Resolved' && c.status !== 'Rejected'"
              [class.rejected]="c.status === 'Rejected'">
              {{ c.status || 'Open' }}
            </span>
          </div>
          <p style="margin:12px 0 0;font-size:0.9rem;line-height:1.55">
            {{ c.description || c.category || 'No additional details provided.' }}
          </p>
          <div *ngIf="c.category" style="margin-top:10px">
            <span class="badge">{{ c.category }}</span>
          </div>
        </article>
      </section>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && !complaints.length">
        <span class="icon">🎉</span>
        <h2 style="font-size:1.1rem;font-weight:800;margin:0 0 8px">No complaints!</h2>
        <p>All clear. Log in as a student to view your tickets.</p>
      </div>
    </div>
  `,
  styles: [`
    .complaint-card { transition:box-shadow .25s,transform .25s; }
    .complaint-card:hover { box-shadow:var(--shadow);transform:translateY(-2px); }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ComplaintsPageComponent {
  private readonly operationsService = inject(OperationsService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  isStudent = this.authService.currentUser()?.role === 'Student';
  complaints: any[] = [];
  loading = true;
  showForm = false;
  submitting = false;
  message = '';

  complaintForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    category: ['Electrical', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  constructor() {
    this.loadComplaints();
  }

  loadComplaints(): void {
    this.loading = true;
    this.operationsService.getComplaints().subscribe({
      next: (data) => { this.complaints = data; this.loading = false; },
      error: ()    => { this.complaints = [];  this.loading = false; }
    });
  }

  submitComplaint(): void {
    if (this.complaintForm.invalid) return;

    this.submitting = true;
    this.message = '';
    const val = this.complaintForm.value as any;

    this.operationsService.createComplaint(val).subscribe({
      next: (res) => {
        this.message = 'Complaint raised successfully!';
        this.submitting = false;
        this.showForm = false;
        this.complaintForm.reset({ category: 'Electrical' });
        this.loadComplaints();
      },
      error: (err) => {
        this.message = err.error?.error || 'Failed to submit complaint.';
        this.submitting = false;
      }
    });
  }
}
