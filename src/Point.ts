export default class Point {
	constructor(
		readonly x: number,
		readonly y: number,
	) {}

	add(other: Point) {
		return new Point(this.x + other.x, this.y + other.y);
	}

	sub(other: Point) {
		return new Point(this.x - other.x, this.y - other.y);
	}
}
