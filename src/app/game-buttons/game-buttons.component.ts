import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-game-buttons',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './game-buttons.component.html',
  styleUrl: './game-buttons.component.scss',
})
export class GameButtonsComponent {
  @Output() ShowTopList = new EventEmitter<void>();
  @Output() GiveHint = new EventEmitter<void>();
  @Output() ShuffleCardsTable = new EventEmitter<void>();
  @Output() AddCards = new EventEmitter<void>();

  showToplist() {
    this.ShowTopList.emit();
  }
  giveHint() {
    this.GiveHint.emit();
  }
  shuffleCardsTable() {
    this.ShuffleCardsTable.emit();
  }
  addCards() {
    this.AddCards.emit();
  }
}
