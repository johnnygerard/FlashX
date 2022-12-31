import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable, of, retry } from 'rxjs';

@Injectable()
// Retry request for non-HTTP errors
export class ErrorInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<unknown>, next: HttpHandler)
        : Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            retry({
                count: 2,
                delay(error) {
                    if (error.status) throw error;
                    return of(true);
                }
            })
        );
    }
}
