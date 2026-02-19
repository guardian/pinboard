// FIXME do this after page load

// TODO consider rendering the iframe with Svelte so all loader does is mount svelte

const iFrame = document.createElement("iframe");
iFrame.style.position = "fixed";
iFrame.style.top = "0";
iFrame.style.left = "50%";
iFrame.style.transform = "translateX(-50%)";
iFrame.style.zIndex = "9999";
iFrame.style.border = "none";
iFrame.style.width = "40vw";
iFrame.style.height = "30vh";
iFrame.style.visibility = "hidden"; // initially hidden, will be shown when we receive a message from the iframe
iFrame.src = "https://staff-notifications.local.dev-gutools.co.uk"; //TODO calculate from location.href (like in pinboard)
document.body.appendChild(iFrame);

// TODO listen for message from the iframe to determine visibility of iframe
