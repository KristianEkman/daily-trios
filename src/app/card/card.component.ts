import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardInfo } from '../card-info';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input()
  CardInfo!: CardInfo;
  @Output()
  CardSelected = new EventEmitter<CardInfo>();
  @Output()
  CardUnSelected = new EventEmitter<CardInfo>();

  ImagePath(): string {
    var c = this.CardInfo;
    return `set_picts/${c.Shape}_${c.Fill}_${c.Color}.png`;
  }

  clicked() {
    this.CardInfo.Selected = !this.CardInfo.Selected;
    if (this.CardInfo.Selected) {
      this.CardSelected.emit(this.CardInfo);
    } else {
      this.CardUnSelected.emit(this.CardInfo);
    }
  }
}
