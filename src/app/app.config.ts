import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'set-card-game-b7b55',
        appId: '1:314036741918:web:13991a7c172a1b2efecb0f',
        databaseURL:
          'https://set-card-game-b7b55-default-rtdb.europe-west1.firebasedatabase.app',
        storageBucket: 'set-card-game-b7b55.firebasestorage.app',
        apiKey: 'AIzaSyDZAx444-7oW19-zQFktsp_2Ef6D5lHD4A',
        authDomain: 'set-card-game-b7b55.firebaseapp.com',
        messagingSenderId: '314036741918',
      })
    ),
    provideDatabase(() => getDatabase()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
  ],
};
