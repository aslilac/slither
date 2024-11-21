import Point from "./Point.ts";

const snakeColor = "#edad62";
const backgroundColor = "#fff";
const nibbleColor = "#f79055";

const gridSize = 35;
const speed = 6;
const frameTime = 1000 / speed;
const squarePadding = 100 / (gridSize * 6 + 1); // padding is 1fr, square is 5fr
const squareSize = squarePadding * 5;

let canvas: HTMLCanvasElement;
let _2d: CanvasRenderingContext2D;

let currentGame: ReturnType<typeof setTimeout>;
let snake: Point[];
let direction: Point;
let nibble: Point;

function RNDM_RG(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min) + min);
}

function setup() {
	canvas = document.querySelector("#screen")!;
	_2d = canvas.getContext("2d")!;

	setSize();
	startGame();

	canvas.addEventListener("click", startGame);

	let initialPoint: Point | null = null;

	canvas.addEventListener("touchstart", (event) => {
		event.preventDefault();
		initialPoint = new Point(
			event.touches[0].clientX,
			event.touches[0].clientY,
		);
	});

	canvas.addEventListener("touchmove", (event) => {
		if (currentGame) {
			event.preventDefault();
		}
	});

	canvas.addEventListener("touchend", (event) => {
		event.preventDefault();
		if (!currentGame) {
			space();
			return;
		}

		const diff = new Point(
			event.changedTouches[0].clientX,
			event.changedTouches[0].clientY,
		).sub(initialPoint);

		if (Math.abs(diff.x) > Math.abs(diff.y)) {
			if (diff.x > 50) right();
			else if (diff.x < -50) left();
			else space();
		} else {
			if (diff.y > 50) down();
			else if (diff.y < -50) up();
			else space();
		}
	});
}

function setSize() {
	const dpr = window.devicePixelRatio || 1;
	const bounds = canvas.getBoundingClientRect();

	canvas.width = bounds.width * dpr;
	canvas.height = bounds.height * dpr;

	_2d.scale((bounds.width * dpr) / 100, (bounds.height * dpr) / 100);

	_2d.fillStyle = backgroundColor;
	_2d.fillRect(0, 0, 100, 100);
}

function randomNibble() {
	nibble = new Point(RNDM_RG(0, gridSize), RNDM_RG(0, gridSize));

	const collision = snake.some(
		(pos) => pos.x === nibble.x && pos.y === nibble.y,
	);

	if (collision) return randomNibble();
	drawNibble();
}

function drawNibble() {
	const nibblePosition = new Point(
		nibble.x * (squareSize + squarePadding),
		nibble.y * (squareSize + squarePadding),
	);

	_2d.fillStyle = nibbleColor;
	_2d.fillRect(
		nibblePosition.x + squarePadding,
		nibblePosition.y + squarePadding,
		squareSize,
		squareSize,
	);
}

function drawSnake() {
	for (const bit of snake) {
		const nextTilePosition = new Point(
			bit.x * (squareSize + squarePadding),
			bit.y * (squareSize + squarePadding),
		);

		_2d.fillStyle = snakeColor;
		_2d.fillRect(
			nextTilePosition.x + squarePadding,
			nextTilePosition.y + squarePadding,
			squareSize,
			squareSize,
		);
	}
}

function startGame() {
	// Handle pausing
	if (snake) {
		if (currentGame) {
			document.body.style.overflow = "unset";
			clearInterval(currentGame);
			currentGame = null;
		} else {
			document.body.style.overflow = "hidden";
			currentGame = setInterval(update, frameTime);
		}
		return;
	}

	// Game setup
	const middle = Math.floor(gridSize / 2);
	const center = new Point(middle, middle);

	// Draw the background
	_2d.fillStyle = backgroundColor;
	_2d.fillRect(0, 0, 100, 100);

	// Create and draw the snake
	direction = [
		new Point(1, 0),
		new Point(-1, 0),
		new Point(0, 1),
		new Point(0, -1),
	][RNDM_RG(0, 4)];
	snake = [center.add(direction), center, center.sub(direction)];
	drawSnake();

	// Draw the nibble
	randomNibble();
}

function update() {
	// Add the direction magnitude to the snakes head to determine the next tile
	// position logically and on the screen.
	const nextTile = snake[0].add(direction);
	const nextTilePosition = new Point(
		nextTile.x * (squareSize + squarePadding),
		nextTile.y * (squareSize + squarePadding),
	);
	let ateTheNibble = false;

	// If the snakes head is on the nibble, don't draw over the tail for one
	// frame, so that it will be one tile longer. If we didn't eat the nibble, we
	// want to pop the tail off so that we don't report overlap when there shouldn't
	// actually be any.
	if (nextTile.x === nibble.x && nextTile.y === nibble.y) {
		ateTheNibble = true;
	} else {
		const oldTile = snake.pop()!;
		const oldTilePosition = new Point(
			oldTile.x * (squareSize + squarePadding),
			oldTile.y * (squareSize + squarePadding),
		);

		_2d.fillStyle = backgroundColor;
		_2d.fillRect(
			oldTilePosition.x + squarePadding / 2,
			oldTilePosition.y + squarePadding / 2,
			squareSize + squarePadding,
			squareSize + squarePadding,
		);
	}

	// If the head will be touching any other pieces once it moves..
	const overlap = snake.some(
		(coords) => coords.x === nextTile.x && coords.y === nextTile.y,
	);
	// ..or if you went over the edge, then you died! Restarting!
	if (
		overlap ||
		nextTile.x >= gridSize ||
		nextTile.x < 0 ||
		nextTile.y >= gridSize ||
		nextTile.y < 0
	) {
		clearInterval(currentGame);
		snake = currentGame = null;

		return startGame();
	}

	// We didn't die, so move the snake and draw the head
	snake.unshift(nextTile);
	_2d.fillStyle = snakeColor;
	_2d.fillRect(
		nextTilePosition.x + squarePadding,
		nextTilePosition.y + squarePadding,
		squareSize,
		squareSize,
	);

	// Now that the snakes collision map is finalized for the frame, we can
	// safely place the nibble.
	if (ateTheNibble) randomNibble();
}

function immediateUpdate() {
	clearInterval(currentGame);
	update();
	currentGame = setInterval(update, frameTime);
}

function space() {
	startGame();
}

function up() {
	direction = new Point(0, -1);
	immediateUpdate();
}

function down() {
	direction = new Point(0, 1);
	immediateUpdate();
}

function left() {
	direction = new Point(-1, 0);
	immediateUpdate();
}

function right() {
	direction = new Point(1, 0);
	immediateUpdate();
}

window.addEventListener("DOMContentLoaded", setup);
window.addEventListener("resize", () => {
	setSize();
	drawSnake();
	drawNibble();
});

window.addEventListener("keydown", (event) => {
	if (event.key === " ") {
		space();
		event.preventDefault();
		return false;
	}

	if (currentGame) {
		switch (event.key) {
			case " ":
				space();
				break;
			case "ArrowLeft":
			case "A":
			case "a":
				left();
				break;
			case "ArrowUp":
			case "W":
			case "w":
				up();
				break;
			case "ArrowRight":
			case "D":
			case "d":
				right();
				break;
			case "ArrowDown":
			case "S":
			case "s":
				down();
				break;
		}

		event.preventDefault();
		return false;
	}
});
