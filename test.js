const promise1 = new Promise((resolve, reject) => {
	setTimeout(() => {
		resolve('foo');
	}, 3000);
});

promise1.then((value) => {
	console.log(value);
	// expected output: "foo"
});

console.log(promise1);