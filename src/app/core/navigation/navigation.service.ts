import { UserService } from 'app/core/user/user.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { BehaviorSubject, Observable, ReplaySubject, takeUntil, tap } from 'rxjs';
import { RoleNavigationService } from './roleNavigation.service';
import { FuseNavigationItem, FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { TasksService } from 'app/modules/user/requests/tasks/tasks.service';
import { Task } from 'app/modules/user/requests/tasks/tasks.types';

@Injectable({providedIn: 'root'})
export class NavigationService
{
    private roleNavigationService = inject(RoleNavigationService);
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);
    private userRoles: string[] = [];
    private tasksCount: number = 0;
    private tasksCountSubject: BehaviorSubject<number> = new BehaviorSubject(this.tasksCount);

    constructor(
        private _httpClient: HttpClient,
        private userService: UserService,
        private _fuseNavigationService: FuseNavigationService,
        private _tasksService: TasksService,
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
    get taskCount$() {
      return this.tasksCountSubject.asObservable();
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

      private updateNavigationCount(count: number): void {
        setTimeout(() => {
          const mainNavigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');
          if (mainNavigationComponent) {
            const mainNavigation = mainNavigationComponent.navigation;
            const menuItem = this._fuseNavigationService.getItem('navigation-features.badge-style-oval', mainNavigation);
            if (menuItem) {
              menuItem.badge.title = count.toString(); // Update badge with task count
              mainNavigationComponent.refresh(); // Refresh navigation
            }
          }
        });
      } 
  fetchAndUpdateTaskCount() {
    const accessToken = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.matricule && accessToken) {
      this._tasksService.getTasksByUser(user.matricule, accessToken).subscribe((tasks: Task[]) => {
        this.tasksCount = tasks.length; // Update the task count
        this.tasksCountSubject.next(this.tasksCount); // Emit the updated task count
        this.updateNavigationCount(this.tasksCount); // Update navigation badge
      });
    }
  }

}
