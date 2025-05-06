import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { Observable, of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => 
    {
    const router: Router = inject(Router);
    const authService: AuthService = inject(AuthService);
    const userService: UserService = inject(UserService);

    return authService.check().pipe(
        switchMap((authenticated): Observable<boolean | UrlTree> => {
            // If not authenticated, redirect to sign-in
            if (!authenticated) {
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                return of(router.parseUrl(`sign-in?${redirectURL}`));
            }
            const requiredRoles = route.data['roles'] as string[];
            if (requiredRoles?.length > 0) {
                const userRole = userService.getUserRole();
                
                if (!userRole || !requiredRoles.includes(userRole)) {
                    return of(router.parseUrl('/unauthorized'));
                }
            }
            return of(true);
        }),
    );
};
