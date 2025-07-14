import { Component } from '@angular/core';
import { Deck } from './deck';
import { CardComponent } from './card/card.component';
import { CommonModule } from '@angular/common';
import { CardInfo } from './card-info';
import { DialogComponent } from './dialog/dialog.component';
import { Utils } from './utils';
import { RandomService } from './randoms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CardComponent, CommonModule, DialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'daily-set';
  Deck: Deck = new Deck();
  SelectedCards: CardInfo[] = [];
  Tabel: CardInfo[] = [];
  Found: CardInfo[][] = [];
  FoundIds: string[] = [];
  ExistingIds: string[] = [];
  SetCount = 0;
  Time = '00:00';
  Started = new Date().getTime();
  TimeHandle: any = null;
  showDialog = false;
  dialogMessage = '';
  Today = Utils.getToday();
  HintCount = 0;

  constructor(private randomService: RandomService) {
    this.startDaily();
  }

  getPath(c: CardInfo) {
    return `set_picts/${c.Shape}_${c.Fill}_${c.Color}.png`;
  }

  startTime() {
    this.TimeHandle = setInterval(() => {
      const now = new Date().getTime();

      const diffMs = now - this.Started;
      let totalSeconds = Math.floor(diffMs / 1000);

      totalSeconds += this.HintCount * 60;
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;
      let formatted = `${String(minutes).padStart(2, '0')}:${String(
        seconds
      ).padStart(2, '0')}`;

      this.Time = formatted;
    }, 1000);
  }

  cardUnSelected(card: CardInfo) {
    const index = this.SelectedCards.indexOf(card);
    if (index > -1) {
      this.SelectedCards.splice(index, 1);
    }
  }

  cardSelected(card: CardInfo) {
    const cards = this.SelectedCards;
    cards.push(card);
    if (cards.length == 3) {
      if (this.isSet(cards[0], cards[1], cards[2])) {
        cards.forEach((c) => (c.Selected = false));
        const setId = this.getId(this.SelectedCards);

        if (this.FoundIds.indexOf(setId) == -1) {
          this.FoundIds.push(setId);
          this.Found.push(structuredClone(this.SelectedCards));
          if (this.Found.length === this.SetCount) {
            clearInterval(this.TimeHandle);
            this.dialogMessage = 'Good! Your time:' + this.Time;
            this.showDialog = true;
          }
        }
        this.SelectedCards = [];
      }
    }
  }

  getId(cards: CardInfo[]) {
    const sorted = cards.sort((a, b) => a.Id - b.Id);
    return sorted.map((c) => c.Id).join('_');
  }

  isSet(card1: CardInfo, card2: CardInfo, card3: CardInfo) {
    if (!this.allAreSameOrAllDiffer(card1.Color, card2.Color, card3.Color)) {
      return false;
    }

    if (!this.allAreSameOrAllDiffer(card1.Count, card2.Count, card3.Count)) {
      return false;
    }

    if (!this.allAreSameOrAllDiffer(card1.Shape, card2.Shape, card3.Shape)) {
      return false;
    }

    if (!this.allAreSameOrAllDiffer(card1.Fill, card2.Fill, card3.Fill)) {
      return false;
    }

    return true;
  }

  allAreSameOrAllDiffer(a: any, b: any, c: any): boolean {
    return (a === b && b === c && a === c) || (a !== b && b !== c && a !== c);
  }

  setTable() {
    this.addRandomcard();

    while (this.Tabel.length < 11) {
      this.addRandomcard();
      if (this.Tabel.length === 11) {
        break;
      }
      var length = this.Tabel.length;
      const card1 = this.Tabel[length - 1];
      const card2 = this.Tabel[length - 2];
      this.createSetOrAddRandom(card1, card2);
    }

    const card1 = this.Tabel[10];
    const card2 = this.Tabel[0];
    this.createSetOrAddRandom(card1, card2);

    this.Tabel = this.shuffelArray(this.Tabel);
  }

  shuffelArray<T>(array: T[]) {
    const shuffled = array.slice(); // Make a copy
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.randomService.getRandomInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  createSetOrAddRandom(card1: CardInfo, card2: CardInfo) {
    const setCard = this.Deck.findMissingSetCard(card1, card2);
    if (setCard && !this.Tabel.find((c) => c.Id == setCard.Id)) {
      this.Tabel.push(setCard!);
    } else {
      this.addRandomcard();
    }
  }

  addRandomcard() {
    const i = this.randomService.getRandomInt(0, 80);
    const card = this.Deck.Cards[i];
    if (this.Tabel.find((x) => x.Id === card.Id)) {
      this.addRandomcard();
    } else {
      this.Tabel.push(card);
    }
  }

  countSets() {
    const sets: string[] = [];
    for (let a = 0; a < this.Tabel.length; a++) {
      for (let b = a + 1; b < this.Tabel.length; b++) {
        for (let c = b + 1; c < this.Tabel.length; c++) {
          if (this.isSet(this.Tabel[a], this.Tabel[b], this.Tabel[c])) {
            const id = this.getId([
              this.Tabel[a],
              this.Tabel[b],
              this.Tabel[c],
            ]);
            if (sets.indexOf(id) < 0) {
              sets.push(id);
            }
          }
        }
      }
    }
    this.SetCount = sets.length;
    this.ExistingIds = sets;
  }

  giveHint() {
    for (let i = 0; i < this.ExistingIds.length; i++) {
      const setId = this.ExistingIds[i];
      if (this.FoundIds.indexOf(setId) == -1) {
        const cardIds = setId.split('_');
        const hintId = this.HintCount % 2 == 0 ? cardIds[0] : cardIds[1];
        const hintCard = this.Tabel.find((c) => c.Id == parseInt(hintId));
        if (hintCard) {
          hintCard.Blink = true;
          setTimeout(() => {
            hintCard.Blink = false;
          }, 1000);
        }
        this.HintCount++;
        return;
      }
    }
  }

  shuffleTable() {
    this.Tabel = this.shuffelArray(this.Tabel);
  }

  startRandom() {
    this.randomService.removeSeed();
    this.startGame();
  }

  startDaily() {
    this.randomService.setSeed();
    this.startGame();
  }

  startGame() {
    this.SelectedCards = [];
    this.Tabel = [];
    this.Found = [];
    this.FoundIds = [];
    this.ExistingIds = [];
    this.SetCount = 0;
    this.Time = '00:00';
    this.HintCount = 0;
    this.Started = new Date().getTime();

    this.showDialog = false;
    this.dialogMessage = '';
    this.Today = Utils.getToday();
    this.Deck = new Deck();
    this.Deck.Cards = this.shuffelArray(this.Deck.Cards);
    this.setTable();
    this.countSets();
    this.startTime();
  }
}
