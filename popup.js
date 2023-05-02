// Copyright (C) 2023 awadatekon
// SPDX-License-Identifier: GPL-3.0-or-later

function loadCustomCopyStyles() {
  return new Promise((resolve) => {
    chrome.storage.local.get('customCopyStyles', (data) => {
      const customCopyStyles = data.customCopyStyles || [];

      const copyStyleSelect = document.getElementById('copyStyle');
      console.log(customCopyStyles)
      customCopyStyles.forEach((style) => {
        const option = document.createElement('option');
        option.value = style.name;
        option.textContent = style.name;
        copyStyleSelect.appendChild(option);
      });
      resolve();
    });
  });
}


document.getElementById('copyButton').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const copyStyle = document.getElementById('copyStyle').value;
  chrome.storage.local.set({ copyStyle: copyStyle }, () => {
    // コピースタイルが保存された後にメッセージを送信する
    chrome.runtime.sendMessage({ type: 'copy', tabId: tab.id }, (result) => {
      const backgroundPage = chrome.extension.getBackgroundPage();
      if (chrome.runtime.lastError) {
        if (backgroundPage) {
          backgroundPage.console.error(chrome.runtime.lastError);
        }
      } else if (result.success) {
        if (backgroundPage) {
          backgroundPage.console.log('Copied to clipboard!');
        }

        if (result.message) {
          if (backgroundPage) {
            backgroundPage.console.log(result.message);
          }
        }
      } else {
        if (backgroundPage) {
          backgroundPage.console.log('This website is not in the database.');
        }
      }
    });
  });
});


document.addEventListener('DOMContentLoaded', async () => {
  await loadCustomCopyStyles();
  // 保存したコピースタイルをローカルストレージからロードし、選択した値として設定
  chrome.storage.local.get('copyStyle', (data) => {
    const copyStyle = data.copyStyle || 'new-line';
    document.getElementById('copyStyle').value = copyStyle;
  });
});


function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    // サポートされている場合、オプションページを開く（Chrome42+）
    chrome.runtime.openOptionsPage();
  } else {
    // フォールバック
    window.open(chrome.runtime.getURL('options.html'));
  }
}

// イベントリスナーを設定アイコンに追加
document.getElementById('settingsIcon').addEventListener('click', openOptionsPage);
