import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { retry } from 'rxjs';
import { AuthService } from '../auth.service';
import { Flashcard, FlashcardSet } from '../types';

@Component({
    selector: 'app-collection',
    templateUrl: './collection.component.html',
    styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit {
    protected fset: FlashcardSet;
    protected newFlashcard: Flashcard;
    private fsetIndex: number;
    private locked = false;

    constructor(
        private readonly http: HttpClient,
        public auth: AuthService,
        private readonly router: Router,
        route: ActivatedRoute
    ) {
        this.fset = new FlashcardSet('');
        this.newFlashcard = new Flashcard('', '');
        this.fsetIndex = route.snapshot.params['index'];
    }

    ngOnInit(): void {
        const next = (value: FlashcardSet) => this.fset = value;
        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
            }
        }

        this.http.get<FlashcardSet>('/api/collections/' + this.fsetIndex)
            .subscribe({ next, error });
    }

    protected deleteFlashcard(index: number) {
        if (this.locked) return;
        this.locked = true;

        const complete = () => {
            this.fset.flashcards.splice(index, 1);
            this.locked = false;
        }

        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
                this.locked = false;
            }
        }

        this.http.request('DELETE', '/api/flashcard', {
            body: { fset: this.fsetIndex, index }
        }).pipe(retry(2)).subscribe({ complete, error });
    }

    protected addFlashcard(): void {
        if (this.locked) return;
        this.locked = true;

        const clone = new Flashcard(
            this.newFlashcard.question,
            this.newFlashcard.answer
        );

        const complete = () => {
            this.fset.flashcards.push(clone);
            this.newFlashcard.question = '';
            this.newFlashcard.answer = '';
            this.locked = false;
        }

        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
                this.locked = false;
            }
        }

        this.http.post('/api/flashcard', { ...clone, fset: this.fsetIndex })
            .pipe(retry(2)).subscribe({ complete, error });
    }

    protected updateFlashcard(question: string, answer: string, index: number) {
        if (this.locked || (!question && !answer)) return;
        this.locked = true;

        const complete = () => {
            if (question) this.fset.flashcards[index].question = question;
            if (answer) this.fset.flashcards[index].answer = answer;
            this.locked = false;
        }

        const error = (err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.auth.authenticated = false;
                this.router.navigateByUrl('/');
            } else {
                console.error(err);
                alert('Unexpected error');
                this.locked = false;
            }
        }

        this.http.patch('/api/flashcard', {
            fset: this.fsetIndex, index, question, answer
        }).pipe(retry(2)).subscribe({ complete, error });
    }

}
