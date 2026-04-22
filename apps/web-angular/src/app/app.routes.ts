import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/home.page';
import { LoginPageComponent } from './features/auth/login.page';
import { SignupPageComponent } from './features/auth/signup.page';
import { ForgotPasswordPageComponent } from './features/auth/forgot-password.page';
import { ResetPasswordPageComponent } from './features/auth/reset-password.page';
import { HostelListPageComponent } from './features/hostels/hostel-list.page';
import { HostelDetailPageComponent } from './features/hostels/hostel-detail.page';
import { DashboardPageComponent } from './features/dashboard/dashboard.page';
import { DashboardReviewsPageComponent } from './features/dashboard/dashboard-reviews.page';
import { AdminPageComponent } from './features/admin/admin.page';
import { StudentsPageComponent } from './features/students/students.page';
import { ApplicationsPageComponent } from './features/applications/applications.page';
import { ComplaintsPageComponent } from './features/complaints/complaints.page';
import { NoticesPageComponent } from './features/notices/notices.page';
import { MessMenuPageComponent } from './features/mess-menu/mess-menu.page';
import { WardenPageComponent } from './features/warden/warden.page';
import { StoriesPageComponent } from './features/stories/stories.page';
import { CommunitiesPageComponent } from './features/communities/communities.page';
import { ProfilePageComponent } from './features/profile/profile.page';
import { BookingPageComponent } from './features/booking/booking.page';
import { FeePaymentPageComponent } from './features/fee-payment/fee-payment.page';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ── Landing ──
  { path: '', component: HomePageComponent },

  // ── Auth ──
  { path: 'auth/login',            component: LoginPageComponent },
  { path: 'auth/signup',           component: SignupPageComponent },
  { path: 'auth/forgot-password',  component: ForgotPasswordPageComponent },
  { path: 'auth/reset-password',   component: ResetPasswordPageComponent },

  // ── Marketplace ──
  { path: 'search',       component: HostelListPageComponent },
  { path: 'hostels',      component: HostelListPageComponent },
  { path: 'hostels/:id',  component: HostelDetailPageComponent },

  // ── Booking ──
  { path: 'booking',      component: BookingPageComponent, canActivate: [authGuard] },

  // ── Student Dashboard (nested pages) ──
  { path: 'dashboard',              component: DashboardPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student'], requiresApproval: true } },
  { path: 'dashboard/profile',      component: ProfilePageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student'], requiresApproval: true } },
  { path: 'dashboard/notices',      component: NoticesPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student'], requiresApproval: true } },
  { path: 'dashboard/mess-menu',    component: MessMenuPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student'], requiresApproval: true } },
  { path: 'dashboard/reviews',      component: DashboardReviewsPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student'], requiresApproval: true } },

  // ── Student tools (top-level) ──
  { path: 'applications', component: ApplicationsPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student'] } },
  { path: 'complaints',   component: ComplaintsPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student', 'Warden', 'Admin'] } },
  { path: 'notices',      component: NoticesPageComponent, canActivate: [authGuard] },
  { path: 'mess-menu',    component: MessMenuPageComponent, canActivate: [authGuard] },
  { path: 'profile',      component: ProfilePageComponent, canActivate: [authGuard] },
  { path: 'students',     component: StudentsPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Admin', 'Warden'] } },

  // ── Staff panels ──
  { path: 'warden',  component: WardenPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Warden', 'Admin'] } },
  { path: 'admin',   component: AdminPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Admin'] } },
  { path: 'fee-payment', component: FeePaymentPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student'] } },

  // ── Community ──
  { path: 'stories',     component: StoriesPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student', 'Warden', 'Admin'] } },
  { path: 'communities', component: CommunitiesPageComponent, canActivate: [authGuard, roleGuard], data: { roles: ['Student', 'Warden', 'Admin'], requiresApproval: true } },

  // ── Fallback ──
  { path: '**', redirectTo: '' }
];
