import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoModule } from '@ngneat/transloco';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';

@Component({
    selector     : 'example',
    standalone   : true,
    templateUrl  : './example.component.html',
    encapsulation: ViewEncapsulation.None,
    imports        : [TranslocoModule,CommonModule, MatIconModule, MatButtonModule, MatRippleModule, MatMenuModule, MatTabsModule, MatButtonToggleModule, NgFor, NgIf, MatTableModule],
})
export class ExampleComponent implements OnInit
{
  apiUrl = environment.apiUrl;
  completedTasks: number = 0;
  waitingTasks: number = 0;
  allTasks: number = 0;
  errorMessage: string = '';
  team: any[] = [];
  user:User ;
  authCredit: any;
  authOcc: any;
    /**
     * Constructor
     */
    constructor(
        private _userService: UserService,
        private _router: Router
    )
    {
    }

    ngOnInit(): void {
        const accessToken = localStorage.getItem('accessToken');
        // Get matricule from local storage
        const userData = localStorage.getItem('user');
        let matricule: string | null = null;
        if (userData) {
            const parsedUser = JSON.parse(userData);
            matricule = parsedUser?.matricule;
        }
        if (matricule && accessToken) {
            this._userService.getUsersByMatricule(matricule, accessToken).subscribe({
                next: (user) => {
                    this.user = user;
                    this.fetchUserStatsAndTeam();
                },
                error: (err) => {
                    // Fallback to local storage if backend fails
                    if (userData) {
                        this.user = JSON.parse(userData);
                        this.fetchUserStatsAndTeam();
                    } else {
                        this.errorMessage = 'Failed to fetch user data.';
                    }
                }
            });
        } else if (userData) {
            this.user = JSON.parse(userData);
            this.fetchUserStatsAndTeam();
        } else {
            this.errorMessage = 'No user information available.';
        }
    }

    fetchUserStatsAndTeam(): void {
        const accessToken = localStorage.getItem('accessToken');
        if (!this.user) return;
        this._userService.getUsersStats(this.user.matricule, accessToken).subscribe({
            next: (stats) => {
                this.completedTasks = stats.completedTasks;
                this.waitingTasks = stats.waitingTasks;
                this.allTasks = stats.completedTasks + stats.waitingTasks;
                this.authCredit = stats.authCredit;
                this.authOcc = stats.authOcc;
            },
            error: (error) => {
                this.errorMessage = error.message || 'An error occurred while fetching task stats';
            }
        });
        if (this.user.role != 'ADMIN') {
            this._userService.getTeam(this.user.matricule, accessToken).subscribe({
                next: (data) => {
                    this.team = data;
                    // Add manager to the team if user has a manager
                    const managerMatricule = this.user.managerMatricule || (this.user.manager && this.user.manager.matricule);
                    if (managerMatricule) {
                        this._userService.getUsersByMatricule(managerMatricule, accessToken).subscribe({
                            next: (manager) => {
                                // Avoid duplicates
                                if (!this.team.some(member => member.matricule === manager.matricule)) {
                                    this.team = [manager, ...this.team];
                                }
                            }
                        });
                    }
                },
                error: (err) => {
                    this.errorMessage = 'Failed to fetch team data.';
                }
            });
        }
    }

    getAvatarUrl(userId: any): string {
        if (!userId)  {
            console.warn('Invalid user or user ID for avatar:', userId);
            return 'https://via.placeholder.com/40';
        }
        return `${this.apiUrl}/api/v1/management/${userId}/image`;
    }

    goToSettings(): void {
        this._router.navigate(['/settings']);
    }
}
