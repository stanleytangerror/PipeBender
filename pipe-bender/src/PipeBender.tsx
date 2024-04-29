import React, { useState } from 'react';
import './PipeBender.css';
import { Vec3 } from 'vec3';
import { Arc, Segment, BendedPipe, calcPipe } from './Geometry';

enum DegreeDisplayFormat { Format1 = 'format1', Format2 = 'format2' }

function radianFormat(radian: number, format: DegreeDisplayFormat, round: number) {
  const value = radian / Math.PI * 180;
  if (format === DegreeDisplayFormat.Format1) {
    return `${value.toFixed(round)}°`;
  } else {
    const decimal = Math.floor(value);
    const fractor = value - decimal;
    return `${decimal}°${(fractor * 60).toFixed(round)}'`;
  }
}

interface DisplayStyle
{
  lengthRoundDigits: number;
  radianRoundDigits: number;
  degreeFormat: DegreeDisplayFormat;
}

function CurveSegmentUI(props: { index: number, curve: Arc, style: DisplayStyle }) {
  const index = props.index;
  const curve = props.curve;
  const style = props.style;

  return (
    <div>
      <span>弯头{index + 1}长度/角度</span>
      <span>{curve.length().toFixed(style.lengthRoundDigits)}/{radianFormat(curve.centralAngle, style.degreeFormat, style.radianRoundDigits)}</span>
    </div>
  );
}

function StraightSegmentUI(props: { index: number, straight: Segment, style: DisplayStyle }) {
  const index = props.index;
  const straight = props.straight;
  const style = props.style;
  
  return (
    <div>
      <span>直段{index + 1}长度</span>
      <span>{straight.length().toFixed(style.lengthRoundDigits)}</span>
    </div>
  );
}

function CalculateResultUI(props: { result: BendedPipe, style: DisplayStyle }) {
  const bendedPipe = props.result;
  const style = props.style;

  const sequence = bendedPipe.segments.flatMap<Segment | Arc>((s, i) => 
    i >= bendedPipe.arcs.length ? s : [s, bendedPipe.arcs[i]]);

  return (
    <div>
      {
        sequence.map((s, index) => 
          s instanceof Segment ? 
          (<StraightSegmentUI index={index} straight={s} style={style}/>) :
          (<CurveSegmentUI index={index} curve={s} style={style}/>)
        )
      }
      <div><span>展开长度</span>
      <span>{bendedPipe.totalLength().toFixed(style.lengthRoundDigits)}</span>
      </div>
    </div>
  );                    
}

function PipeBender() {
  const [points, setPoints] = useState<Array<Vec3>>([new Vec3(0, 0, 0), new Vec3(0, 0, -900), new Vec3(300, 1000, -300), new Vec3(300, 2000, -300)]);
  const [radius, setRadius] = useState<number>(200);
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>({ radianRoundDigits: 2, lengthRoundDigits: 1, degreeFormat: DegreeDisplayFormat.Format1 });
  const [bendedPipe, setCalculateResult] = useState<BendedPipe | null>(null);

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

  const handleDegreeFormatChange = (degreeFormat: DegreeDisplayFormat) => {
    const updatedStyle = {...displayStyle, degreeFormat: degreeFormat};
    setDisplayStyle(updatedStyle);
  }

  return (
    <div className="container">
      <div className="left-col">
        <div className="panel panel-points">
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
        <div className="panel panel-results">
          <h2>计算结果</h2>
          {bendedPipe !== null ? <CalculateResultUI result={bendedPipe} style={displayStyle} /> : null}
        </div>
      </div>
      <div className="panel right-col">
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
            value={displayStyle.degreeFormat}
            onChange={(e) => handleDegreeFormatChange(e.target.value as DegreeDisplayFormat)}
          >
            <option value={DegreeDisplayFormat.Format1}>0.00°</option>
            <option value={DegreeDisplayFormat.Format2}>0°00'</option>
          </select>
        </div>
        <h2>Operators</h2>
        <button onClick={() => handleCalculate(points, radius)}>Calculate</button>
        <button onClick={handleSave}>Save</button>
        <h2>Execution</h2>
        <button onClick={() => handleCalculate(points, radius)}>Calculate</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default PipeBender;
