import { Routes } from '@angular/router';
import { TasksComponent } from './tasks/tasks.component';


export default [
    {
        path     : 'list',
        component: TasksComponent,
    },

] as Routes;