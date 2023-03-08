function forwardMessage(message) {	
	id = message.data;
	//console.error("data received: " + id[1]);
	window.addEventListener("message", function() {
		//console.error("received request");
		if (event.data === "ready") {
			document.getElementById("embed").contentWindow.postMessage(id,  event.origin);
		}
	}, false);
}

(async () => {
	const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
	const response = await chrome.tabs.sendMessage(tab.id, {instructions: "Requesting identification"});
	//console.error(response.data);
	forwardMessage(response);
})();