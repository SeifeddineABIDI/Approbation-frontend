import { UserService } from 'app/core/user/user.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { RoleNavigationService } from './roleNavigation.service';
import { FuseNavigationItem } from '@fuse/components/navigation';

@Injectable({providedIn: 'root'})
export class NavigationService
{
    private roleNavigationService = inject(RoleNavigationService);
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);
    private userRoles: string[] = [];
    constructor(
        private _httpClient: HttpClient,
        private userService: UserService
      ) {}
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation>
    {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        return this._httpClient.get<Navigation>('api/common/navigation').pipe(
          tap((navigation) => {
            const filteredNavigation = this.filterNavigationByRoles(navigation);
            this._navigation.next(filteredNavigation);
          })
        );
      }
      private filterNavigationByRoles(navigation: Navigation): Navigation {
        const userRoles = this.userService.getCurrentUserRole();
    
        return {
          compact: this.filterItemsByRoles(navigation.compact || [], userRoles),
          default: this.filterItemsByRoles(navigation.default || [], userRoles),
          futuristic: this.filterItemsByRoles(navigation.futuristic || [], userRoles),
          horizontal: this.filterItemsByRoles(navigation.horizontal || [], userRoles),
        };
      }
    
      private filterItemsByRoles(items: FuseNavigationItem[], userRoles: string[]): FuseNavigationItem[] {
        return items.filter((item) => {
          if (!item.roles || item.roles.length === 0) {
            return true;
          }
              return item.roles.some((role) => userRoles.includes(role));
        });
      }
}
