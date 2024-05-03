import React, { useState } from 'react';
import './PipeBender.css';
import { Vec3 } from 'vec3';
import { Arc, Segment, BendedPipe, GeometryError, calcPipe, calcArcsAngle, range } from './Geometry';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Table from 'react-bootstrap/Table';

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
    <tr key={`arc_${no}`}>
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
    <tr key={`straight_${no}`}>
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
        <tr key={`arcAngle_${index + 1}-${index + 2}`}>
          <th>弯头{index + 1}-{index + 2}斜势</th>
          <th>
            {radianFormat(v, style.degreeFormat, style.radianRoundDigits)}
          </th>
        </tr>
        ))
      }
      <tr key={'totalLength'}>
        <th>展开长度</th>
        <th>{bendedPipe.totalLength().toFixed(style.lengthRoundDigits)}</th>
      </tr>
    </tbody>
  );                    
}

function ErrorsUI(props: { errors: Array<GeometryError> }) {
  const errors = props.errors;

  return (
    <Stack>
      <h2>错误记录</h2>
      <ListGroup>
      {
        errors.map(e => (
          <ListGroup.Item variant="danger"><span>[{e.date.toLocaleString()}]</span> {e.message}</ListGroup.Item>
        ))
      }
      </ListGroup>
    </Stack>
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
      <Stack gap={3}>
      <Button variant="outline-secondary" onClick={() => props.handlePointReinitialize()}>重置</Button>
      {points.map((point, index) => (
        <Stack gap={1}>
          <Stack direction="horizontal" gap={3}>
            <InputGroup className='mb-3'>
              <InputGroup.Text id={`point_${index}_coord`}>{`#${index + 1}`}</InputGroup.Text>
              <Form.Control
                type="number"
                value={point.x}
                onChange={(e) => props.handlePointChange(index, 'x', parseFloat(e.target.value))}
              />
              <Form.Control
                type="number"
                value={point.y}
                onChange={(e) => props.handlePointChange(index, 'y', parseFloat(e.target.value))}
              />
              <Form.Control
                type="number"
                value={point.z}
                onChange={(e) => props.handlePointChange(index, 'z', parseFloat(e.target.value))}
              />
              <Button variant="outline-secondary" onClick={() => props.handlePointReset(index)}>归零</Button>
            </InputGroup>
            <Button variant="outline-danger" onClick={() => props.handlePointDelete(index)}>删除</Button>
          </Stack>
          <InputGroup>
              <Button variant="outline-secondary" onClick={() => props.handlePointInsert(index)}>插入</Button>
          </InputGroup>
        </Stack>
      ))}
      </Stack>
    </div>);
}

function PipeUI(props: { bendedPipe: BendedPipe | null, displayStyle: DisplayStyle }) {
  const bendedPipe = props.bendedPipe;
  const displayStyle = props.displayStyle;
  
  return (
    <Stack>
      <h2>计算结果</h2>
      <Table striped bordered>
        <thead>
          <tr key='result-header'>
            <th>项目</th>
            <th>取值</th>
          </tr>
        </thead>
        {bendedPipe !== null ? <CalculateResultUI result={bendedPipe} style={displayStyle} /> : null}
      </Table>
    </Stack>);
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
          <Stack gap={3}>
          <InputGroup className='mb-3'>
            <InputGroup.Text>弯管半径</InputGroup.Text>
            <Form.Control
              type="number"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
            />
          </InputGroup>
          <InputGroup className='mb-3'>
            <InputGroup.Text>角度格式</InputGroup.Text>
            {
              Object.keys(DegreeDisplayFormat).map(k => {
                const v = DegreeDisplayFormat[k as keyof typeof DegreeDisplayFormat];
                return (
                  <Form.Check
                    inline
                    label={v}
                    name='radianFormatGroup'
                    type='radio'
                    defaultChecked={v === DegreeDisplayFormat.Format1} 
                    id={`radianFormatGroup-${v}`}
                    onChange={() => handleDegreeFormatChange(v)} />
                );
              })
            }
          </InputGroup>
          <Button onClick={() => handleCalculate(points, radius)}>计算</Button>
          </Stack>
        </Col>
      </Row>
      <Row>
        <ErrorsUI errors={errors} />
      </Row>
    </Container>
  );
};

export default PipeBender;
