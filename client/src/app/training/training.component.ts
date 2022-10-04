import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { retry } from 'rxjs';
import { AuthService } from '../auth.service';
import { Flashcard, FlashcardSet } from '../types';

@Component({
    selector: 'app-training',
    templateUrl: './training.component.html',
    styleUrls: ['./training.component.css']
})
export class TrainingComponent implements OnInit {
    protected fsetNames: string[] = [];
    protected fset: FlashcardSet = new FlashcardSet('');
    protected started = false;
    protected frontSide = true;
    protected question = '';
    protected answer = '';
    protected score = 0;
    protected scoreHidden = true;
    private iterator: IterableIterator<Flashcard> = [].values();
    private next: IteratorResult<Flashcard, any> = [].values().next();

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

        this.http.get<string[]>('/api/training').pipe(retry(2))
            .subscribe({ next, error });
    }

    protected init(index: number): void {
        const next = (value: FlashcardSet) => {
            this.fset = value;
            this.start();
        }
        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
            }
        }

        this.http.get<FlashcardSet>('/api/collections/' + index)
            .subscribe({ next, error });
    }

    private start() {
        this.started = true;
        this.scoreHidden = true;
        this.score = 0;
        this.iterator = this.fset.flashcards.values();
        this.updateScore(0);
    }

    protected cancel(): void {
        this.started = false;
    }

    protected updateScore(value: number): void {
        this.next = this.iterator.next();

        this.score += value;
        if (this.next.done) {
            this.started = false;
            this.scoreHidden = false;
            return;
        }
        this.question = this.next.value.question;
        this.frontSide = true;
    }

    protected getAnswer(): void {
        this.answer = this.next.value.answer;
        this.frontSide = false;
    }
}
