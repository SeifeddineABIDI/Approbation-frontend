import { Routes } from '@angular/router';
import { RequestAddComponent } from './request-add/request-add.component';
import { TasksListComponent } from './tasks/list/list.component';
import { TasksDetailsComponent } from './tasks/details/details.component';
import { ActivitiesComponent } from '../finishedTasks/activities.component';

export default [

    {
        path    : 'confirmList',
        component : TasksListComponent,
        children: [
            {
                path: ':id',
                component: TasksDetailsComponent
            }
        ]
    },
    {
        path     : 'add',
        component: RequestAddComponent,
    },
    {
        path     : 'tasksLog',
        component: ActivitiesComponent,
    },

] as Routes;
