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
    protected fsets: string[] = [];
    protected newFSets: string[] = [];
    protected fsetName = '';
    private locked = false;

    constructor(
        private readonly http: HttpClient,
        public auth: AuthService,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        const next = (value: string[]) => {
            this.fsets = value
            this.newFSets = Array(value.length);
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

        this.http.get<string[]>('/api/collections').pipe(retry(2))
            .subscribe({ next, error });
    }

    protected addFSet(): void {
        if (this.locked) return;
        this.locked = true;
        const name = this.fsetName;

        const param = new HttpParams().set('name', name);

        const complete = () => {
            this.fsets.push(name);
            this.newFSets.push('');
            this.fsetName = '';
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

    protected renameFSet(index: number): void {
        if (this.locked) return;
        this.locked = true;

        const name = this.newFSets[index];
        const params = new HttpParams().appendAll({ name, index });

        const complete = () => {
            this.newFSets[index] = '';
            this.fsets[index] = name;
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
            this.fsets.splice(index, 1);
            this.newFSets.splice(index, 1);
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
