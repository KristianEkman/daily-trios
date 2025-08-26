import seedrandom from 'seedrandom';

export class Utils {
  static getToday(): string {
    var date = new Date().toISOString();
    return date.split('T')[0];
  }

  static formatTime(totalSeconds: number) {
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;
      let formatted = `${String(minutes).padStart(2, '0')}:${String(
        seconds
      ).padStart(2, '0')}`;
      return formatted;
    }
}
