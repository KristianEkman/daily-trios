import seedrandom from 'seedrandom';

export class Utils {
  static getToday(): string {
    var date = new Date().toISOString();
    return date.split('T')[0];
  }
}
