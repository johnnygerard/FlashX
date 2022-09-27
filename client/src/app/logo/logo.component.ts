import { Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-logo',
    encapsulation: ViewEncapsulation.ShadowDom,
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.css']
})
export class LogoComponent { }
