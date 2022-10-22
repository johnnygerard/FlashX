import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        protected readonly auth: AuthService
    ) { }

    protected logOut(button: HTMLButtonElement): void {
        button.disabled = true;

        this.http.delete('/api/logOut').pipe(
            finalize(() => button.disabled = false)
        ).subscribe({
            complete: () => {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            },
            error(err: HttpErrorResponse) {
                console.error(err);
                alert('Unexpected error');
            }
        });
    }

}
