import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LogoComponent } from './logo/logo.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { CookieNoticeComponent } from './cookie-notice/cookie-notice.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        LogoComponent,
        NotFoundComponent,
        CookieNoticeComponent,
        PrivacyPolicyComponent
    ],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
        BrowserModule,
        HttpClientModule,
        FormsModule,
        AppRoutingModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
