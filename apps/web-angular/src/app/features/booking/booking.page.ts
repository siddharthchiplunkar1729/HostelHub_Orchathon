import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApplicationsService } from '../../core/services/applications.service';
import { AuthService } from '../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <section class="hero-card">
        <div class="eyebrow">Booking flow</div>
        <h1>Submit Application</h1>
        <p>
          Apply to the hostel. Once your application is approved by the warden, you must visit the hostel physically within 12 hours to complete fee payment.
        </p>
      </section>

      <section class="grid two" *ngIf="!confirmed && hostelId; else successState">
        <article class="card">
          <h2>Guest details</h2>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>Full name</label>
              <input formControlName="name" placeholder="Riya Sharma">
            </div>
            <div class="grid two">
              <div class="field">
                <label>Email</label>
                <input formControlName="email" type="email" placeholder="riya@example.com">
              </div>
              <div class="field">
                <label>Phone</label>
                <input formControlName="phone" placeholder="9876543210">
              </div>
            </div>
            
            <div *ngIf="error" class="badge danger" style="margin-bottom: 16px; width: 100%; display: block; text-align: center;">
              {{ error }}
            </div>

            <button class="btn" type="submit" [disabled]="loading" style="width: 100%; justify-content: center;">
              {{ loading ? 'Processing...' : 'Submit Application' }}
            </button>
          </form>
        </article>

        <article class="card">
          <h2>Booking summary</h2>
          <div class="list">
            <div><strong>Hostel:</strong> {{ blockName || 'Selected Hostel' }}</div>
            <div><strong>Stay:</strong> Academic Session 2026</div>
            <div class="status-pill pending">Pending Approval</div>
            <div class="muted" style="margin-top: 12px;">
              <strong>Note:</strong> Your application will be reviewed. If approved, fee payment is strictly in-person.
            </div>
          </div>
        </article>
      </section>

      <ng-template #successState>
        <div *ngIf="!hostelId" class="empty-state">
           No hostel selected for booking. 
           <a class="btn" routerLink="/search" style="margin-top: 16px;">Browse Hostels</a>
        </div>
        <section *ngIf="hostelId && confirmed" class="card glass shadow-lg" style="text-align: center; border-color: var(--success);">
          <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
          <h2 style="color: var(--success); margin-bottom: 16px;">Application Submitted!</h2>
          
          <div class="badge success" style="font-size: 1.1rem; padding: 16px 24px; margin-bottom: 24px; display: block; width: fit-content; margin-left: auto; margin-right: auto;">
            If approved, you must visit the hostel physically within 12 hours to complete the fee payment.
          </div>
          
          <p class="muted" style="max-width: 500px; margin: 0 auto 24px;">
            Your application is now under review. You can track your status in the Applications page.
          </p>
          
          <div class="actions-row" style="justify-content: center;">
            <a class="btn" routerLink="/">Back home</a>
            <a class="btn ghost" routerLink="/applications">Track Application</a>
          </div>
        </section>
      </ng-template>
    </div>
  `
})
export class BookingPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly appsService = inject(ApplicationsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  confirmed = false;
  loading = false;
  error = '';
  hostelId: string | null = null;
  blockName: string | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    preferredRoomType: ['Single Share', Validators.required]
  });

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      this.hostelId = params['hostelId'] || null;
      this.blockName = params['blockName'] || null;
      
      const user = this.authService.currentUser();
      if (user) {
        this.form.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/booking' } });
      return;
    }

    this.loading = true;
    this.error = '';

    if (!this.hostelId) {
      this.error = 'No hostel selected.';
      this.loading = false;
      return;
    }

    const applicationData = {
      ...this.form.value,
      moveInDate: new Date().toISOString()
    };

    this.appsService.apply(this.hostelId, applicationData).subscribe({
      next: () => {
        this.confirmed = true;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.error?.error || 'Failed to submit booking. Please try again.';
        this.loading = false;
      }
    });
  }
}
