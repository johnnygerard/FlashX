import { Component, EventEmitter, Output } from '@angular/core';
import {
    HttpClient, HttpErrorResponse, HttpParams
} from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    protected message = '';
    protected locked = false;
    protected readonly credentials = {
        username: '',
        password: ''
    }
    @Output() toggleFormEvent = new EventEmitter<undefined>();

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        protected readonly auth: AuthService
    ) { }

    protected toggleForm(): void {
        this.toggleFormEvent.emit();
    }

    protected logIn(form: NgForm): void {
        if (this.locked || form.invalid) return;
        this.locked = true;

        const params = new HttpParams().appendAll(this.credentials);

        const complete = () => {
            this.auth.authenticated = true;
            this.router.navigateByUrl('/training');
        };

        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.message = err.error as string;
            } else {
                console.error(err);
                alert('Unexpected error');
            }
            this.locked = false;
        };

        this.http.post('/api/logIn', params, {
            responseType: 'text'
        }).subscribe({ complete, error });
    }
}
