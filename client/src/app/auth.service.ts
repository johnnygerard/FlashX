import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { retry } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    authenticated = false;

    constructor(http: HttpClient) {
        const next = (value: boolean) => this.authenticated = value;

        http.get<boolean>('/api/authStatus').pipe(retry(2)).subscribe({
            next,
            error(err) {
                console.error(err);
                alert('Unexpected error');
            }
        });
    }
}
