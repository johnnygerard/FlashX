import { Injectable, NgModule } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
    RouterModule, RouterStateSnapshot, Routes, TitleStrategy
} from '@angular/router';
import { AboutComponent } from './about/about.component';
import { AccountComponent } from './account/account.component';
import { CollectionComponent } from './collection/collection.component';
import { CollectionsComponent } from './collections/collections.component';
import { CookieNoticeComponent } from './cookie-notice/cookie-notice.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { RegisterComponent } from './register/register.component';
import { TrainingComponent } from './training/training.component';

const routes: Routes = [
    { path: '', pathMatch: 'full', component: HomeComponent },
    {
        path: 'training',
        pathMatch: 'full',
        component: TrainingComponent,
        title: 'Training'
    },
    {
        path: 'collections/:index',
        pathMatch: 'full',
        component: CollectionComponent,
        title: 'Collection'
    },
    {
        path: 'collections',
        pathMatch: 'full',
        component: CollectionsComponent,
        title: 'Collections'
    },
    {
        path: 'account',
        pathMatch: 'full',
        component: AccountComponent,
        title: 'Account'
    },
    {
        path: 'register',
        pathMatch: 'full',
        component: RegisterComponent,
        title: 'Register'
    },
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

@Injectable({ providedIn: 'root' })
export class TemplatePageTitleStrategy extends TitleStrategy {
    private readonly appName = 'FlashX';

    constructor(private readonly title: Title) {
        super();
    }

    updateTitle(snapshot: RouterStateSnapshot): void {
        const title = this.buildTitle(snapshot);
        const newTitle = title ? `${this.appName} | ${title}` : this.appName;

        this.title.setTitle(newTitle);
    }
}

@NgModule({
    providers: [
        { provide: TitleStrategy, useClass: TemplatePageTitleStrategy }
    ],
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
