import React, { useState } from 'react';
import './PipeBender.css';
import { Vec3 } from 'vec3';
import { Arc, Segment, BendedPipe, GeometryError, calcPipe, calcArcsAngle, range } from './Geometry';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

enum DegreeDisplayFormat { Format1 = '0.00°', Format2 = `0°00'` }

function radianFormat(radian: number, format: DegreeDisplayFormat, round: number) {
  const value = radian / Math.PI * 180;
  if (format === DegreeDisplayFormat.Format1) {
    return `${value.toFixed(round)}°`;
  } else {
    const decimal = Math.floor(value);
    const fractor = value - decimal;
    return `${decimal}°${(fractor * 60).toFixed(0)}'`;
  }
}

interface DisplayStyle
{
  lengthRoundDigits: number;
  radianRoundDigits: number;
  degreeFormat: DegreeDisplayFormat;
}

function CurveSegmentUI(props: { no: number, curve: Arc, style: DisplayStyle }) {
  const no = props.no;
  const curve = props.curve;
  const style = props.style;

  return (
    <tr>
      <th>弯头{no}长度/角度</th>
      <th>
        {curve.length().toFixed(style.lengthRoundDigits)}/{radianFormat(curve.centralAngle, style.degreeFormat, style.radianRoundDigits)}
      </th>
    </tr>
  );
}

function StraightSegmentUI(props: { no: number, straight: Segment, style: DisplayStyle }) {
  const no = props.no;
  const straight = props.straight;
  const style = props.style;
  
  return (
    <tr>
      <th>直段{no}长度</th>
      <th>{straight.length().toFixed(style.lengthRoundDigits)}</th>
    </tr>
  );
}

function CalculateResultUI(props: { result: BendedPipe, style: DisplayStyle }) {
  const bendedPipe = props.result;
  const style = props.style;

  let sequence: Array<{ no: number, item: Segment | Arc }> = [];
  let i = 0;
  for (; i < bendedPipe.arcs.length; ++i) {
    sequence.push({ no: i + 1, item: bendedPipe.segments[i] });
    sequence.push({ no: i + 1, item: bendedPipe.arcs[i] });
  }
  sequence.push({ no: i + 1, item: bendedPipe.segments[i] });

  const arcAngles = bendedPipe.arcs.slice(0, -1)
    .map((_, i) => calcArcsAngle([bendedPipe.arcs[i], bendedPipe.arcs[i+1]]));

  return (
    <tbody>
      {
        sequence.map(s => 
          s.item instanceof Segment ? 
          (<StraightSegmentUI no={s.no} straight={s.item} style={style}/>) :
          (<CurveSegmentUI no={s.no} curve={s.item} style={style}/>)
        )
      }
      {
        arcAngles.map((v, index) => (
        <tr>
          <th>弯头{index + 1}-{index + 2}斜势</th>
          <th>
            {radianFormat(v, style.degreeFormat, style.radianRoundDigits)}
          </th>
        </tr>
        ))
      }
      <tr>
        <th>展开长度</th>
        <th>{bendedPipe.totalLength().toFixed(style.lengthRoundDigits)}</th>
      </tr>
    </tbody>
  );                    
}

function ErrorsUI(props: { errors: Array<GeometryError> }) {
  const errors = props.errors;

  return (
    <div>
      <h2>错误记录</h2>
      <ul>
      {
        errors.map(e => (
          <li><span>[{e.date.toLocaleString()}]</span> {e.message}</li>
        ))
      }
      </ul>
    </div>
  );
}

function PointsUI(props: { 
  points: Array<Vec3>, 
  handlePointReinitialize: () => void,
  handlePointChange: (index: number, field: keyof Vec3, value: number) => void,
  handlePointReset: (index: number) => void,
  handlePointDelete: (index: number) => void,
  handlePointInsert: (index: number) => void,
}) {
  const points = props.points;

  return (
    <div>
      <h2>空间点</h2>
      <div>
        <button onClick={() => props.handlePointReinitialize()}>重置</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>X</th>
            <th>Y</th>
            <th>Z</th>
            <th></th>
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
                onChange={(e) => props.handlePointChange(index, 'x', parseFloat(e.target.value))}
              /></th>
              <th><input
                type="number"
                value={point.y}
                onChange={(e) => props.handlePointChange(index, 'y', parseFloat(e.target.value))}
              /></th>
              <th><input
                type="number"
                value={point.z}
                onChange={(e) => props.handlePointChange(index, 'z', parseFloat(e.target.value))}
              /></th>
              <th>
                <div>
                  <button onClick={() => props.handlePointReset(index)}>归零</button>
                  <button onClick={() => props.handlePointDelete(index)}>删除</button>
                </div>
                  <button onClick={() => props.handlePointInsert(index)}>插入</button>
                <div>
                </div>
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>);
}

function PipeUI(props: { bendedPipe: BendedPipe | null, displayStyle: DisplayStyle }) {
  const bendedPipe = props.bendedPipe;
  const displayStyle = props.displayStyle;
  
  return (
    <div>
      <h2>计算结果</h2>
      <table>
        <thead>
          <tr>
            <th>项目</th>
            <th>取值</th>
          </tr>
        </thead>
        {bendedPipe !== null ? <CalculateResultUI result={bendedPipe} style={displayStyle} /> : null}
      </table>
    </div>);
}

function PipeBender() {
  const [points, setPoints] = useState<Array<Vec3>>(
    (process.env.NODE_ENV === 'development') ?
      [new Vec3(0, 0, 0), new Vec3(0, 0, -900), new Vec3(300, 1000, -300), new Vec3(300, 2000, -300)] :
      [new Vec3(0, 0, 0), new Vec3(0, 0, 0), new Vec3(0, 0, 0)]);
  const [radius, setRadius] = useState<number>(200);
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>({ radianRoundDigits: 2, lengthRoundDigits: 1, degreeFormat: DegreeDisplayFormat.Format1 });
  const [bendedPipe, setCalculateResult] = useState<BendedPipe | null>(null);
  const [errors, setErrors] = useState<Array<GeometryError>>([]);

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
      try {
        const calcResult = calcPipe(points, radius);
        setCalculateResult(calcResult);
      }
      catch (error) {
        if (error instanceof GeometryError) {
          const newErrors = [...errors, error];
          setErrors(newErrors);
        } else {
          throw error;
        }
      }
    }
  };

  const handleDegreeFormatChange = (degreeFormat: DegreeDisplayFormat) => {
    const updatedStyle = {...displayStyle, degreeFormat: degreeFormat};
    setDisplayStyle(updatedStyle);
  }

  const handlePointReinitialize = () => {
    const newPoints = range(0, 3).map(_ => new Vec3(0, 0, 0));
    setPoints(newPoints);
  }

  const handlePointReset = (index: number) => {
    const updatedPoints = [...points];
    updatedPoints[index] = new Vec3(0, 0, 0);
    setPoints(updatedPoints);
  }

  const handlePointDelete = (index: number) => {
    const updatedPoints = points.filter((s, i) => i !== index);
    setPoints(updatedPoints);
  }

  const handlePointInsert = (index: number) => {
    const updatedPoints = points.slice(0, index + 1).concat([new Vec3(0, 0, 0)]).concat(points.slice(index + 1));
    setPoints(updatedPoints);
  }

  return (
    <Container fluid>
      <Row>
        <Col sm={8}>
          <Row>
            <PointsUI 
              points={points}
              handlePointReinitialize={handlePointReinitialize}
              handlePointChange={handlePointChange}
              handlePointDelete={handlePointDelete}
              handlePointInsert={handlePointInsert}
              handlePointReset={handlePointReset} />
          </Row>
          <Row>
            <PipeUI bendedPipe={bendedPipe} displayStyle={displayStyle} />
          </Row>
        </Col>
        <Col>
          <h2>控制</h2>
          <div>
            弯管半径:
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <span>角度格式</span>
            {
              Object.keys(DegreeDisplayFormat).map(k => {
                const v = DegreeDisplayFormat[k as keyof typeof DegreeDisplayFormat];
                return (
                  <div>
                    <input 
                      type="radio" 
                      name="radianFormatGroup" 
                      defaultChecked={v === DegreeDisplayFormat.Format1} 
                      onChange={() => handleDegreeFormatChange(v)} />
                    <label>{v}</label>
                  </div>
                )
              })
            }
          </div>
          <button onClick={() => handleCalculate(points, radius)}>计算</button>
        </Col>
      </Row>
      <Row>
        <ErrorsUI errors={errors} />
      </Row>
    </Container>
  );
};

export default PipeBender;
