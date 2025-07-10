import seedrandom from 'seedrandom';

export class Utils {
  static rng = seedrandom(this.getToday());
  static getToday(): string {
    var date = new Date().toISOString();
    return date.split('T')[0];
  }

  static randomInt(min: number, max: number) {
    return Math.floor(Utils.rng() * (max - min + 1)) + min;
  }
}
