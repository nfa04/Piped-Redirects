window.browser = window.browser || window.chrome;

const instanceSelector = document.getElementById("PIPED_INSTANCES");
const statusBtn = document.getElementById("STATUS_BTN");

var isDisabled = false;

function updateStatus(disabled) {
    if(!disabled) {
        statusBtn.style.opacity = "1";
    } else {
        statusBtn.style.opacity = "0.4";
    }
}

// Read settings from local storage
browser.storage.local.get().then(localStorage => {
     // Set instances
     localStorage.instances.forEach(instance => {
        let instanceOption = document.createElement("option");
        instanceOption.innerText = instance.trim();
        instanceOption.value = "piped." + instance.replace("(Official)", "").trim();
        console.log(instance.replace("(Official)").trim());
        instanceSelector.appendChild(instanceOption);
    });

    // check if redirections are disabled
    if(localStorage.disabled) {
        updateStatus(true);
        isDisabled = true;
    }
    // select correct instance according to settings
    if(typeof localStorage.instance != "undefined") {
        instanceSelector.value = localStorage.instance;
    } else instanceSelector.value = "piped.video";
});

statusBtn.addEventListener("click", () => {
        isDisabled = !isDisabled;
        updateStatus(isDisabled);
        browser.runtime.sendMessage({
            action: "statusChanged",
            value: isDisabled
        });
        browser.storage.local.set({disabled: isDisabled});
});

instanceSelector.addEventListener("change", () => {
    browser.runtime.sendMessage({
        action: "instanceChanged",
        value: instanceSelector.value
    });
    //console.log(instanceSelector.value);
    browser.storage.local.set({instance: instanceSelector.value});
});