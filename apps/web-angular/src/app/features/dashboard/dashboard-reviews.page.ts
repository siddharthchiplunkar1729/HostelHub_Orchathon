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
        <div class="eyebrow">Reviews and feedback</div>
        <h1>Track your applications before adding reviews.</h1>
        <p>
          Manage and review the hostel blocks you are admitted to.
        </p>
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <h2>Recent applications</h2>
            <p class="muted">Accepted or active applications are the most likely review candidates later on.</p>
          </div>
        </div>
        <div class="list" *ngIf="applications.length; else empty">
          <article class="stat-card" *ngFor="let application of applications">
            <strong>{{ application.hostelBlockId.blockName }}</strong>
            <div class="muted">{{ application.hostelBlockId.location }} · {{ application.hostelBlockId.type }}</div>
            <div class="actions-row">
              <span class="status-pill" [class.pending]="application.status !== 'Accepted'">{{ application.status }}</span>
              <a class="btn ghost" [routerLink]="['/hostels', application.hostelBlockId._id]">Open hostel</a>
            </div>
          </article>
        </div>
        <ng-template #empty>
          <div class="empty-state">No hostel applications are available yet.</div>
        </ng-template>
      </section>
    </div>
  `
})
export class DashboardReviewsPageComponent {
  private readonly applicationsService = inject(ApplicationsService);

  applications: ApplicationSummary[] = [];

  constructor() {
    this.applicationsService.getMyApplications().subscribe({
      next: (data) => {
        this.applications = data;
      },
      error: () => {
        this.applications = [];
      }
    });
  }
}
