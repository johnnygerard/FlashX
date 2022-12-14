import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { ErrorService } from '../error.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
    protected username = '';
    protected message = '';
    protected successMessage = '';
    protected readonly credentials = {
        currentPwd: '',
        newPwd: ''
    };

    constructor(
        private readonly http: HttpClient,
        private readonly auth: AuthService,
        private readonly router: Router,
        private readonly error: ErrorService
    ) { }

    ngOnInit(): void {
        this.http.get('/api/account', { responseType: 'text' }).subscribe({
            next: (value: string) => this.username = value,
            error: err => this.error.defaultHandler(err)
        });
    }

    protected modifyPwd(form: NgForm): void {
        this.message = '';
        this.successMessage = '';

        const params = new HttpParams().appendAll(this.credentials);

        this.http.put('/api/password', params, {
            responseType: 'text'
        }).pipe(
            finalize(() => form.resetForm())
        ).subscribe({
            next: (value: string) => this.successMessage = value,
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

    protected deleteAccount(button: HTMLButtonElement): void {
        button.disabled = true;

        const msg = 'Erase all my data now';
        const result = prompt(`This action is irreversible!
To confirm enter this message: ${msg}`);

        if (result === msg) {
            this.http.delete('/api/account').pipe(
                finalize(() => button.disabled = false)
            ).subscribe({
                error: err => this.error.defaultHandler(err),
                complete: () => {
                    this.auth.authenticated = false;
                    this.router.navigateByUrl('/');
                }
            });
        } else button.disabled = false;
    }
}
