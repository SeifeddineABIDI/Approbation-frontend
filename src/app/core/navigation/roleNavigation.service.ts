import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { defaultNavigation } from 'app/mock-api/common/navigation/data';
import { UserService } from '../user/user.service';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({ providedIn: 'root' })
export class RoleNavigationService {
  private _userRole: BehaviorSubject<string> = new BehaviorSubject<string>('user');
  private _navigationItems: BehaviorSubject<FuseNavigationItem[]> = new BehaviorSubject<FuseNavigationItem[]>([]);
  private transloco : TranslocoService;
  constructor(private userService: UserService) {}

  setUserRole(role: string): void {
    this._userRole.next(role);
    this.updateNavigation(role);
  }

  get navigationItems$(): Observable<FuseNavigationItem[]> {
    return this._navigationItems.asObservable();
  }

  private updateNavigation(role: string): void {
    const userRoles = this.userService.getCurrentUserRole();
    const filteredItems = defaultNavigation.filter((item) => {
      if (item.roles) {
        return item.roles.some((r) => userRoles.includes(r));
      }
      return true;
    }); 
    this._navigationItems.next(filteredItems);

  }
  
}
