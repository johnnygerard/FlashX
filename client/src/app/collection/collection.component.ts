import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, retry } from 'rxjs';
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
    protected newQuestion = '';
    protected newAnswer = '';

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

    protected deleteFlashcard(index: number, button: HTMLButtonElement) {
        button.disabled = true;

        this.http.request('DELETE', '/api/flashcard', {
            body: { fset: this.fsetIndex, index }
        }).pipe(
            finalize(() => button.disabled = false)
        ).subscribe({
            complete: () => this.fset.flashcards.splice(index, 1),
            error: err => this.error.defaultHandler(err)
        });
    }

    protected addFlashcard(form: NgForm): void {
        const clone = new Flashcard(
            this.newFlashcard.question,
            this.newFlashcard.answer
        );

        this.http.post('/api/flashcard', { ...clone, fset: this.fsetIndex })
            .pipe(
                finalize(() => form.resetForm())
            ).subscribe({
                error: err => this.error.defaultHandler(err),
                complete: () => this.fset.flashcards.push(clone)
            });
    }

    protected updateFlashcard(index: number, form: NgForm) {
        const question = this.newQuestion;
        const answer = this.newAnswer;

        if (!question && !answer) {
            form.resetForm();
            return;
        }

        this.http.patch('/api/flashcard', {
            fset: this.fsetIndex, index, question, answer
        }).pipe(
            finalize(() => form.resetForm())
        ).subscribe({
            error: err => this.error.defaultHandler(err),
            complete: () => {
                if (question) this.fset.flashcards[index].question = question;
                if (answer) this.fset.flashcards[index].answer = answer;
            }
        });
    }

}
