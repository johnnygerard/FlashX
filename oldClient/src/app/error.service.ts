import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ErrorService {
    constructor(
        private readonly auth: AuthService,
        private readonly router: Router
    ) { }

    defaultHandler = (err: HttpErrorResponse) => {
        if (err.status === 403) {
            this.auth.authenticated = false;
            this.router.navigateByUrl('/');
        } else {
            console.error(err);
            alert('Unexpected error');
        }
    }
}
