import Directions from "./Directions.ts";
import { GestureController } from "./GestureController.ts";
import Point from "./Point.ts";
import * as Random from "./Random.ts";

type SnakeOptions = {
	gridSize: number;
	speed: number;
	canvas: HTMLCanvasElement;
};

export default class Snake {
	#options: SnakeOptions;
	#center: Point;
	#frameTime: number;
	#paddingSize: number;
	#squareSize: number;

	#snakeColor!: string;
	#nibbleColor!: string;

	#timer: ReturnType<typeof setInterval> | null = null;

	#ctx: CanvasRenderingContext2D;
	#gestureController: GestureController;
	#resizeObserver: ResizeObserver;

	#direction!: Point;
	#snake!: Point[];
	#nibble!: Point;

	constructor(options: SnakeOptions) {
		if (options.gridSize <= 3) {
			throw new RangeError("gridSize is too small");
		}
		if (options.gridSize % 2 !== 1) {
			throw new RangeError("gridSize must be odd");
		}
		if (options.speed < 1) {
			throw new RangeError("speed is too low");
		}
		if (!(options.canvas instanceof HTMLCanvasElement)) {
			throw new TypeError("canvas is not an HTMLCanvasElement");
		}

		this.#options = options;
		const middle = Math.floor(options.gridSize / 2);
		this.#center = new Point(middle, middle);
		this.#frameTime = 1000 / this.#options.speed;
		const paddingFr = 1;
		const squareFr = 5;
		const fr =
			100 / (this.#options.gridSize * (squareFr + paddingFr) + paddingFr);
		this.#paddingSize = paddingFr * fr;
		this.#squareSize = squareFr * fr;

		this.#ctx = options.canvas.getContext("2d")!;
		this.#gestureController = new GestureController();
		this.#gestureController.onGesture((event) => {
			if (event.direction === GestureController.NONE) {
				this.#togglePause();
				return;
			}

			this.#changeDirection(event.direction);
		});
		this.#resizeObserver = new ResizeObserver(() => {
			this.#refresh();
		});
		this.#resizeObserver.observe(options.canvas);

		this.#initialize();
	}

	/**
	 * Leaves {@link | Snake} in an invalid state.
	 */
	[Symbol.dispose]() {
		if (this.#timer != null) {
			clearInterval(this.#timer);
			this.#timer = null;
		}

		this.#gestureController[Symbol.dispose]();
		this.#resizeObserver.disconnect();
	}

	#initialize() {
		if (this.#timer != null) {
			clearInterval(this.#timer);
			this.#timer = null;
		}

		const style = getComputedStyle(this.#options.canvas);
		this.#snakeColor = style.getPropertyValue("--snake-color");
		this.#nibbleColor = style.getPropertyValue("--nibble-color");

		this.#direction = this.#pickRandomDirection();
		this.#snake = this.#findFreshSnake();
		this.#nibble = this.#placeRandomNibble();
		this.#refresh();
	}

	#refresh() {
		// Reset the canvas
		this.#ctx.reset();

		// Configure canvas scaling
		const canvas = this.#options.canvas;
		const bounds = canvas.getBoundingClientRect();
		const physicalWidth = bounds.width * window.devicePixelRatio;
		const physicalHeight = bounds.height * window.devicePixelRatio;
		canvas.width = physicalWidth;
		canvas.height = physicalHeight;

		this.#ctx.scale(physicalWidth / 100, physicalHeight / 100);

		// Draw everything onto the canvas
		this.#drawNibble();
		this.#drawSnake();
	}

	#drawSquare(point: Point, fillStyle: CanvasRenderingContext2D["fillStyle"]) {
		this.#ctx.fillStyle = fillStyle;
		const origin = new Point(
			point.x * (this.#squareSize + this.#paddingSize) + this.#paddingSize,
			point.y * (this.#squareSize + this.#paddingSize) + this.#paddingSize,
		);
		this.#ctx.fillRect(origin.x, origin.y, this.#squareSize, this.#squareSize);
	}

	#eraseSquare(point: Point) {
		const origin = new Point(
			point.x * (this.#squareSize + this.#paddingSize) + this.#paddingSize,
			point.y * (this.#squareSize + this.#paddingSize) + this.#paddingSize,
		);
		// Draw a slightly too big square to avoid some fringing issues.
		this.#ctx.clearRect(
			origin.x - this.#paddingSize / 2,
			origin.y - this.#paddingSize / 2,
			this.#squareSize + this.#paddingSize,
			this.#squareSize + this.#paddingSize,
		);
	}

	#drawNibble() {
		this.#drawSquare(this.#nibble, this.#nibbleColor);
	}

	#drawSnake() {
		for (const bit of this.#snake) {
			this.#drawSquare(bit, this.#snakeColor);
		}
	}

	#pickRandomDirection(): Point {
		return Random.fromArray(Object.values(Directions));
	}

	#findFreshSnake(): Point[] {
		return [
			this.#center.sub(this.#direction),
			this.#center,
			this.#center.add(this.#direction),
		];
	}

	#placeRandomNibble(): Point {
		let nibble: Point;
		let collides: boolean;
		// This is
		do {
			nibble = new Point(
				Random.inRange(0, this.#options.gridSize),
				Random.inRange(0, this.#options.gridSize),
			);
			collides = this.#snake.some(
				(bit) => bit.x === nibble.x && bit.y === nibble.y,
			);
		} while (collides);
		return nibble;
	}

	#togglePause() {
		if (this.#timer != null) {
			clearInterval(this.#timer);
			this.#timer = null;
		} else {
			this.#timer = setInterval(() => this.#update(), this.#frameTime);
		}
	}

	#update() {
		// Add the direction magnitude to the snakes head to determine the next tile
		// position logically and on the screen.
		const nextTile = this.#snake.at(-1)!.add(this.#direction);

		// If the head will be touching any other pieces once it moves, or if you
		// went over the edge, then you died, and we should restart.
		const overlap = this.#snake.some(
			(bit) => bit.x === nextTile.x && bit.y === nextTile.y,
		);
		if (
			overlap ||
			nextTile.x < 0 ||
			nextTile.y < 0 ||
			Math.max(nextTile.x, nextTile.y) >= this.#options.gridSize
		) {
			return this.#initialize();
		}

		// We didn't die, so move the snake and draw the head.
		this.#snake.push(nextTile);
		this.#drawSquare(nextTile, this.#snakeColor);

		const ateTheNibble =
			nextTile.x === this.#nibble.x && nextTile.y === this.#nibble.y;

		// If the snakes head is on the nibble, don't draw over the tail for one
		// frame, so that it will be one tile longer. If we didn't eat the nibble,
		// then we shift the snake forward.
		if (ateTheNibble) {
			this.#nibble = this.#placeRandomNibble();
			this.#drawNibble();
		} else {
			this.#eraseSquare(this.#snake.shift()!);
		}
	}

	#updateImmediately() {
		if (this.#timer != null) {
			clearInterval(this.#timer);
		}

		this.#update();
		this.#timer = setInterval(() => this.#update(), this.#frameTime);
	}

	#changeDirection(direction: Point) {
		// Don't let the snake turn around (and immediately collide with itself)
		if (direction.isInverse(this.#direction)) {
			return;
		}

		this.#direction = direction;
		this.#updateImmediately();
	}
}
