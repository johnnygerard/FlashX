import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ErrorService } from '../error.service';
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
        private readonly error: ErrorService
    ) { }

    ngOnInit(): void {
        this.http.get<string[]>('/api/training').subscribe({
            next: (value: string[]) => this.fsetNames = value,
            error: err => this.error.defaultHandler(err)
        });
    }

    protected init(index: number): void {
        this.http.get<FlashcardSet>('/api/collections/' + index).subscribe({
            next: (value: FlashcardSet) => {
                this.fset = value;
                this.start();
            },
            error: err => this.error.defaultHandler(err)
        });
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
