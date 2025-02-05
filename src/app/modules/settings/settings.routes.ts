import { Routes } from '@angular/router';
import { SettingsComponent } from 'app/modules/settings/settings.component';
import { SettingsAccountComponent } from './account/account.component';

export default [
    {
        path     : '',
        component: SettingsAccountComponent,
    },
] as Routes;
