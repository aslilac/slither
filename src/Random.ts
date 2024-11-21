/**
 * @returns an interger within the range [min, max).
 */
export function inRange(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

/**
 * @returns an item from the given options
 */
export function fromArray<T>(it: T[]): T {
	return it[inRange(0, it.length)];
}
