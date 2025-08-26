import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-game-buttons',
  standalone: true,
  imports: [],
  templateUrl: './game-buttons.component.html',
  styleUrl: './game-buttons.component.scss',
})
export class GameButtonsComponent {

  @Output() ShowTopList = new EventEmitter<void>();
  @Output() GiveHint = new EventEmitter<void>();
  @Output() ShuffleCardsTable = new EventEmitter<void>();
  @Output() NavigateToRandom = new EventEmitter<void>();
  @Output() NavigateToDaily = new EventEmitter<void>();

  showToplist() {
    this.ShowTopList.emit();
  }
  giveHint() {
    this.GiveHint.emit();
  }
  shuffleCardsTable() {
    this.ShuffleCardsTable.emit();
  }
  navigateToRandom() {
    this.NavigateToRandom.emit();
  }
  navigateToDaily() {
    this.NavigateToDaily.emit();
  }
}
