import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // I parametri delle rotte (es. /torneo/:id) arrivano come input dei componenti.
    provideRouter(routes, withComponentInputBinding())
  ]
};
