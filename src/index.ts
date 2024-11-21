import Snake from "./Snake.ts";

window.addEventListener("DOMContentLoaded", () => {
	new Snake({
		gridSize: 35,
		speed: 8,
		canvas: document.querySelector("canvas")!,
	});
});
