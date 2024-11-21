import Directions from "./Directions.ts";
import Point from "./Point.ts";

export class GestureController extends EventTarget {
	static NONE = new Point(0, 0);
	NONE = GestureController.NONE;

	#initialPoint: Point | null = null;

	#onTouchStart = (event: TouchEvent) => {
		event.preventDefault();

		this.#initialPoint = new Point(
			event.touches[0].clientX,
			event.touches[0].clientY,
		);
	};

	#onTouchMove = (event: TouchEvent) => {
		if (!this.#initialPoint) {
			return;
		}

		event.preventDefault();
	};

	#onTouchEnd = (event: TouchEvent) => {
		if (!this.#initialPoint) {
			return;
		}

		event.preventDefault();

		const diff = new Point(
			event.changedTouches[0].clientX,
			event.changedTouches[0].clientY,
		).sub(this.#initialPoint);

		// Didn't move far enough to count as any direction
		if (Math.hypot(diff.x, diff.y) < 25) {
			this.dispatchEvent(new GestureEvent(this.NONE));
			return;
		}

		if (Math.abs(diff.x) > Math.abs(diff.y)) {
			if (diff.x > 0) {
				this.dispatchEvent(new GestureEvent(Directions.RIGHT));
			} else {
				this.dispatchEvent(new GestureEvent(Directions.LEFT));
			}
		} else {
			if (diff.y > 0) {
				this.dispatchEvent(new GestureEvent(Directions.DOWN));
			} else {
				this.dispatchEvent(new GestureEvent(Directions.UP));
			}
		}
	};

	#onKeyDown = (event: KeyboardEvent) => {
		if (event.altKey || event.metaKey || event.ctrlKey) {
			return;
		}

		switch (event.key) {
			case " ":
				event.preventDefault();
				this.dispatchEvent(new GestureEvent(this.NONE));
				break;
			case "ArrowLeft":
			case "A":
			case "a":
				event.preventDefault();
				this.dispatchEvent(new GestureEvent(Directions.LEFT));
				break;
			case "ArrowUp":
			case "W":
			case "w":
				event.preventDefault();
				this.dispatchEvent(new GestureEvent(Directions.UP));
				break;
			case "ArrowRight":
			case "D":
			case "d":
				event.preventDefault();
				this.dispatchEvent(new GestureEvent(Directions.RIGHT));
				break;
			case "ArrowDown":
			case "S":
			case "s":
				event.preventDefault();
				this.dispatchEvent(new GestureEvent(Directions.DOWN));
				break;
		}
	};

	#onClick = (event: MouseEvent) => {
		event.preventDefault();

		this.dispatchEvent(new GestureEvent(this.NONE));
	};

	constructor() {
		super();

		window.addEventListener("touchstart", this.#onTouchStart);
		window.addEventListener("touchmove", this.#onTouchMove);
		window.addEventListener("touchend", this.#onTouchEnd);
		window.addEventListener("keydown", this.#onKeyDown);
		window.addEventListener("click", this.#onClick);
	}

	[Symbol.dispose]() {
		window.removeEventListener("touchstart", this.#onTouchStart);
		window.removeEventListener("touchmove", this.#onTouchMove);
		window.removeEventListener("touchend", this.#onTouchEnd);
		window.removeEventListener("keydown", this.#onKeyDown);
		window.removeEventListener("click", this.#onClick);
	}

	// This is a pretty lame way to use `EventTarget` while still having
	// "type-safety" (in as much as you can have type safety when casting things
	// under the hood).
	onGesture(eventHandler: (event: GestureEvent) => void) {
		this.addEventListener("gesture", eventHandler as (event: Event) => void);
	}
}

export class GestureEvent extends Event {
	constructor(public readonly direction: Point) {
		super("gesture");
	}
}
