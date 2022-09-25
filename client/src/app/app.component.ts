import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'FlashX';

    constructor(private http: HttpClientModule, protected auth: AuthService) { }

}
