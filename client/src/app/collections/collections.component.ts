import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { retry } from 'rxjs';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-collections',
    templateUrl: './collections.component.html',
    styleUrls: ['./collections.component.css']
})
export class CollectionsComponent implements OnInit {
    protected fsetNames: string[] = [];
    protected newFSetName = '';
    protected FSetNameUpdate = '';
    private locked = false;

    constructor(
        private readonly http: HttpClient,
        public auth: AuthService,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        const next = (value: string[]) => this.fsetNames = value;
        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
            }
        }

        this.http.get<string[]>('/api/collections').pipe(retry(2))
            .subscribe({ next, error });
    }

    protected addFSet(): void {
        if (this.locked) return;
        this.locked = true;
        const name = this.newFSetName;

        const param = new HttpParams().set('name', name);

        const complete = () => {
            this.fsetNames.push(name);
            this.newFSetName = '';
            this.locked = false;
        };

        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
            }
        }

        this.http.post('/api/fset', param).subscribe({
            complete, error
        });
    }

    protected renameFSet(name: string, index: number): void {
        if (this.locked) return;
        this.locked = true;

        const params = new HttpParams().appendAll({ name, index });

        const complete = () => {
            this.fsetNames[index] = name;
            this.FSetNameUpdate = '';
            this.locked = false;
        };

        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
            }
        }

        this.http.patch('/api/fset', params).subscribe({
            complete, error
        });
    }

    protected deleteFSet(index: number) {
        if (this.locked) return;
        this.locked = true;

        const params = new HttpParams().set('index', index);

        const complete = () => {
            this.fsetNames.splice(index, 1);
            this.locked = false;
        };

        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
            }
        }

        this.http.request('DELETE', '/api/fset', { body: params }).subscribe({
            complete, error
        });
    }
}
