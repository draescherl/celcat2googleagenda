
(async () => {

	const loadEventsPromise = new Promise((resolve, reject) => {
		setTimeout(() => {
			console.log("end");
			resolve();
		}, 3000);
	});
	console.log("before");
	await loadEventsPromise;
	console.log("after");
})();
