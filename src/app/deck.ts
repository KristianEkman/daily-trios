import { CardInfo } from './card-info';
import { Color, Filling, Shape } from './types';

export class Deck {
  Cards: CardInfo[] = [];

  constructor() {
    this.newCards();
  }

  private newCards() {
    var shapes = [Shape.Diamond, Shape.Oval, Shape.Squigle];
    var colors = [Color.Red, Color.Green, Color.Blue];
    var fillings = [Filling.Open, Filling.Solid, Filling.Striped];
    var cards = this.Cards;
    var id = 1;

    for (let c = 1; c <= 3; c++) {
      shapes.forEach((sha) => {
        colors.forEach((col) => {
          fillings.forEach((fil) => {
            var info: CardInfo = {
              Color: col,
              Fill: fil,
              Count: c,
              Shape: sha,
              Id: id,
              Selected: false,
              Blink: false,
              Shake: false,
            };
            cards.push(info);
            id++;
          });
        });
      });
    }
  }

  findMissingSetCard(card1: CardInfo, card2: CardInfo) {
    const sameColor = card1.Color === card2.Color;
    const sameCount = card1.Count === card2.Count;
    const sameFill = card1.Fill === card2.Fill;
    const sameShape = card1.Shape === card2.Shape;

    const findColor = sameColor
      ? card1.Color
      : this.missingColor(card1.Color, card2.Color);

    const findCount = sameCount
      ? card1.Count
      : this.missingCount(card1.Count, card2.Count);

    const findFill = sameFill
      ? card1.Fill
      : this.missingFill(card1.Fill, card2.Fill);

    const findShape = sameShape
      ? card1.Shape
      : this.missingShape(card1.Shape, card2.Shape);

    return this.Cards.find(
      (x) =>
        x.Color === findColor &&
        x.Count === findCount &&
        x.Fill === findFill &&
        x.Shape === findShape
    );
  }

  missingColor(color1: Color, color2: Color) {
    const colors = [Color.Red, Color.Green, Color.Blue];
    this.removeFrom(colors, color1);
    this.removeFrom(colors, color2);
    return colors[0];
  }

  missingCount(a: number, b: number) {
    const counts = [1, 2, 3];
    this.removeFrom(counts, a);
    this.removeFrom(counts, b);
    return counts[0];
  }

  missingShape(a: Shape, b: Shape) {
    const shapes = [Shape.Diamond, Shape.Oval, Shape.Squigle];
    this.removeFrom(shapes, a);
    this.removeFrom(shapes, b);
    return shapes[0];
  }

  missingFill(a: Filling, b: Filling) {
    const fillings = [Filling.Open, Filling.Solid, Filling.Striped];
    this.removeFrom(fillings, a);
    this.removeFrom(fillings, b);
    return fillings[0];
  }

  removeFrom(items: any[], item: any) {
    const index = items.indexOf(item);
    if (index > -1) {
      items.splice(index, 1);
    }
  }
}
