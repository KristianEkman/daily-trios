import { Filling, Color, Shape } from './types';

export interface CardInfo {
  Fill: Filling;
  Color: Color;
  Shape: Shape;
  Count: number;
  Id: number;
  Selected: boolean;
  Blink: boolean;
}
