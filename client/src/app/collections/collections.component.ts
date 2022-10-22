import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ErrorService } from '../error.service';

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
        private readonly error: ErrorService
    ) { }

    ngOnInit(): void {
        this.http.get<string[]>('/api/collections')
            .subscribe({
                next: (value: string[]) => this.fsetNames = value,
                error: err => this.error.defaultHandler(err)
            });
    }

    protected addFSet(): void {
        if (this.locked) return;
        this.locked = true;
        const name = this.newFSetName;

        const param = new HttpParams().set('name', name);

        this.http.post('/api/fset', param).pipe(
            finalize(() => this.locked = false)
        ).subscribe({
            error: err => this.error.defaultHandler(err),
            complete: () => {
                this.fsetNames.push(name);
                this.newFSetName = '';
            }
        });
    }

    protected renameFSet(name: string, index: number): void {
        if (this.locked) return;
        this.locked = true;

        const params = new HttpParams().appendAll({ name, index });

        this.http.patch('/api/fset', params).pipe(
            finalize(() => this.locked = false)
        ).subscribe({
            error: err => this.error.defaultHandler(err),
            complete: () => {
                this.fsetNames[index] = name;
                this.FSetNameUpdate = '';
            }
        });
    }

    protected deleteFSet(index: number) {
        if (this.locked) return;
        this.locked = true;

        const params = new HttpParams().set('index', index);

        this.http.request('DELETE', '/api/fset', { body: params }).pipe(
            finalize(() => this.locked = false)
        ).subscribe({
            error: err => this.error.defaultHandler(err),
            complete: () => this.fsetNames.splice(index, 1)
        });
    }
}
