import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page animate-fade-in-up">
      <div class="auth-card">
        <!-- Left panel: Visual Splash -->
        <div class="auth-panel auth-panel--left">
          <div class="overlay"></div>
          <div class="auth-content">
            <div class="brand-mark glass-heavy" style="width:48px;height:48px;font-size:1.2rem;border-radius:14px;margin-bottom:auto;">HH</div>
            <div>
              <h2 style="font-size:2.5rem;font-weight:900;letter-spacing:-0.05em;margin:0 0 16px;line-height:1.1;">Join<br>HostelHub</h2>
              <p style="color:rgba(255,255,255,0.85);font-size:1.1rem;font-weight:400;line-height:1.6;margin:0 0 32px;">
                Register as a student or warden and kick-start your hostel journey in minutes.
              </p>
              
              <div class="features-list">
                <div class="feature-item"><span class="icon">✨</span> Access 2,400+ premium hostels</div>
                <div class="feature-item"><span class="icon">📋</span> Apply in one seamless digital step</div>
                <div class="feature-item"><span class="icon">🌍</span> Connect with vibrant communities</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right panel: Form -->
        <div class="auth-panel auth-panel--right">
          <div class="form-wrapper">
            <h1 style="font-size:1.8rem;font-weight:900;letter-spacing:-0.03em;margin:0 0 8px;color:var(--text);">Create Account</h1>
            <p class="muted" style="margin:0 0 28px;font-size:0.95rem;">Already have an account? <a routerLink="/auth/login" class="primary-link">Sign in</a></p>

            <button class="btn ghost google-btn" type="button" (click)="loginWithGoogle()">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
              Sign up with Google
            </button>
            
            <div class="divider">
              <span>or sign up with email</span>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()">
              <!-- Role Selection -->
              <div class="field group" style="margin-bottom:20px;">
                <label>I am a</label>
                <div class="role-selector">
                  <button type="button" class="role-option" [class.active]="selectedRole === 'Student'" (click)="selectRole('Student')">
                    👨‍🎓 Student
                  </button>
                  <button type="button" class="role-option" [class.active]="selectedRole === 'Warden'" (click)="selectRole('Warden')">
                    🏢 Warden
                  </button>
                </div>
              </div>

              <div class="grid two" style="gap:16px;margin-bottom:16px;">
                <div class="field group">
                  <label>Full Name</label>
                  <input formControlName="name" placeholder="Riya Sharma" class="premium-input">
                </div>
                <div class="field group">
                  <label>Phone number</label>
                  <input formControlName="phone" placeholder="98765 43210" class="premium-input">
                </div>
              </div>

              <div class="field group" style="margin-bottom:16px;">
                <label>Email address</label>
                <input formControlName="email" type="email" placeholder="riya@university.edu" class="premium-input">
              </div>
              <div class="field group" style="margin-bottom:16px;">
                <label>Password</label>
                <input formControlName="password" type="password" placeholder="Min. 8 characters" class="premium-input">
              </div>

              <!-- Additional field for Warden -->
              <div class="field group animate-fade-in-up" *ngIf="selectedRole === 'Warden'" style="margin-bottom:16px;">
                <label>Hostel Block Name</label>
                <input formControlName="blockName" placeholder="e.g., Boys Block A" class="premium-input">
              </div>

              <button class="btn premium-btn" type="submit" style="margin-top:12px;">Complete Registration</button>
            </form>

            <div *ngIf="message" class="auth-message animate-fade-in-up" [class.error]="isError">{{ message }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 80px);padding:32px 16px; }
    .auth-card {
      display:grid;grid-template-columns:1.1fr 1fr;max-width:1100px;width:100%;min-height:680px;
      border-radius:24px;overflow:hidden;box-shadow:0 32px 80px rgba(15,23,42,0.12);
      background:white;
    }
    
    .auth-panel { position:relative; }
    
    /* Left Panel: Image + Overlay */
    .auth-panel--left {
      background-image: url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80');
      background-size: cover; background-position: center;
      color:white;display:flex;flex-direction:column;
    }
    .auth-panel--left .overlay {
      position:absolute;inset:0;
      background: linear-gradient(135deg, rgba(5,150,105,0.85) 0%, rgba(30,27,75,0.85) 100%);
      z-index:1;
    }
    .auth-content {
      position:relative;z-index:2;padding:64px;display:flex;flex-direction:column;height:100%;
    }
    
    /* Features */
    .features-list { display:flex;flex-direction:column;gap:16px;margin-top:24px; }
    .feature-item { display:flex;align-items:center;gap:12px;font-size:0.95rem;font-weight:500;color:rgba(255,255,255,0.9); }
    .feature-item .icon { font-size:1.1rem; }

    /* Right Panel: Form area */
    .auth-panel--right { display:flex;align-items:center;justify-content:center;padding:48px 32px;background:#ffffff; }
    .form-wrapper { width:100%;max-width:440px; }

    /* Premium Form Controls */
    .field label { font-size:0.8rem;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;display:block; }
    .premium-input {
      width:100%;padding:14px 18px;border-radius:14px;
      border:2px solid #f1f5f9;background:#f8fafc;
      font-size:1rem;font-weight:500;color:var(--text);
      transition:all 0.3s ease;outline:none;
    }
    .premium-input:focus {
      background:#ffffff;border-color:var(--primary);
      box-shadow:0 0 0 4px rgba(139,92,246,0.1);
    }
    .premium-input::placeholder { color:#cbd5e1;font-weight:400; }

    .primary-link { color:var(--primary);font-weight:700;text-decoration:none;transition:opacity 0.2s; }
    .primary-link:hover { opacity:0.8; }

    /* Role Selector */
    .role-selector { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    .role-option {
      padding:14px;border:2px solid #f1f5f9;border-radius:12px;
      background:#f8fafc;cursor:pointer;font-weight:700;font-size:0.95rem;color:var(--text-light);
      transition:all 0.2s;display:flex;justify-content:center;align-items:center;gap:8px;
    }
    .role-option:hover { border-color:#cbd5e1;background:#f1f5f9;color:var(--text); }
    .role-option.active { border-color:var(--primary);background:var(--primary-light);color:var(--primary); }

    /* Buttons */
    .premium-btn {
      width:100%;padding:16px;border-radius:14px;font-size:1rem;font-weight:800;letter-spacing:0.02em;
      background:linear-gradient(135deg,var(--primary),#6d28d9);color:white;border:none;cursor:pointer;
      box-shadow:0 8px 24px rgba(109,40,217,0.3);
      transition:transform 0.2s, box-shadow 0.2s;
    }
    .premium-btn:hover { transform:translateY(-2px);box-shadow:0 12px 32px rgba(109,40,217,0.4); }
    .premium-btn:active { transform:translateY(0); }

    .google-btn {
      width:100%;justify-content:center;font-weight:700;font-size:1rem;
      padding:14px;border-radius:14px;border:2px solid #f1f5f9;background:#ffffff;
      color:var(--text);margin-bottom:28px;transition:all 0.2s;
    }
    .google-btn img { width:20px;height:20px;margin-right:12px; }
    .google-btn:hover { background:#f8fafc;border-color:#e2e8f0; }

    /* Utilities */
    .divider { display:flex;align-items:center;text-align:center;margin-bottom:28px;color:#94a3b8;font-size:0.8rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase; }
    .divider::before, .divider::after { content:'';flex:1;border-bottom:1px solid #e2e8f0; }
    .divider span { padding:0 16px; }

    .auth-message { margin-top:24px;padding:14px;border-radius:12px;font-size:0.9rem;font-weight:600;background:var(--success-light);color:var(--success);text-align:center; }
    .auth-message.error { background:#fee2e2;color:#b91c1c; }

    @media(max-width:900px){
      .auth-card { grid-template-columns:1fr;min-height:auto; }
      .auth-panel--left { display:none; }
      .auth-panel--right { padding:40px 24px; }
    }
  `]
})
export class SignupPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  selectedRole: 'Student' | 'Warden' = 'Student';

  readonly form = this.fb.nonNullable.group({
    name:     ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    phone:    ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    blockName: ['']
  });

  message = '';
  isError = false;

  loginWithGoogle(): void {
    alert('Google OAuth login connection will be integrated here soon.');
  }

  selectRole(role: 'Student' | 'Warden'): void {
    this.selectedRole = role;
    if (role === 'Student') {
      this.form.get('blockName')?.clearValidators();
    } else {
      this.form.get('blockName')?.setValidators([Validators.required]);
    }
    this.form.get('blockName')?.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      if (this.form.get('phone')?.hasError('pattern')) {
        this.message = 'Phone number must be exactly 10 digits.';
      } else if (this.form.get('email')?.hasError('email')) {
        this.message = 'Please provide a valid email format.';
      } else {
        this.message = 'Please complete all required fields correctly.';
      }
      this.isError = true;
      return;
    }
    const payload = { ...this.form.getRawValue(), role: this.selectedRole };
    if (this.selectedRole === 'Student') {
      delete (payload as any).blockName;
    }

    this.authService.signup(payload).subscribe({
      next: (response) => {
        this.message = response.message;
        this.isError = false;
        const params = this.route.snapshot.queryParams as any;
        const returnUrl = params['returnUrl'];
        const hostelId = params['hostelId'];
        const blockName = params['blockName'];

        if (returnUrl) {
          this.router.navigate([returnUrl], { 
            queryParams: { hostelId, blockName },
            queryParamsHandling: 'merge'
          });
          return;
        }

        const target = this.selectedRole === 'Student' ? '/search' : '/warden';
        this.router.navigateByUrl(target);
      },
      error: (error) => {
        this.message = error.error?.error ?? 'Signup failed. Please try again.';
        this.isError = true;
      }
    });
  }
}
