import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
class RoleGuardService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.currentUser();
    
    if (!user) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      this.router.navigate(['/']);
      return false;
    }

    if (route.data['requiresApproval']) {
      const student = this.authService.currentStudent();
      if (!student || student.enrollmentStatus !== 'Accepted') {
        this.router.navigate(['/search']);
        return false;
      }
    }

    return true;
  }
}

export const roleGuard: CanActivateFn = (route, state) => {
  return inject(RoleGuardService).canActivate(route, state);
};
