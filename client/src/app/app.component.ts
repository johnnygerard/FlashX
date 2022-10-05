import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { retry } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    private locked = false;

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        protected readonly auth: AuthService
    ) { }

    protected logOut(): void {
        if (this.locked) return;
        this.locked = true;

        const complete = () => {
            this.auth.authenticated = false;
            this.router.navigateByUrl('/');
            this.locked = false;
        };

        const error = (err: HttpErrorResponse) => {
            console.error(err);
            alert('Unexpected error');
            this.locked = false;
        };

        this.http.delete('/api/logOut').pipe(retry(2))
            .subscribe({ complete, error });
    }

}
