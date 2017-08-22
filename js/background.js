chrome.browserAction.onClicked.addListener((tab) =>
  chrome.tabs.create({ url: 'chromeiql.html' })
);
