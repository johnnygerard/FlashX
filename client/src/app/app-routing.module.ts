import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { CookieNoticeComponent } from './cookie-notice/cookie-notice.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

const routes: Routes = [
    { path: '', pathMatch: 'full', component: HomeComponent, title: 'FlashX' },
    {
        path: 'about',
        pathMatch: 'full',
        component: AboutComponent,
        title: 'About'
    },
    {
        path: 'disclaimer',
        pathMatch: 'full',
        component: DisclaimerComponent,
        title: 'Disclaimer'
    },
    {
        path: 'cookie-notice',
        pathMatch: 'full',
        component: CookieNoticeComponent,
        title: 'Cookie notice'
    },
    {
        path: 'privacy-policy',
        pathMatch: 'full',
        component: PrivacyPolicyComponent,
        title: 'Privacy policy'
    },
    { path: '**', component: NotFoundComponent, title: '404 Not Found' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
