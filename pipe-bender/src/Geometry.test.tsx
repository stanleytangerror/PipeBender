import { Vec3 } from 'vec3';
import { range, calcPipe, radianToDegree } from './Geometry';

test('range', () => {
  expect(range(0, -1)).toEqual([]);
  expect(range(0, 0)).toEqual([]);
  expect(range(0, 1)).toEqual([0]);
  expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
});

test('calcPipe', () => {
  calcPipeTestData.forEach(testData => {
    const input = testData.input;
    const expectedValue = replaceNumbersToStrings(testData.expect);

    const pipe = calcPipe(input.points, input.radius);

    expect(pipe.segments.map(s => s.length().toFixed(1)))
      .toEqual(expectedValue.segmentLengths);
    
    expect(pipe.arcs.map(a => ({ length: a.length().toFixed(1), angle: radianToDegree(a.centralAngle).toFixed(2) })))
      .toEqual(expectedValue.arcs);

    expect(pipe.totalLength().toFixed(1)).toEqual(expectedValue.totalLength);
    
    expect(range(0, -1)).toEqual([]);
    expect(range(0, 0)).toEqual([]);
    expect(range(0, 1)).toEqual([0]);
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });
});

const calcPipeTestData = [
  {
    input: {
      points: [ new Vec3(0, 0, 0), new Vec3(0, 0, -900), new Vec3(300, 1000, -300), new Vec3(300, 2000, -300) ],
      radius: 200
    },
    expect: {
      segmentLengths: [ 554.4, 797.7, 939.1 ],
      arcs: [ 
        { length: 418.5, angle: 119.89 }, 
        { length: 118.2, angle: 33.85 }
      ],
      totalLength: 2827.8
    }
  }
]

function replaceNumbersToStrings(obj: any): any {
  // Check if the input is an object
  if (typeof obj === 'object' && obj !== null) {
      // Iterate through each key-value pair in the object
      for (const key in obj) {
          // Check if the value is a number
          if (typeof obj[key] === 'number') {
              // Convert the number to its string representation
              obj[key] = obj[key].toString();
          } else if (typeof obj[key] === 'object') {
              // If the value is an object, recursively call the function
              obj[key] = replaceNumbersToStrings(obj[key]);
          }
      }
  }
  return obj;
}
