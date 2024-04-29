import { Vec3 } from 'vec3';

export class Arc
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

export class Segment
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

export interface CalculateResult
{
  segments: Array<[Segment, Arc]>;
  lastSegment: Segment;
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

  let result = new Arc(center, start, end, centralAngle, radius);
  return result;
}

export function calcPipe(points: Array<Vec3>, radius: number) {
  let segments: Array<[Segment, Arc]> = [];
  let totalLength: number = 0;

  let lastCurve: Arc | null = null;
  let lastPoint: Vec3 = points[0];
  
  for (let i : number = 1; i + 1 < points.length; ++i) {
    const curPoint = points[i];
    const nextPoint = points[i + 1];

    const curve = calcCurve([lastPoint, curPoint, nextPoint], radius);
    const straight = new Segment(lastCurve ? lastCurve.end : lastPoint, curve.start);
    segments.push([straight, curve]);
    
    lastCurve = curve;
    lastPoint = curPoint;
    totalLength += straight.length();
    totalLength += curve.length();
  }
  
  let lastSegment = new Segment(lastCurve ? lastCurve.end : lastPoint, points[points.length - 1]);
  totalLength += lastSegment.start.distanceTo(lastSegment.end);

  return { segments: segments, lastSegment: lastSegment, totalLength: totalLength };
}