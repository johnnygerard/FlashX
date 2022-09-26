import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CookieNoticeComponent } from './cookie-notice/cookie-notice.component';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [
    { path: '', pathMatch: 'full', component: HomeComponent, title: 'FlashX' },
    {
        path: 'cookie-notice',
        pathMatch: 'full',
        component: CookieNoticeComponent,
        title: 'Cookie notice'
    },
    { path: '**', component: NotFoundComponent, title: '404 Not Found' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
