export class Flashcard {
    constructor(
        public question: string,
        public answer: string
    ) { }
}

export class FlashcardSet {
    readonly flashcards: Flashcard[] = [];

    constructor(public readonly name: string) { }
}
