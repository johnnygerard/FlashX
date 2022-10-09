import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[appAutofocus]'
})
export class AutofocusDirective implements AfterViewInit {
    private readonly BREAKPOINT_EMS = 40;

    constructor(private readonly host: ElementRef) { }

    ngAfterViewInit(): void {
        const fontSize = getComputedStyle(document.body).fontSize;

        // do not autofocus on mobile
        if ((innerWidth / Number.parseInt(fontSize)) > this.BREAKPOINT_EMS)
            this.host.nativeElement.focus();
    }

}
