window.browser = window.browser || window.chrome;

const INVIDIOUS_INSTANCES = [];

// Those are the default settings and also required as reading from local storage before deciding on whether to reject the request appears to be too slow
var activeInstance = "piped.video";
var redirectDisabled = false;

// Reading settings from local storage on startup
browser.storage.local.get().then(localStorage => {
	if(localStorage.disabled) redirectDisabled = true;
	if(typeof localStorage.instance != "undefined") activeInstance = localStorage.instance;
});

// Instance decoding from api docs and put in local storage for ui to retrieve when loading
fetch("https://raw.githubusercontent.com/wiki/TeamPiped/Piped-Frontend/Instances.md")
.then(resp => resp.text())
.then(body => {
	var instances = [];
    let lines = body.split("\n");
    lines.map(line => {
        let split = line.split("|");
        if(split.length == 5 && split[0].indexOf(" libre") == -1) {
            instances.push(split[0]);
        }
    });
	browser.storage.local.set({instances: instances.slice(2)});
});

// Fetching invidious instances and redirecting
fetch("https://api.invidious.io/instances.json")
	.then((resp) => resp.json())
	.then((array) => array.forEach((json) => INVIDIOUS_INSTANCES.push(json[0])));
	browser.webRequest.onBeforeRequest.addListener(
		(details) => {
				if(!redirectDisabled) {
					const url = new URL(details.url);
					if (url.hostname.endsWith("youtu.be") && url.pathname.length > 1) {
						return { redirectUrl: "https://" + activeInstance + "/watch?v=" + url.pathname.substr(1) };
					}
					if (
						url.hostname.endsWith("youtube.com") ||
						url.hostname.endsWith("youtube-nocookie.com") ||
						INVIDIOUS_INSTANCES.includes(url.hostname)
					) {
						url.hostname = activeInstance;
						return { redirectUrl: url.href };
					}
				}
	},
	{
		urls: ["<all_urls>"],
	},
	["blocking"],
	);

// Realtime communication needed to stay in sync with user preferences
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.action == "instanceChanged") {
		activeInstance = request.value;
	} else if(request.action == "statusChanged") {
		redirectDisabled = request.value;
	}
});