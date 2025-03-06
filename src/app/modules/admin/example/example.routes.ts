import { Routes } from '@angular/router';
import { ExampleComponent } from 'app/modules/admin/example/example.component';
import { TeamCalendarComponent } from 'app/modules/user/team-calendar/team-calendar.component';

export default [
    {
        path     : 'home',
        component: ExampleComponent,
    },
    {
        path     : 'team-calendar',
        component: TeamCalendarComponent,
    }
] as Routes;
