import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { TasksDetailsComponent } from 'app/modules/user/requests/tasks/details/details.component';
import { TasksListComponent } from 'app/modules/user/requests/tasks/list/list.component';
import { TasksComponent } from 'app/modules/user/requests/tasks/tasks.component';
import { TasksService } from 'app/modules/user/requests/tasks/tasks.service';
import { catchError, throwError } from 'rxjs';

/**
 * Task resolver
 *
 * @param route
 * @param state
 */
const taskResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
    const tasksService = inject(TasksService);
    const router = inject(Router);
    return tasksService.getTaskById(route.paramMap.get('id'))
        .pipe(
            catchError((error) =>
            {
                console.error(error);
                const parentUrl = state.url.split('/').slice(0, -1).join('/');
                router.navigateByUrl(parentUrl);
                return throwError(error);
            }),
        );
};

/**
 * Can deactivate tasks details
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateTasksDetails = (
    component: TasksDetailsComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot) =>
{
    // Get the next route
    let nextRoute: ActivatedRouteSnapshot = nextState.root;
    while ( nextRoute.firstChild )
    {
        nextRoute = nextRoute.firstChild;
    }

    // If the next state doesn't contain '/tasks'
    // it means we are navigating away from the
    // tasks app
    if ( !nextState.url.includes('/tasks') )
    {
        return true;
    }
    if ( nextRoute.paramMap.get('id') )
    {
        // Just navigate
        return true;
    }
    return component.closeDrawer().then(() => true);
};

export default [
    {
        path     : '',
        component: TasksComponent,
        resolve  : {
            tags: () => inject(TasksService).getTags(),
        },
        children : [
            {
                path     : '',
                component: TasksListComponent,
                resolve  : {
                    tasks: () => inject(TasksService).getTags(),
                },
                children : [
                    {
                        path         : ':id',
                        component    : TasksDetailsComponent,
                        resolve      : {
                            task: taskResolver,
                        },
                        canDeactivate: [canDeactivateTasksDetails],
                    },
                ],
            },
        ],
    },
    
] as Routes;
