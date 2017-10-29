import EventEmitter from './eventEmitter';

const STATUS = {
	PENDING: 'pending',
	FULFILLED: 'fulfilled',
	REJECTED: 'rejected'
};

const EventType = {
	fulfill: 'fulfill',
	reject: 'reject'
};

function returnValue(value) {
	return value;
}

function isObject(obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
}


function resolveValue(newValue, resolve, reject) {
	if (newValue instanceof PromiseA) {
		newValue.then(resolve, reject);
	} else {
		resolve(newValue);
	}
}


class PromiseA {
	constructor(executor) {
		this.eventEmitter = new EventEmitter();
		this.status = STATUS.PENDING;

		const resolve = (value) => {
			this.resolve(value);
		};
		const reject = (err) => {
			this.reject(err);
		};
		try {
			executor(resolve, reject);
		} catch (err) {
			reject(err);
		}
	}

	resolve(value) {
		if (this.status === STATUS.PENDING) {
			this.status = STATUS.FULFILLED;
			this.resultValue = value;
			this.eventEmitter.trigger(EventType.fulfill, value);
		}
	}

	reject(error) {
		if (this.status === STATUS.PENDING) {
			this.status = STATUS.REJECTED;
			this.resultValue = error;
			this.eventEmitter.trigger(EventType.reject, error);
		}
	}

	then(onResolve, onReject) {
		if (this.status === STATUS.PENDING) {
			return new PromiseA((resolve, reject) => {

				this.eventEmitter.on('fulfill', (value) => {
					try {
						let newValue = onResolve(value);
						resolveValue(newValue, resolve, reject);
					} catch (err) {
						reject(err);
					}
				});

				this.eventEmitter.on('reject', (value) => {
					try {
						let newValue = onReject(value);
						resolveValue(newValue, resolve, reject);
					} catch (err) {
						reject(err);
					}
				});
			});
		}
		if (this.status === STATUS.FULFILLED || this.status === STATUS.REJECTED) {
			return new PromiseA((resolve, reject) => {
				let callback = returnValue;
				if (this.status === STATUS.FULFILLED) {
					callback = onResolve;
				}
				if (this.status === STATUS.REJECTED) {
					callback = onReject;
				}
				try {
					let newValue = callback(this.resultValue);
					resolveValue(newValue, resolve, reject);
				} catch (err) {
					reject(err);
				}
			});
		}
	}

	catch(reject) {
		return this.then(null, reject);
	}

	static all(promiseList = []) {
		return new PromiseA((resolve, reject) => {
			let results = [];
			let len = promiseList.length;
			let resolveCount = 0;

			let resolver = function (index, value) {
				resolveCount++;
				results[index] = value;
				if (resolveCount === len) {
					resolve(results);
				}
			};

			promiseList.forEach((p, i) => {
				if (p instanceof PromiseA) {
					p.then((value) => {
						resolver(i, value);
					}, (err) => {
						reject(err);
					})
				} else {
					resolver(i, p);
				}
			})
		});
	}

	static race(promiseList = []) {
		return new PromiseA((resolve, reject) => {
			promiseList.forEach((p, i) => {
				if (p instanceof PromiseA) {
					p.then((value) => {
						resolve(value);
					}, (err) => {
						reject(err);
					})
				} else {
					resolve(p);
				}
			})
		})
	}

	static resolve(p) {
		if (p instanceof PromiseA) {
			return p;
		}
		if (isObject(p)) {

		}
	}
}


export default PromiseA;