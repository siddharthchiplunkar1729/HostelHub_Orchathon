import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
          <h2 style="font-size:2rem;font-weight:900;letter-spacing:-0.04em;margin:0 0 12px">Recover Access</h2>
          <p style="color:rgba(255,255,255,0.75);font-size:1rem;font-weight:500;line-height:1.6;margin:0 0 36px">
            We'll send you a link to reset your password and regain access to your account.
          </p>
          <div style="display:flex;flex-direction:column;gap:12px;font-size:0.875rem;color:rgba(255,255,255,0.65)">
            <div>🔐 Secure reset process</div>
            <div>⚡ Quick and easy</div>
            <div>✓ Verified email only</div>
          </div>
        </div>

        <!-- Right panel (form) -->
        <div class="auth-panel auth-panel--right">
          <h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-0.03em;margin:0 0 8px">Forgot Password</h1>
          <p class="muted" style="margin:0 0 28px">Enter your email and we'll send you a password reset link.</p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>Email address</label>
              <input formControlName="email" type="email" placeholder="student@university.edu">
            </div>

            <button class="btn" type="submit" style="width:100%;padding:14px;margin-bottom:16px">Send Reset Link</button>

            <div style="text-align:center">
              <a routerLink="/auth/login" style="color:var(--primary);font-size:0.875rem;font-weight:600">Back to login</a>
            </div>
          </form>

          <div *ngIf="message" class="auth-message" [class.auth-message--error]="isError">{{ message }}</div>
          <div *ngIf="showDevUrl && devResetUrl" class="auth-message" style="background:var(--accent-light);color:#92400e;margin-top:16px">
            <strong>Dev Reset URL:</strong><br>
            <a [href]="devResetUrl" target="_blank" style="word-break:break-all;color:inherit">{{ devResetUrl }}</a>
          </div>
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
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  message = '';
  isError = false;
  devResetUrl: string | null = null;
  showDevUrl = false;

  submit(): void {
    if (this.form.invalid) {
      this.message = 'Please enter a valid email address.';
      this.isError = true;
      return;
    }

    this.authService.forgotPassword(this.form.getRawValue().email).subscribe({
      next: (response) => {
        this.message = response.message;
        this.isError = false;
        if (response.devResetUrl) {
          this.devResetUrl = response.devResetUrl;
          this.showDevUrl = true;
        }
      },
      error: (error) => {
        this.message = error.error?.error ?? 'Failed to send reset link. Please try again.';
        this.isError = true;
      }
    });
  }
}
