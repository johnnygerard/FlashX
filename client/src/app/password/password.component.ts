import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-password',
    templateUrl: './password.component.html',
    styleUrls: ['./password.component.css']
})
export class PasswordComponent {
    @Output() toggleEvent = new EventEmitter<boolean>();
    protected hidden = true;

    protected toggle(): void {
        this.toggleEvent.emit(this.hidden = !this.hidden);
    }
}
