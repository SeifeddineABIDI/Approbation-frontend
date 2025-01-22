import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import {catchError, from, Observable, switchMap, throwError} from 'rxjs';
import {environment} from "../../../environments/environment";


let cachedClientIp: string | null = null;
const fetchClientIpFromBackend = (): Promise<string> => {
    if (cachedClientIp) {
        return Promise.resolve(cachedClientIp); // Return cached IP
    }
    return fetch(`${environment.apiUrl}/api/v1/auth/api/client-ip`)
        .then((response) => response.text())
        .then((ip) => {
            cachedClientIp = ip;
            return ip;
        })
        .catch(() => {
            return '';
        });
};


/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> =>
{
    const authService = inject(AuthService);
    if (authService.accessToken) {

        return from(fetchClientIpFromBackend()).pipe(
            switchMap((clientIp) => {
                const decodedToken = AuthUtils['_decodeToken'](authService.accessToken);

                if (decodedToken) {
                    const tokenIp = decodedToken.ip || '';
                    const tokenAgent = decodedToken.agent || '';
                    const actualAgent = navigator.userAgent;

                   /* console.log('Decoded Token:', decodedToken);
                    console.log('Token IP:', tokenIp);
                    console.log('Client IP (from backend):', clientIp);
                    console.log('Token Agent:', tokenAgent);
                    console.log('Actual Agent:', actualAgent);*/

                    if (tokenIp !== clientIp || tokenAgent !== actualAgent) {
                        /*console.error('IP/User-Agent mismatch detected.');*/

                        /*console.error('Error: IP mismatch or User-Agent mismatch.', {
                            tokenIp,
                            clientIp,
                            tokenAgent,
                            actualAgent
                        });*/

                        authService.signOut(); // Sign the user out

                        return throwError(() => new Error('Invalid token: IP or User-Agent mismatch.'));
                    }
                }

                let newReq = req.clone();
                if (authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)) {
                    newReq = req.clone({
                        headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
                    });
                }
                return next(newReq);
            })
        );
    }

    return next(req).pipe(
        catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
                authService.signOut();
            }
            return throwError(error);
        })
    );
};
