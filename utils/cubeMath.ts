import { Vector3 } from '../types';

/**
 * Rounds a number to the nearest integer to correct floating point drift
 */
export const round = (n: number): number => Math.round(n);

/**
 * Rotates a 3D point around the X axis
 */
export const rotateX = (point: Vector3, angle: number): Vector3 => {
  const [x, y, z] = point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x,
    y * cos - z * sin,
    y * sin + z * cos
  ];
};

/**
 * Rotates a 3D point around the Y axis
 */
export const rotateY = (point: Vector3, angle: number): Vector3 => {
  const [x, y, z] = point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x * cos + z * sin,
    y,
    -x * sin + z * cos
  ];
};

/**
 * Rotates a 3D point around the Z axis
 */
export const rotateZ = (point: Vector3, angle: number): Vector3 => {
  const [x, y, z] = point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x * cos - y * sin,
    x * sin + y * cos,
    z
  ];
};

/**
 * Rounds all components of a vector
 */
export const roundVector = (v: Vector3): Vector3 => [round(v[0]), round(v[1]), round(v[2])];

/**
 * Calculates the new position of a point after a specific move
 * Used to determine arrow direction
 */
export const getRotationResult = (pos: Vector3, axis: 'x' | 'y' | 'z', direction: number): Vector3 => {
    const angle = direction * (Math.PI / 2); // 90 degrees
    let newPos = [...pos] as Vector3;
    
    if (axis === 'x') newPos = rotateX(newPos, angle);
    else if (axis === 'y') newPos = rotateY(newPos, angle);
    else if (axis === 'z') newPos = rotateZ(newPos, angle);
    
    return roundVector(newPos);
}