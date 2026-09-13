import { ColumnBuilder } from './types.js';

export function number(): ColumnBuilder<number, false, false> {
  return new ColumnBuilder<number, false, false>('number');
}

export function string(): ColumnBuilder<string, false, false> {
  return new ColumnBuilder<string, false, false>('string');
}

export function boolean(): ColumnBuilder<boolean, false, false> {
  return new ColumnBuilder<boolean, false, false>('boolean');
}

export function date(): ColumnBuilder<Date, false, false> {
  return new ColumnBuilder<Date, false, false>('date');
}

export function json<T = any>(): ColumnBuilder<T, false, false> {
  return new ColumnBuilder<T, false, false>('json');
}
