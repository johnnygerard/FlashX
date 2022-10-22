import {
    HttpClient, HttpErrorResponse, HttpParams
} from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    protected message = '';
    protected readonly credentials = {
        username: '',
        password: '',
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

    protected register(form: NgForm): void {
        const params = new HttpParams().appendAll(this.credentials);

        this.http.post('/api/register', params, {
            responseType: 'text'
        }).pipe(
            finalize(() => form.resetForm())
        ).subscribe({
            complete: () => {
                this.auth.authenticated = true;
                this.router.navigateByUrl('/collections');
            },
            error: (err: HttpErrorResponse) => {
                if (err.status === 403) {
                    this.message = err.error as string;
                } else {
                    console.error(err);
                    alert('Unexpected error');
                }
            }
        });
    }
}
