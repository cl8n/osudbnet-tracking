export default class Limiter {
	#delayBetween;
	#lastRun = 0;
	#running = [];
	#waiting = [];

	constructor(delayBetween) {
		this.#delayBetween = delayBetween;
	}

	run(job) {
		const id = Symbol();

		return this.#wait(id)
			.then(job)
			.finally(() => this.#end(id));
	}

	#end(hash) {
		const itemIndex = this.#running.findIndex((x) => x.hash === hash);

		if (itemIndex === -1) {
			throw 'Queue desync';
		}

		this.#running.splice(itemIndex, 1)[0].resolve();

		const nextItem = this.#waiting.shift();

		if (nextItem != null) {
			nextItem.resolve();
		}
	}

	async #wait(hash) {
		const item = { hash };

		if (this.#running.length > 0) {
			item.promise = new Promise((resolve) => {
				item.resolve = resolve;
			});

			this.#waiting.push(item);
			await item.promise;
		}

		item.promise = new Promise((resolve) => {
			item.resolve = resolve;
		});

		this.#running.push(item);

		while (Date.now() - this.#lastRun < this.#delayBetween) {
			await new Promise((resolve) =>
				setTimeout(resolve, this.#delayBetween - (Date.now() - this.#lastRun)),
			);
		}

		this.#lastRun = Date.now();
	}
}
