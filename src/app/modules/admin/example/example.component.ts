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
        const accessToken=localStorage.getItem('accessToken');
        this._userService.user$.subscribe(user=>this.user=user);
        const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData);}
        this._userService.getUsersStats(this.user.matricule,accessToken).subscribe({
            next: (stats) => {
              // On success, extract the data and assign it to component variables
              this.completedTasks = stats.completedTasks;
              this.waitingTasks = stats.waitingTasks;
              this.allTasks = stats.completedTasks + stats.waitingTasks;
              this.authCredit=stats.authCredit;
              this.authOcc=stats.authOcc;
            },
            error: (error) => {
              // Handle error
              this.errorMessage = error.message || 'An error occurred while fetching task stats';
            }
          });
          if (this.user.role != 'ADMIN')
             {
          this._userService.getTeam(this.user.matricule, accessToken).subscribe({
            next: (data) => {
              this.team = data;
              
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