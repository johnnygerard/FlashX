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
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { AboutComponent } from './about/about.component';
import { RegisterComponent } from './register/register.component';
import { AccountComponent } from './account/account.component';
import { CollectionsComponent } from './collections/collections.component';
import { CollectionComponent } from './collection/collection.component';
import { TrainingComponent } from './training/training.component';
import { PasswordComponent } from './password/password.component';
import { PasswordValidatorDirective } from './password-validator.directive';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        LogoComponent,
        NotFoundComponent,
        CookieNoticeComponent,
        PrivacyPolicyComponent,
        DisclaimerComponent,
        AboutComponent,
        RegisterComponent,
        AccountComponent,
        CollectionsComponent,
        CollectionComponent,
        TrainingComponent,
        PasswordComponent,
        PasswordValidatorDirective
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
