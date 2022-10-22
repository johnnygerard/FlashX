import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { ErrorService } from '../error.service';
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
        private readonly error: ErrorService,
        route: ActivatedRoute
    ) {
        this.fset = new FlashcardSet('');
        this.newFlashcard = new Flashcard('', '');
        this.fsetIndex = route.snapshot.params['index'];
    }

    ngOnInit(): void {
        this.http.get<FlashcardSet>('/api/collections/' + this.fsetIndex)
            .subscribe({
                next: (value: FlashcardSet) => this.fset = value,
                error: err => this.error.defaultHandler(err)
            });
    }

    protected deleteFlashcard(index: number) {
        if (this.locked) return;
        this.locked = true;

        this.http.request('DELETE', '/api/flashcard', {
            body: { fset: this.fsetIndex, index }
        }).pipe(
            finalize(() => this.locked = false)
        ).subscribe({
            complete: () => this.fset.flashcards.splice(index, 1),
            error: err => this.error.defaultHandler(err)
        });
    }

    protected addFlashcard(): void {
        if (this.locked) return;
        this.locked = true;

        const clone = new Flashcard(
            this.newFlashcard.question,
            this.newFlashcard.answer
        );

        this.http.post('/api/flashcard', { ...clone, fset: this.fsetIndex })
            .pipe(
                finalize(() => this.locked = false)
            ).subscribe({
                error: err => this.error.defaultHandler(err),
                complete: () => {
                    this.fset.flashcards.push(clone);
                    this.newFlashcard.question = '';
                    this.newFlashcard.answer = '';
                }
            });
    }

    protected updateFlashcard(question: string, answer: string, index: number) {
        if (this.locked || (!question && !answer)) return;
        this.locked = true;

        this.http.patch('/api/flashcard', {
            fset: this.fsetIndex, index, question, answer
        }).pipe(
            finalize(() => this.locked = false)
        ).subscribe({
            error: err => this.error.defaultHandler(err),
            complete: () => {
                if (question) this.fset.flashcards[index].question = question;
                if (answer) this.fset.flashcards[index].answer = answer;
            }
        });
    }

}
