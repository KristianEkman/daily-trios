import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './start-page.component.html',
  styleUrl: './start-page.component.scss',
})
export class StartPageComponent {
  constructor(private router: Router) {}
  
  navigateToRandomPuzzle() {
    const randomId = this.getRandomId();
    this.router.navigate(['/game', randomId]);
  }

  navigateToRandomSolitaire() {
    const randomId = this.getRandomId();
    this.router.navigate(['/solitaire', randomId]);
  }

  getRandomId() {
    const seed = Math.floor(Math.random() * 1000).toString();
    return seed;
  }
}
