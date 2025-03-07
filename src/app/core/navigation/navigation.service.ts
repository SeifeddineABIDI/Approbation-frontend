import { TranslocoService } from '@ngneat/transloco';
import { UserService } from 'app/core/user/user.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { BehaviorSubject, Observable, ReplaySubject, tap } from 'rxjs';
import { FuseNavigationItem, FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { TasksService } from 'app/modules/user/requests/tasks/tasks.service';
import { Task } from 'app/modules/user/requests/tasks/tasks.types';
import { defaultNavigation } from 'app/mock-api/common/navigation/data';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);
  private tasksCount: number = 0;
  private tasksCountSubject: BehaviorSubject<number> = new BehaviorSubject(this.tasksCount);
  private _selectedBpmnFile: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private _http = inject(HttpClient);

  constructor(
    private _httpClient: HttpClient,
    private userService: UserService,
    private _fuseNavigationService: FuseNavigationService,
    private _tasksService: TasksService,
    private translocoService: TranslocoService
  ) {
    this.translocoService.langChanges$.subscribe(() => {
      this.changeLanguage();
      this.updateNavigation();
    });
    this.initializeNavigation();
  }

  get navigation$(): Observable<Navigation> {
    return this._navigation.asObservable();
  }

  get taskCount$(): Observable<number> {
    return this.tasksCountSubject.asObservable();
  }

  get selectedBpmnFile$(): Observable<string | null> {
    return this._selectedBpmnFile.asObservable();
  }

  get(): Observable<Navigation> {
    return this._httpClient.get<Navigation>('api/common/navigation').pipe(
      tap((navigation) => {
        const filteredNavigation = this.filterNavigationByRoles(navigation);
        const modelerItem = filteredNavigation.default.find((item) => item.id === 'modeler');
        if (!modelerItem) {
          const defaultModeler = defaultNavigation.find((item) => item.id === 'modeler');
          if (defaultModeler) {
            filteredNavigation.default.push(defaultModeler);
          }
        }
        this.updateBpmnChildren(filteredNavigation);})
    );
  }

  changeLanguage() {
    const lang = this.translocoService.getActiveLang();
    sessionStorage.setItem('activeLang', lang);
  }

  private filterNavigationByRoles(navigation: Navigation): Navigation {
    const userRoles = this.userService.getCurrentUserRole();
    console.log(userRoles);
    
    return {
      compact: this.filterItemsByRoles(navigation.compact || [], userRoles),
      default: this.filterItemsByRoles(navigation.default || [], userRoles),
      futuristic: this.filterItemsByRoles(navigation.futuristic || [], userRoles),
      horizontal: this.filterItemsByRoles(navigation.horizontal || [], userRoles),
    };
  }

  private filterItemsByRoles(items: FuseNavigationItem[], userRoles: string[]): FuseNavigationItem[] {
    return items
      .filter((item) => {
        if (!item.roles || item.roles.length === 0) {
          return true;
        }
        return item.roles.some((role) => userRoles.includes(role)); 
      })
      .map((item) => this.translateItem(item)); 
  }
  

  private updateNavigationCount(count: number): void {
    setTimeout(() => {
      const mainNavigationComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');
      if (mainNavigationComponent) {
        const mainNavigation = mainNavigationComponent.navigation;
        const menuItem = this._fuseNavigationService.getItem('navigation-features.badge-style-oval', mainNavigation);
        if (menuItem) {
          menuItem.badge.title = count.toString();
          mainNavigationComponent.refresh();
        }
      }
    });
  }

  fetchAndUpdateTaskCount() {
    const accessToken = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.matricule && accessToken) {
      this._tasksService.getTasksByUser(user.matricule, accessToken).subscribe((tasks: Task[]) => {
        this.tasksCount = tasks.length;
        this.tasksCountSubject.next(this.tasksCount);
        this.updateNavigationCount(this.tasksCount);
      });
    }
  }

  private translateItem(item: FuseNavigationItem): FuseNavigationItem {
    item.title = this.translocoService.translate(item.title);
    if (item.children) {
      item.children.forEach((child) => {
        child.title = this.translocoService.translate(child.title);
      });
    }
    if (item.badge) {
      item.badge.title = this.translocoService.translate(item.badge.title);
    }
    return item;
  }

  private updateNavigation() {
    this._httpClient.get<Navigation>('api/common/navigation').subscribe((navigation) => {
      const filteredNavigation = this.filterNavigationByRoles(navigation);
      this.updateBpmnChildren(filteredNavigation);
    });
  }

  private updateBpmnChildren(navigation: Navigation): void {
    this._http.get<string[]>('http://localhost:8080/api/bpmn/files').subscribe({
      next: (files) => {
        const modelerItem = navigation.default.find((item) => item.id === 'modeler');
        if (modelerItem) {
          modelerItem.children = files.map((fileName, index) => ({
            id: `modeler.file-${index}`,
            title: fileName.replace('.bpmn', ''),
            type: 'basic',
            icon: 'heroicons_outline:document-text',
            link: `/users/modeler/${encodeURIComponent(fileName)}` // Dynamic route
          }));
          this._navigation.next(navigation);
          setTimeout(() => {
            const navComponent = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>('mainNavigation');
            if (navComponent) {
              navComponent.refresh();
            }
          }, 0);
          if (files.length > 0 && !this._selectedBpmnFile.value) {
            this._selectedBpmnFile.next(files[0]);
          }
        } else {
          console.error('Modeler item not found in navigation.default');
        }
      },
      error: (err) => console.error('Error fetching BPMN files:', err)
    });
  }

  private initializeNavigation(): void {
    this.get().subscribe();
  }
}