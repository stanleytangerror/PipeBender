import { Vec3 } from 'vec3';

enum GeometryConst {
  Eps = 1e-10
}

export function radianToDegree(radian: number) {
  return radian / Math.PI * 180;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
      throw new Error(message);
  }
}

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

  perpendicular() {
    const dir0 = this.start.clone().subtract(this.center);
    const dir1 = this.end.clone().subtract(this.center);
    return dir0.clone().cross(dir1).normalize();
  }
}

export class Segment
{
  start: Vec3;
  end: Vec3;
  dirRough: Vec3;

  constructor(start: Vec3, end: Vec3) {
    this.start = start;
    this.end = end;
    this.dirRough = end.clone().subtract(start);

    assert(this.start.clone().distanceSquared(this.end) > GeometryConst.Eps ** 2, `Points too close: ${this.start}, ${this.end} `);
  }

  length() {
    return this.start.clone().distanceTo(this.end);
  }
}

export class BendedPipe
{
  segments: Array<Segment>;
  arcs: Array<Arc>;

  constructor(segments: Array<Segment>, arcs: Array<Arc>) {
    this.segments = segments;
    this.arcs = arcs;
  }

  totalLength() {
    return this.segments.map(p => p.length()).reduce((acc, v) => acc + v, 0) 
        + this.arcs.map(p => p.length()).reduce((acc, v) => acc + v, 0);
  }
}

export function range(start: number, end: number) {
  const gen = function*(start: number, end: number): Iterable<number> {
    for (let i = start; i < end; ++i) yield i;
  };
  return Array.from(gen(start, end));
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
  
  const arcs = range(1, points.length - 1)
    .map(i => calcCurve([points[i - 1], points[i], points[i + 1]], radius));

  const segments = range(0, points.length - 1)
    .map((_, i) => new Segment(points[i], points[i + 1]));
  segments
    .forEach((s, i) => {
      if (i < arcs.length) {
        s.end = arcs[i].start;
      } 
      if (i > 0) {
        s.start = arcs[i - 1].end;
      }
    });
  
  return new BendedPipe(segments, arcs);
}

export function calcArcsAngle(arcs: [Arc, Arc]) {
  const dir0 = arcs[0].perpendicular();
  const dir1 = arcs[1].perpendicular();

  const angle = Math.acos(dir0.innerProduct(dir1));
  return Math.min(Math.PI - angle, angle);
}