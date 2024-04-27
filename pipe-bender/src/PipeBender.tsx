import React, { useState } from 'react';
import './PipeBender.css';
import { Vec3 } from 'vec3';

interface RoundedBend
{
  center: Vec3;
  start: Vec3;
  end: Vec3;
  centralAngle: number;
  radius: number;
}

function calcRoundedBend(points: [Vec3, Vec3, Vec3], radius: number) {
  const p0 = points[0];
  const p1 = points[2];
  const p = points[1];
  
  const v0 = p0.clone().subtract(p).normalize();
  const v1 = p1.clone().subtract(p).normalize();
  const h = v0.clone().add(v1).normalize();

  const cosTheta = h.innerProduct(v0.clone().normalize());
  const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
  const t = radius / sinTheta;

  const center = p.clone().add(h.clone().scale(t));
  const centralAngle = Math.acos(cosTheta) * 2;
  const start = p.clone().add(v0.clone().scale(cosTheta * t));
  const end = p.clone().add(v1.clone().scale(cosTheta * t));

  let result: RoundedBend = { center: center, start: start, end: end, centralAngle: centralAngle, radius: radius };
  return result;
}

function PipeBender() {
  const [points, setPoints] = useState<Vec3[]>([new Vec3(0, 0, 0), new Vec3(0, 0, -900), new Vec3(300, 1000, -300), new Vec3(300, 2000, -300)]);
  const [parameters, setParameters] = useState<{ radius: number; degreeFormat: 'radius' | 'degree' }>({
    radius: 200,
    degreeFormat: 'radius',
  });
  const [tableData, setTableData] = useState<{ name: string; value: string }[]>(Array.from(Array(10), () => ({ name: '', value: '' })));

  const handlePointChange = (index: number, field: keyof typeof points[0], value: number) => {
    const updatedPoints = [...points];
    // updatedPoints[index][field] = value;
    setPoints(updatedPoints);
  };

  const handleParameterChange = (field: keyof typeof parameters, value: number | 'radius' | 'degree') => {
    setParameters({ ...parameters, [field]: value });
  };

  const handleTableChange = (index: number, field: keyof typeof tableData[0], value: string) => {
    const updatedTableData = [...tableData];
    updatedTableData[index][field] = value;
    setTableData(updatedTableData);
  };

  const handleCalculate = (points: Vec3[], radius: number) => {
    // Perform calculation
    const bend = calcRoundedBend([ points[0], points[1], points[2]], parameters.radius);
    console.log(bend.centralAngle);
  };

  const handleSave = () => {
    // Save data
  };

  return (
    <div>
      <div className="panel">
        <h2>空间点</h2>
        <table>
          <tr>
            <th>No.</th>
            <th>X</th>
            <th>Y</th>
            <th>Z</th>
          </tr>
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
        </table>
      </div>
      <div className="panel">
        <h2>计算结果</h2>
        <table>
          <thead>
            <tr>
              <th>项目</th>
              <th>数值</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleTableChange(index, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleTableChange(index, 'value', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <div>
          弯管半径:
          <input
            type="number"
            value={parameters.radius}
            onChange={(e) => handleParameterChange('radius', parseFloat(e.target.value))}
          />
        </div>
        <div>
          角度格式
          <select
            value={parameters.degreeFormat}
            onChange={(e) => handleParameterChange('degreeFormat', e.target.value as 'radius' | 'degree')}
          >
            <option value="radius">Radius</option>
            <option value="degree">Degree</option>
          </select>
        </div>
        <h2>Operators</h2>
        <button onClick={() => handleCalculate(points, parameters.radius)}>Calculate</button>
        <button onClick={handleSave}>Save</button>
      </div>
      <div className="panel">
        <h2>Execution</h2>
        <button onClick={() => handleCalculate(points, parameters.radius)}>Calculate</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default PipeBender;
