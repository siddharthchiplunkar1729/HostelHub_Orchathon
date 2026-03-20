import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Left panel -->
        <div class="auth-panel auth-panel--left">
          <div class="brand-mark" style="width:52px;height:52px;font-size:1.3rem;border-radius:16px;margin-bottom:28px">HH</div>
          <h2 style="font-size:2rem;font-weight:900;letter-spacing:-0.04em;margin:0 0 12px">Set New Password</h2>
          <p style="color:rgba(255,255,255,0.75);font-size:1rem;font-weight:500;line-height:1.6;margin:0 0 36px">
            Choose a strong password to protect your account and regain full access.
          </p>
          <div style="display:flex;flex-direction:column;gap:12px;font-size:0.875rem;color:rgba(255,255,255,0.65)">
            <div>🔒 Strong password required</div>
            <div>⚡ Instant access after reset</div>
            <div>✓ Keep it safe and secure</div>
          </div>
        </div>

        <!-- Right panel (form) -->
        <div class="auth-panel auth-panel--right">
          <h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-0.03em;margin:0 0 8px">Reset Password</h1>
          <p class="muted" style="margin:0 0 28px">Enter your new password below to regain access to your account.</p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>New Password</label>
              <input formControlName="password" type="password" placeholder="Min. 8 characters">
            </div>
            <div class="field">
              <label>Confirm Password</label>
              <input formControlName="confirmPassword" type="password" placeholder="Confirm your password">
            </div>

            <button class="btn" type="submit" style="width:100%;padding:14px;margin-bottom:16px" [disabled]="loading">
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>

            <div style="text-align:center">
              <a routerLink="/auth/login" style="color:var(--primary);font-size:0.875rem;font-weight:600">Back to login</a>
            </div>
          </form>

          <div *ngIf="message" class="auth-message" [class.auth-message--error]="isError">{{ message }}</div>
          <div *ngIf="isSuccess" class="auth-message">Password reset successful! You will be redirected to login shortly.</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display:flex;align-items:center;justify-content:center;min-height:70vh;padding:16px; }
    .auth-card {
      display:grid;grid-template-columns:1fr 1fr;max-width:900px;width:100%;
      border-radius:var(--radius-2xl);overflow:hidden;box-shadow:var(--shadow-xl);
    }
    .auth-panel { padding:44px 40px; }
    .auth-panel--left {
      background:linear-gradient(135deg,#0c1f6e 0%,#1d4ed8 55%,#0c856f 100%);
      color:white;display:flex;flex-direction:column;
    }
    .auth-panel--right { background:white;display:flex;flex-direction:column;justify-content:center; }
    .auth-message {
      margin-top:16px;padding:12px 16px;border-radius:var(--radius-sm);
      font-size:0.875rem;font-weight:600;background:var(--success-light);color:var(--success);
    }
    .auth-message--error { background:var(--danger-light);color:var(--danger); }
    @media(max-width:640px){
      .auth-card { grid-template-columns:1fr; }
      .auth-panel--left { display:none; }
    }
  `]
})
export class ResetPasswordPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  message = '';
  isError = false;
  isSuccess = false;
  loading = false;

  private passwordMatchValidator(group: any) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  submit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.message = 'Invalid reset link. Please request a new one.';
      this.isError = true;
      return;
    }

    if (this.form.invalid) {
      this.message = 'Please complete all fields and ensure passwords match.';
      this.isError = true;
      return;
    }

    this.loading = true;
    this.authService.resetPassword({
      token,
      password: this.form.getRawValue().password
    }).subscribe({
      next: (response) => {
        this.message = response.message;
        this.isSuccess = true;
        this.isError = false;
        this.loading = false;
        setTimeout(() => {
          this.router.navigateByUrl('/auth/login');
        }, 2000);
      },
      error: (error) => {
        this.message = error.error?.error ?? 'Failed to reset password. Please try again.';
        this.isError = true;
        this.loading = false;
      }
    });
  }
}
