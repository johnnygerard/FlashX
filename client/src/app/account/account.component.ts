import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { retry } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
    private locked = false;
    protected username = '';
    protected message = '';
    protected successMessage = '';
    protected submitted = false;
    protected readonly credentials = {
        currentPwd: '',
        newPwd: ''
    };

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly auth: AuthService
    ) { }

    ngOnInit(): void {
        const next = (value: string) => this.username = value;

        this.http.get('/api/account', {
            responseType: 'text'
        }).pipe(retry(2)).subscribe({ next, error: this.error });
    }

    protected modifyPwd(form: NgForm): void {
        this.submitted = true;
        if (this.locked || form.invalid) return;
        this.locked = true;

        this.message = '';
        this.successMessage = '';

        const params = new HttpParams().appendAll(this.credentials);

        const next = (value: string) => {
            this.successMessage = value;
            this.credentials.currentPwd = '';
            this.credentials.newPwd = '';
            this.submitted = false;
            this.locked = false;
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

        this.http.put('/api/password', params, {
            responseType: 'text'
        }).subscribe({ next, error });
    }

    private error(err: HttpErrorResponse): void {
        console.error(err);
        alert('Unexpected error');
        this.locked = false;
    }


    protected deleteAccount(): void {
        if (this.locked) return;
        this.locked = true;

        const msg = 'Erase all my data now';
        const result = prompt(`This action is irreversible!
To confirm enter this message: ${msg}`);

        if (result === msg) {
            const complete = () => {
                const complete = () => {
                    this.auth.authenticated = false;
                    this.router.navigateByUrl('/');
                };

                this.http.delete('/api/logOut').pipe(retry(2))
                    .subscribe({ complete, error: this.error });
            };

            this.http.delete('/api/account').pipe(retry(2)).subscribe({
                complete, error: this.error
            });
        } else this.locked = false;
    }
}
