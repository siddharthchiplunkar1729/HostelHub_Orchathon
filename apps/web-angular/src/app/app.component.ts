import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, AuthUser } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <header class="topbar animate-fade-in-up">
        <div class="topbar-inner" [class.mobile-open]="mobileNavOpen">
          <!-- Brand -->
          <a class="brand" routerLink="/">
            <span class="brand-mark">HH</span>
            <span>
              <strong>HostelHub</strong>
            </span>
          </a>

          <button
            class="mobile-nav-toggle"
            type="button"
            (click)="toggleMobileNav()"
            [attr.aria-expanded]="mobileNavOpen"
            aria-label="Toggle navigation">
            {{ mobileNavOpen ? 'Close' : 'Menu' }}
          </button>

          <!-- Nav -->
          <nav class="pill-nav" [class.mobile-only-open]="mobileNavOpen">
            <a routerLink="/"          routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMobileNav()">Home</a>
            <a routerLink="/search"    routerLinkActive="active" (click)="closeMobileNav()">Search</a>
            <a routerLink="/dashboard" routerLinkActive="active" *ngIf="isApprovedStudent" (click)="closeMobileNav()">Dashboard</a>
            <a routerLink="/communities" routerLinkActive="active" *ngIf="isApprovedStudent" (click)="closeMobileNav()">Communities</a>
            <a routerLink="/applications" routerLinkActive="active" *ngIf="isStudent && !isApprovedStudent" (click)="closeMobileNav()">Applications</a>
            <a routerLink="/warden"    routerLinkActive="active" *ngIf="isWarden" (click)="closeMobileNav()">Warden Panel</a>
            <a routerLink="/admin"     routerLinkActive="active" *ngIf="isAdmin" (click)="closeMobileNav()">Admin</a>
          </nav>

          <!-- Auth actions -->
          <div class="topbar-actions" [class.mobile-only-open]="mobileNavOpen" *ngIf="user; else guestActions">
            <a class="btn ghost" routerLink="/profile" (click)="closeMobileNav()" style="border-radius: var(--radius-full); padding: 8px 16px;">
              {{ user.name.split(' ')[0] }}
            </a>
            <button class="btn" type="button" (click)="logout()" style="border-radius: var(--radius-full);">Logout</button>
          </div>

          <ng-template #guestActions>
            <div class="topbar-actions" [class.mobile-only-open]="mobileNavOpen">
              <a class="btn ghost" routerLink="/auth/signup" (click)="closeMobileNav()" style="border-radius: var(--radius-full);">Create account</a>
              <a class="btn"       routerLink="/auth/login" (click)="closeMobileNav()" style="border-radius: var(--radius-full);">Login</a>
            </div>
          </ng-template>
        </div>
      </header>

      <main class="shell">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer glass-panel" style="margin-top: auto; border-radius: var(--radius-xl) var(--radius-xl) 0 0; margin-left: 16px; margin-right: 16px; border-bottom: 0;">
        <div class="footer-inner">
          <div class="footer-brand" style="display:flex; flex-direction:column; gap:8px;">
            <div class="brand" style="margin-bottom: 0;">
              <span class="brand-mark" style="width: 32px; height: 32px; font-size: 0.9rem; border-radius: 10px;">HH</span>
              <strong style="font-size: 1.1rem;">HostelHub</strong>
            </div>
            <p class="muted" style="margin: 0; max-width: 300px;">The ultimate platform for modern student housing and campus management.</p>
          </div>
          <nav class="pill-nav" style="gap: 12px; justify-content: flex-end;">
            <a routerLink="/search">Browse hostels</a>
            <a routerLink="/stories">Stories</a>
            <a routerLink="/communities" *ngIf="isApprovedStudent">Communities</a>
            <a routerLink="/warden" *ngIf="isWarden">Warden panel</a>
            <a routerLink="/admin" *ngIf="isAdmin">Admin</a>
          </nav>
        </div>
      </footer>
    </div>
  `
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  user: AuthUser | null = this.authService.currentUser();
  isStudent = false;
  isApprovedStudent = false;
  isWarden = false;
  isAdmin = false;
  mobileNavOpen = false;

  constructor() {
    this.updateUser();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileNavOpen = false;
        this.updateUser();
      });
  }

  private updateUser(): void {
    this.user = this.authService.currentUser();
    const student = this.authService.currentStudent();
    
    this.isStudent = this.user?.role === 'Student';
    // Strictly checking for Accepted status prevents applying from inadvertently granting access.
    this.isApprovedStudent = this.isStudent && student?.enrollmentStatus === 'Accepted';
    
    this.isWarden = this.user?.role === 'Warden';
    this.isAdmin = this.user?.role === 'Admin';
  }

  logout(): void {
    this.authService.logout();
    this.user = null;
    this.mobileNavOpen = false;
    this.router.navigateByUrl('/');
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }
}
