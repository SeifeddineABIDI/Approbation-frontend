import { Routes } from '@angular/router';
import { RequestAddComponent } from './request-add/request-add.component';
import { TasksListComponent } from './tasks/list/list.component';
import { TasksDetailsComponent } from './tasks/details/details.component';
import { ActivitiesComponent } from '../finishedTasks/activities.component';
import { RequestsListUserComponent } from './listUser/listUser.component';
import { RequestsListUserConfirmedComponent } from './listUserConfirmed/listUserConfirmed.component';

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
    {
        path     : 'all',
        component: RequestsListUserComponent,
    },
    {
        path     : 'allConfirmed',
        component: RequestsListUserConfirmedComponent,
    },


    

] as Routes;
