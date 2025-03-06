import { NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseNavigationItem, FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { QuickChatComponent } from 'app/layout/common/quick-chat/quick-chat.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'app/core/auth/auth.service';
import { TasksService } from 'app/modules/user/requests/tasks/tasks.service';
import { RoleNavigationService } from 'app/core/navigation/roleNavigation.service';

@Component({
    selector     : 'classy-layout',
    templateUrl  : './classy.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone   : true,
    imports      : [FuseLoadingBarComponent, FuseVerticalNavigationComponent, NotificationsComponent, UserComponent, NgIf, MatIconModule, MatButtonModule, LanguagesComponent, FuseFullscreenComponent, SearchComponent, ShortcutsComponent, MessagesComponent, RouterOutlet, QuickChatComponent],
})
export class ClassyLayoutComponent implements OnInit, OnDestroy
{
    isScreenSmall: boolean;
    navigation: Navigation;
    user: User;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    avatar: string;
    avatarUrl: any;

    /**
     * Constructor
     */
    constructor(

        private _navigationService: NavigationService,
        private _userService: UserService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _authService: AuthService,
        private _tasksService: TasksService,
        private _cdr: ChangeDetectorRef,
        private _roleNavigationService: RoleNavigationService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number
    {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {   
        this._initializeUser();
        this._authService.avatarUrl$.subscribe(url => {
            this.avatarUrl = url;
        });
    
        if (!this.avatarUrl) {
            this._initializeAvatar();
        }       
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) =>
            {
                this.navigation = navigation;
                
            });

        
            const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData);
            
        }
        this._roleNavigationService.setUserRole(this.user.role);

        if (this.user?.matricule) {
            this._tasksService.fetchTasks(this.user.matricule);
        }
        this._tasksService.tasksCount$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(count => {
                this._updateTaskCountBadge(count);
                this._cdr.detectChanges(); // Force UI update
            });
        this._userService.user$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((user: User) =>
            {
                    this.user = user;
            });
         
            
    
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) =>
            {
                this.isScreenSmall = !matchingAliases.includes('md');
            });
        
    }
    private _updateTaskCountBadge(count?: number): void {  
        if (!this.navigation) return;
    
        let updated = false; // Track if changes happen
    
        // Iterate through the navigation structure
        Object.keys(this.navigation).forEach((key) => {
            const navGroup = this.navigation[key];
    
            if (Array.isArray(navGroup)) {
                navGroup.forEach((item) => {
                    if (item.id === 'navigation-features.badge-style-oval' && item.badge) {
                        const newCount = count ? count.toString() : '0';
                        
                        if (item.badge.title !== newCount) {
                            item.badge.title = newCount;
                            updated = true; // Flag that an update happened
                        }
                    }
                });
            }
        });
    
        if (updated) {
            this._cdr.markForCheck(); // Ensure Angular detects the change
        }
    }
    
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void
    {
        // Get the navigation
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

        if ( navigation )
        {
            // Toggle the opened status
            navigation.toggle();
        }
    }
    private _initializeUser(): void {
        // Fetch user data from local storage
        this._userService.loadUserFromStorage();

        // Subscribe to user updates from the UserService
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user; // Update user on data change
            });
             
    }
    private _initializeAvatar(): void {
        // Check for cached avatar in local storage
        const cachedAvatarUrl = localStorage.getItem('avatarUrl');
        if (cachedAvatarUrl) {
            this.avatarUrl = cachedAvatarUrl;
        } else {
            this._fetchUserAvatar();
        }
    }

    /**
     * Fetch user avatar from the backend
     */
    private _fetchUserAvatar(): void {
        const accessToken = localStorage.getItem('accessToken');
        if (this.user && this.user.id && accessToken) {
            this._userService.getAvatar(this.user.id, accessToken)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(
                    (blob) => {
                        const reader = new FileReader();
                        reader.onload = (event: any) => {
                            this.avatarUrl = event.target.result;
                            localStorage.setItem('avatarUrl', this.avatarUrl); // Cache avatar
                        };
                        reader.readAsDataURL(blob);
                    },
                    (error) => {
                        console.error('Error fetching avatar:', error);
                        this.avatarUrl = null; // Set fallback (e.g., default avatar image)
                    }
                );
        }
    }
}
