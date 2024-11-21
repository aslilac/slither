/**
 * @returns an interger within the range [min, max).
 */
export function inRange(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}
