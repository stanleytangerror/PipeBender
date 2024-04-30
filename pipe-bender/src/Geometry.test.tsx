import { range } from './Geometry';

test('range', () => {
  expect(range(0, -1)).toEqual([]);
  expect(range(0, 0)).toEqual([]);
  expect(range(0, 1)).toEqual([0]);
  expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
});
