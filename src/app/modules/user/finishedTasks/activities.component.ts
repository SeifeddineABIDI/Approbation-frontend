import { AsyncPipe, DatePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { Activity } from './activities.types';
import { ActivitiesService } from './activities.service';

@Component({
    selector       : 'activity',
    templateUrl    : './activities.component.html',
    styleUrls      : ['./activities.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [NgIf, NgFor, MatIconModule, AsyncPipe, TitleCasePipe, DatePipe],
})
export class ActivitiesComponent implements OnInit
{
    tasks$: Observable<Activity[]>;

    /**
     * Constructor
     */
    constructor(public _activityService: ActivitiesService)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        const accessToken = localStorage.getItem('accessToken');
        const user = JSON.parse(localStorage.getItem('user'));
        this.tasks$ = this._activityService.getActivities(user.matricule, accessToken);  // Fetch tasks
        
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Returns whether the given dates are different days
     *
     * @param current
     * @param compare
     */
    isSameDay(current: string, compare: string): boolean
    {
        return DateTime.fromISO(current).hasSame(DateTime.fromISO(compare), 'day');
    }

    /**
     * Get the relative format of the given date
     *
     * @param date
     */
    getRelativeFormat(date: string): string
    {
        return DateTime.fromISO(date).toRelativeCalendar();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
