import {
    HttpClient, HttpErrorResponse, HttpParams
} from '@angular/common/http';
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    protected message = '';
    protected locked = false;
    protected readonly credentials = {
        username: '',
        password: '',
    }

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        protected readonly auth: AuthService
    ) { }

    register(form: NgForm): void {
        if (this.locked || form.invalid) return;
        this.locked = true;

        const params = new HttpParams().appendAll(this.credentials);

        const complete = () => {
            this.auth.authenticated = true;
            this.router.navigateByUrl('/collections');
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

        this.http.post('/api/register', params, {
            responseType: 'text'
        }).subscribe({ complete, error });
    }
}
