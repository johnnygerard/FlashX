import { Component, ContentChild, ElementRef } from '@angular/core';

@Component({
    selector: 'app-password',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.css']
})
export class PasswordComponent {
    @ContentChild('pwd') input!: ElementRef<HTMLInputElement>;
    protected hidden = true;

    protected toggle(): void {
        this.input.nativeElement.type = (this.hidden = !this.hidden)
            ? 'password' : 'text';
    }
}
