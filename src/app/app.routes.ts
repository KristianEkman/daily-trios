import { Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { StartPageComponent } from './start-page/start-page.component';
import { SolitaireComponent } from './solitaire/solitaire.component';

export const routes: Routes = [
  {
    path: '',
    component: StartPageComponent,
  },
  {
    path: 'solitaire',
    component: SolitaireComponent,
  },
  {
    path: 'game/:id',
    component: GameComponent,
  },
  {
    path: '**',
    component: GameComponent,
  },
];
