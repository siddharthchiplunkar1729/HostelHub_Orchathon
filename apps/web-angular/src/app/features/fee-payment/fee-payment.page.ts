import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <section class="hero-card" style="background: linear-gradient(135deg, #047857 0%, #10b981 100%); color: white; border-radius: var(--radius-2xl); padding: 48px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -30px; right: -20px; font-size: 12rem; opacity: 0.08; pointer-events: none;">💳</div>
        <div class="eyebrow" style="color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);">SECURE CHECKOUT</div>
        <h1 style="color: white; font-size: 2.5rem; letter-spacing: -0.04em; margin: 0 0 10px;">Hostel Fee Payment</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 0 0 24px; max-width: 480px;">
          Complete your hostel fee payment securely to confirm your accommodation and unlock dashboard access.
        </p>
        <div class="actions-row">
          <a class="btn ghost" routerLink="/dashboard" style="background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); color: white;">Back to Dashboard</a>
        </div>
      </section>

      <section class="card" *ngIf="studentId; else missingStudent" style="max-width: 600px; margin: 24px auto;">
        
        <ng-container *ngIf="!paid">
          <div class="section-header" style="border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px;">
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 4px;">Payment Summary</h2>
              <p class="muted" style="margin: 0; font-size: 0.9rem;">Review your fee details before paying.</p>
            </div>
          </div>
          
          <div style="background: var(--surface-alt); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem;">
              <span class="muted">Student Profile</span>
              <span style="font-weight: 600;">{{ user?.name }} ({{ studentProfile?.rollNumber }})</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem;">
              <span class="muted">Term</span>
              <span style="font-weight: 600;">Current Academic Year</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem;">
              <span class="muted">Accommodation Fee</span>
              <span style="font-weight: 600;">$1,200.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem;">
              <span class="muted">Mess Advance</span>
              <span style="font-weight: 600;">$600.00</span>
            </div>
            <div style="height: 1px; background: var(--border); margin: 16px 0;"></div>
            <div style="display: flex; justify-content: space-between; font-size: 1.2rem;">
              <span style="font-weight: 700;">Total Amount</span>
              <span style="font-weight: 900; color: var(--primary);">$1,800.00</span>
            </div>
          </div>

          <div class="actions-row" style="flex-direction: column; gap: 12px;">
            <button class="btn" type="button" (click)="pay()" [disabled]="processing" style="width: 100%; padding: 14px; font-size: 1.05rem;">
              <span *ngIf="processing" style="display: inline-block; animation: pulse 1.5s infinite;">Processing Securely...</span>
              <span *ngIf="!processing">💳 Pay $1,800.00 Now</span>
            </button>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--muted); font-size: 0.8rem; margin-top: 8px;">
              <span style="font-size: 1rem;">🔒</span> Secure 256-bit SSL Encryption
            </div>
          </div>
          
          <div *ngIf="message" style="margin-top: 16px; padding: 12px; background: var(--danger-light); color: var(--danger); border-radius: var(--radius-sm); font-size: 0.9rem; text-align: center; font-weight: 600;">
            {{ message }}
          </div>
        </ng-container>

        <ng-container *ngIf="paid">
          <div style="text-align: center; padding: 24px 12px;">
            <div style="font-size: 4rem; margin-bottom: 16px;">✅</div>
            <h2 style="font-size: 1.8rem; font-weight: 900; margin: 0 0 8px; color: var(--success);">Payment Successful!</h2>
            <p style="color: var(--muted); margin: 0 0 24px;">Your hostel fees have been processed successfully.</p>
            
            <div style="background: var(--surface-alt); border-radius: var(--radius-lg); padding: 20px; text-align: left; margin-bottom: 24px;">
              <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; letter-spacing: 0.05em;">Transaction Receipt</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <div class="muted" style="font-size: 0.8rem;">Amount Paid</div>
                  <div style="font-weight: 700; font-size: 1.1rem;">$1,800.00</div>
                </div>
                <div>
                  <div class="muted" style="font-size: 0.8rem;">Date</div>
                  <div style="font-weight: 600;">{{ transactionDate | date:'medium' }}</div>
                </div>
                <div>
                  <div class="muted" style="font-size: 0.8rem;">Transaction ID</div>
                  <div style="font-family: monospace; font-weight: 600; font-size: 0.9rem;">{{ transactionId }}</div>
                </div>
                <div>
                  <div class="muted" style="font-size: 0.8rem;">Status</div>
                  <div style="font-weight: 700; color: var(--success);">Completed</div>
                </div>
              </div>
            </div>

            <div class="actions-row" style="justify-content: center;">
              <a class="btn" routerLink="/dashboard">Go to Dashboard</a>
              <button class="btn ghost" type="button" onclick="window.print()">Print Receipt</button>
            </div>
          </div>
        </ng-container>

      </section>

      <ng-template #missingStudent>
        <div class="empty-state">
          <span class="icon">👤</span>
          <h2>Student Profile Required</h2>
          <p>Log in with a student account to process fee payments.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `]
})
export class FeePaymentPageComponent {
  private readonly authService = inject(AuthService);
  private readonly studentService = inject(StudentService);

  readonly user = this.authService.currentUser();
  readonly studentProfile = this.authService.currentStudent();
  readonly studentId = this.studentProfile?.id ?? '';
  
  processing = false;
  paid = false;
  message = '';
  transactionId = '';
  transactionDate = new Date();

  pay(): void {
    if (!this.studentId) {
      this.message = 'A student profile is required before fees can be processed.';
      return;
    }

    this.processing = true;
    this.message = '';
    
    // Simulate payment processing delay for premium feel
    setTimeout(() => {
      this.studentService.payFees(this.studentId).subscribe({
        next: (response) => {
          this.message = response.message;
          this.paid = true;
          this.processing = false;
          this.transactionId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          this.transactionDate = new Date();
        },
        error: (error) => {
          this.message = error.error?.error ?? 'Payment failed. Please try again.';
          this.processing = false;
        }
      });
    }, 1500);
  }
}
