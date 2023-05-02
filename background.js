// Copyright (C) 2023 awadatekon
// SPDX-License-Identifier: GPL-3.0-or-later

function responseListener(message, sender, sendResponse) {
  if (message.type === 'copyResult') {
    if (message.data.success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Data copied',
        message: message.data.message || 'データをクリップボードにコピーしました',
      });
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Error',
        message: 'このページから情報を見つけ出せませんでした',
      });
    }
  } else if (message.type === 'websiteNotFound') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Website Not Found',
      message: 'このページには対応していません'
    });
  }
  // リスナーを削除
  chrome.runtime.onMessage.removeListener(responseListener);
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'copy') {
    chrome.scripting.executeScript(
      {
        target: { tabId: message.tabId },
        files: ['contentScript.js'],
      },
      (results) => {
        chrome.tabs.sendMessage(message.tabId, { type: 'startCopyProcess' });

        chrome.runtime.onMessage.addListener(responseListener);
      }
    );
    return true; //非同期応答に必要
  }
});

