/**
 * Represents a date as a numeric timestamp.
 */
export class DATE {
  static create(milliseconds: number = 0): string {
    const date = new Date();
    date.setTime(date.getTime() + milliseconds);
    return date.toISOString();
  }
}
