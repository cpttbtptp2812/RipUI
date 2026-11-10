// Chrome Extension Background Service Worker
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_RIPUI' });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-ripui') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_RIPUI' });
      }
    });
  }
});

