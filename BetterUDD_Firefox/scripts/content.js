const server = "https://duckstatus.elementfx.com"
const serviceName = "BetterUDD"
const ALLOWED_URL = "https://u.dordt.edu";

function createStatusDiv(statusInfo, type) {
	var node = document.createElement("div");
	if (type == 0) node.classList = "field field-name-field-status field-type-number-integer field-label-inline clearfix";
	if (type == 1) node.classList = "field field-name-field-status field-type-number-integer field-label-hidden";
	node.lang = "en-us";
	
	var nodeLabel = document.createElement("div");
	nodeLabel.classList = "field-label";
	nodeLabel.innerHTML = "Relationship Status:&nbsp;";
	node.appendChild(nodeLabel);
	
	var nodeStatusShell = document.createElement("div");
	nodeStatusShell.classList = "field-items";
	
	var nodeStatus = document.createElement("div");
	nodeStatus.classList = "field-item even";
	
	var span = document.createElement("span");
	span.classList = "entityreference-no-link";
	span.innerHTML = statusInfo;
	nodeStatus.appendChild(span);
	
	nodeStatusShell.appendChild(nodeStatus);
	node.appendChild(nodeStatusShell);
	
	return node;
}

function processResults(response) {
	if (response == "noAuthorization" || response == "badAuthorization") {
		return 0;
	} else {
		var responseArray = response.split("\n")
		var profiles = document.getElementsByClassName("profile");
		for (var i = 0; i < profiles.length; i++) {
			var person = responseArray[i].split(",");
			if (person[2] != "" && profiles[i].getElementsByClassName("field-group-div")[1] != null) {
				//console.log("Student Element Found");
				var div = profiles[i].getElementsByClassName("field-group-div")[1];
				var newStatusDiv = createStatusDiv(person[2], 0);
				div.appendChild(newStatusDiv);
			} else if (person[2] != "" && profiles[i].getElementsByClassName("user-details-region")[0] != null) {
				//console.log("Small Element Found");
				var div = profiles[i].getElementsByClassName("user-details-region");
				var newStatusDiv = createStatusDiv(person[2], 1);
				div.appendChild(newStatusDiv);
			}
			
			if (person[2] != "") {
				var mail = profiles[i].getElementsByClassName("user-mail")[0];
				var notification = document.createElement("div");
				notification.classList = "user-note";
				notification.innerHTML = "This person uses " + serviceName;
				notification.style.color= "green";
				mail.appendChild(notification);
			}
		}
	}
}

function getID() {
	let id = [null, null];
	const identity = document.getElementsByClassName("pull-left");
	//console.log("identity: " + identity);
	for (let i = 0; i < identity.length; i++) {
		//console.log("identity " + i + ": " + identity[i] + ", nodeName: " + identity[i].nodeName + ", className: " + identity[i].className);
		if (identity[i].nodeName == "DIV") {
			if (identity[i].className.includes("user-thumbnail-wrapper")) {
				//console.log("child: " + identity[i].firstChild);
				//console.log()
				id[0] = identity[i].firstChild.nextElementSibling.src.trim();
				//console.log(id[0]);
			} else if (identity[i].className.includes("user-name")) {
				id[1] = identity[i].innerHTML.trim();
				//console.log(id[1]);
			}
		}
	} //end of outer loop
	return id;
}

//main
browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		/*console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension"
		);*/
		if (request.instructions === "Requesting identification") {
			let url = window.document.URL;
			if (url.includes(ALLOWED_URL)) {
				id = getID();			
				if (id[0] == null && id[1] == null) {
					//console.log("Error. Identity could not be verified.");
					return 0;
				} else {
					sendResponse({data: id});
					//console.log("Reply Sent");
				}
				//console.log("Name: " + id[1] + " ID: " + id[0]);
			}
		}
	}
);
//browser.runtime.onMessage.addListener(receiveMessage);
//console.log("Event Listener Added");

window.onload = function() {
	let url = window.document.URL;
	if (url.includes(ALLOWED_URL)) {
		var id = getID();
		if (id[0] != null && id[1] != null) {
			var profiles = document.getElementsByClassName("profile");
			//console.log(profiles[0]);
			if (profiles[0] != null) {
				var message = "";
				for (var i = 0; i < profiles.length; i++) {
					if (i != 0) message += "\n";
					if (profiles[i].getElementsByClassName("img-responsive")[0] != null) {
						message += profiles[i].getElementsByClassName("img-responsive")[0].src.trim();
					} else {
						message += "";
					}
					message += ",";
					message += profiles[i].getElementsByClassName("user-name")[0].innerHTML.trim();
				}		
				//console.log(message);
			}
			
			var xhr = new XMLHttpRequest();
			var address = server + "/php/processProfiles.php";
			xhr.open("POST", address, true);
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			
			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4 && xhr.status == 200) {
					//console.log(xhr.responseText);
					processResults(xhr.responseText);
				}
			};
			xhr.send("profiles="+message+"&id="+id);
		}
	}
}