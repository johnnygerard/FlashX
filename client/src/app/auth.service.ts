import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    authenticated = false;

    constructor(http: HttpClient) {
        http.get<boolean>('/api/authStatus').subscribe({
            next: (value: boolean) => this.authenticated = value,
            error(err) {
                console.error(err);
                alert('Unexpected error');
            }
        });
    }
}
