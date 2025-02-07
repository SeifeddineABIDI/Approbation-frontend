import { Routes } from '@angular/router';
import { RequestAddComponent } from './request-add/request-add.component';
import { TasksListComponent } from './tasks/list/list.component';
import { TasksDetailsComponent } from './tasks/details/details.component';

export default [

    {
        path    : 'list',
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

] as Routes;
