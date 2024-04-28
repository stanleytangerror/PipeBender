import React, { useState } from 'react';
import './PipeBender.css';
import { Vec3 } from 'vec3';

class RoundedBend
{
  center: Vec3;
  start: Vec3;
  end: Vec3;
  centralAngle: number;
  radius: number;

  constructor(center: Vec3, start: Vec3, end: Vec3, centralAngle: number, radius: number) {
    this.center = center;
    this.start = start;
    this.end = end;
    this.centralAngle = centralAngle;
    this.radius = radius;
  }

  length() {
    return this.centralAngle * this.radius;
  }
}

class StraightResult
{
  start: Vec3;
  end: Vec3;

  constructor(start: Vec3, end: Vec3) {
    this.start = start;
    this.end = end;
  }

  length() {
    return this.start.clone().distanceTo(this.end);
  }
}

interface CalculateResult
{
  segments: Array<[StraightResult, RoundedBend]>;
  lastSegment: StraightResult;
  totalLength: number;
}

function calcCurve(points: [Vec3, Vec3, Vec3], radius: number) {
  /* p0 <--v10--- p1
   *             / |
   *           /  v12
   *          h    |
   *         /     V
   *               p2
   */
  const p0 = points[0];
  const p1 = points[1];
  const p2 = points[2];
  
  const v10 = p0.clone().subtract(p1).normalize();
  const v12 = p2.clone().subtract(p1).normalize();
  const h = v10.clone().add(v12).normalize();

  const cosTheta = h.innerProduct(v10.clone().normalize());
  const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
  const t = radius / sinTheta;

  const center = p1.clone().add(h.clone().scale(t));
  const centralAngle = Math.PI - Math.acos(cosTheta) * 2;
  const start = p1.clone().add(v10.clone().scale(cosTheta * t));
  const end = p1.clone().add(v12.clone().scale(cosTheta * t));

  let result = new RoundedBend(center, start, end, centralAngle, radius);
  return result;
}

enum DegreeDisplayFormat { Format1 = 'format1', Format2 = 'format2' }

function radianFormat(radian: number, format: DegreeDisplayFormat) {
  const value = radian / Math.PI * 180;
  if (format === DegreeDisplayFormat.Format1) {
    return `${value}°`;
  } else {
    const decimal = Math.floor(value);
    const fractor = value - decimal;
    return `${decimal}°${fractor * 60}'`;
  }
}

function calcPipe(points: Array<Vec3>, radius: number) {
  let segments: Array<[StraightResult, RoundedBend]> = [];
  let totalLength: number = 0;

  let lastCurve: RoundedBend | null = null;
  let lastPoint: Vec3 = points[0];
  
  for (let i : number = 1; i + 1 < points.length; ++i) {
    const curPoint = points[i];
    const nextPoint = points[i + 1];

    const curve = calcCurve([lastPoint, curPoint, nextPoint], radius);
    const straight = new StraightResult(lastCurve ? lastCurve.end : lastPoint, curve.start);
    segments.push([straight, curve]);
    
    lastCurve = curve;
    lastPoint = curPoint;
    totalLength += straight.length();
    totalLength += curve.length();
  }
  
  let lastSegment = new StraightResult(lastCurve ? lastCurve.end : lastPoint, points[points.length - 1]);
  totalLength += lastSegment.start.distanceTo(lastSegment.end);

  return { segments: segments, lastSegment: lastSegment, totalLength: totalLength };
}

function CurveSegmentUI(props: { index: number, curve: RoundedBend, degreeFormat: DegreeDisplayFormat }) {
  const index = props.index;
  const curve = props.curve;
  const degreeFormat = props.degreeFormat;

  return (
    <div>
      <span>弯头{index + 1}长度/角度</span>
      <span>{curve.length()}/{radianFormat(curve.centralAngle, degreeFormat)}</span>
    </div>
  );
}

function StraightSegmentUI(props: { index: number, straight: StraightResult }) {
  const index = props.index;
  const straight = props.straight;
  return (
    <div>
      <span>直段{index + 1}长度</span>
      <span>{straight.length()}</span>
    </div>
  );
}

function CalculateResultUI(props: { result: CalculateResult, degreeFormat: DegreeDisplayFormat }) {
  const calculateResult = props.result;
  const degreeFormat = props.degreeFormat;

  return (
    <div>
      {
        calculateResult.segments.map((segments, index) => (
          <div>
            <StraightSegmentUI index={index + 1} straight={segments[0]}/>
            <CurveSegmentUI index={index + 1} curve={segments[1]} degreeFormat={degreeFormat}/>
          </div>
        ))
      }
      <StraightSegmentUI index={calculateResult?.segments.length + 1} straight={calculateResult?.lastSegment!}/>
      <div><span>展开长度</span>
      <span>{calculateResult.totalLength}</span>
      </div>
    </div>
  );                    
}

function PipeBender() {
  const [points, setPoints] = useState<Array<Vec3>>([new Vec3(0, 0, 0), new Vec3(0, 0, -900), new Vec3(300, 1000, -300), new Vec3(300, 2000, -300)]);
  const [radius, setRadius] = useState<number>(200);
  const [degreeFormat, setDegreeFormat] = useState<DegreeDisplayFormat>(DegreeDisplayFormat.Format1);
  const [roundDigits, setRoundDigits] = useState<number>(1);
  const [calculateResult, setCalculateResult] = useState<CalculateResult | null>(null);

  const handlePointChange = (index: number, field: keyof Vec3, value: number) => {
    const updatedPoints = [...points];
    if (field === 'x') {
      updatedPoints[index].x = value;
    } else if (field === 'y') {
      updatedPoints[index].y = value;
    } else  {
      updatedPoints[index].z = value;
    }
 
    setPoints(updatedPoints);
  };

  const handleCalculate = (points: Vec3[], radius: number) => {
    if (points.length >= 3) {
      const calcResult = calcPipe(points, radius);
      setCalculateResult(calcResult);
    }
  };

  const handleSave = () => {
    // Save data
  };

  return (
    <div>
      <div className="panel">
        <h2>空间点</h2>
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>X</th>
              <th>Y</th>
              <th>Z</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr key={index}>
                <th>
                  {index}
                </th>
                <th><input
                  type="number"
                  value={point.x}
                  onChange={(e) => handlePointChange(index, 'x', parseFloat(e.target.value))}
                /></th>
                <th><input
                  type="number"
                  value={point.y}
                  onChange={(e) => handlePointChange(index, 'y', parseFloat(e.target.value))}
                /></th>
                <th><input
                  type="number"
                  value={point.z}
                  onChange={(e) => handlePointChange(index, 'z', parseFloat(e.target.value))}
                /></th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h2>计算结果</h2>
        {calculateResult !== null ? <CalculateResultUI result={calculateResult} degreeFormat={degreeFormat} /> : null}
      </div>
      <div className="panel">
        <div>
          弯管半径:
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value))}
          />
        </div>
        <div>
          角度格式
          <select
            value={degreeFormat}
            onChange={(e) => setDegreeFormat(e.target.value as DegreeDisplayFormat)}
          >
            <option value={DegreeDisplayFormat.Format1}>0.00°</option>
            <option value={DegreeDisplayFormat.Format2}>0°00'</option>
          </select>
        </div>
        <h2>Operators</h2>
        <button onClick={() => handleCalculate(points, radius)}>Calculate</button>
        <button onClick={handleSave}>Save</button>
      </div>
      <div className="panel">
        <h2>Execution</h2>
        <button onClick={() => handleCalculate(points, radius)}>Calculate</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default PipeBender;
