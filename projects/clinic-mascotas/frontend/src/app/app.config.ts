import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth';
import { demoBackendInterceptor } from './core/demo-backend';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      // The static demo lives in a sub-folder of the portfolio: hash URLs work on any static host
      ...(environment.demo ? [withHashLocation()] : []),
    ),
    // authInterceptor adds the token first, then the demo backend (demo build only) answers the call
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, demoBackendInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ],
};
