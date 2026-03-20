import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <section class="hero-card">
        <div class="eyebrow">Fee payment</div>
        <h1>Complete the payment step that unlocks dashboard access.</h1>
        <p class="muted">
          Complete your fee-payment process securely below.
        </p>
      </section>

      <section class="card" *ngIf="studentId; else missingStudent">
        <div class="section-header">
          <div>
            <h2>Resident payment</h2>
            <p class="muted">Student profile: {{ studentId }}</p>
          </div>
        </div>
        <div class="actions-row">
          <button class="btn" type="button" (click)="pay()" [disabled]="processing || paid">
            {{ processing ? 'Processing...' : paid ? 'Paid' : 'Pay hostel fees' }}
          </button>
          <a class="btn ghost" routerLink="/dashboard">Back to dashboard</a>
        </div>
        <p class="muted" *ngIf="message">{{ message }}</p>
      </section>

      <ng-template #missingStudent>
        <div class="empty-state">
          Log in with a student account to use the fee-payment action.
        </div>
      </ng-template>
    </div>
  `
})
export class FeePaymentPageComponent {
  private readonly authService = inject(AuthService);
  private readonly studentService = inject(StudentService);

  readonly studentId = this.authService.currentStudent()?.id ?? '';
  processing = false;
  paid = false;
  message = '';

  pay(): void {
    if (!this.studentId) {
      this.message = 'A student profile is required before fees can be processed.';
      return;
    }

    this.processing = true;
    this.studentService.payFees(this.studentId).subscribe({
      next: (response) => {
        this.message = response.message;
        this.paid = true;
        this.processing = false;
      },
      error: (error) => {
        this.message = error.error?.error ?? 'Payment failed.';
        this.processing = false;
      }
    });
  }
}
