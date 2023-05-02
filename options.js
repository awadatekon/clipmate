// Copyright (C) 2023 awadatekon
// SPDX-License-Identifier: GPL-3.0-or-later

function importSettings(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData.websiteInfo) && Array.isArray(importedData.customCopyStyles)) {
          chrome.storage.local.set({ websiteInfo: importedData.websiteInfo }, () => {
          });
          chrome.storage.local.set({ customCopyStyles: importedData.customCopyStyles }, () => {
          });
          
          alert('Settings imported successfully.');
          location.reload();
        } else {
          alert('Invalid file format.');
        }
      } catch (error) {
        alert('Error importing settings: ' + error.message);
      }
    };
    reader.readAsText(file);
  }
}

function exportSettings() {
  chrome.storage.local.get(['websiteInfo', 'customCopyStyles'], (data) => {
    const websiteInfo = data.websiteInfo || [];
    const customCopyStyles = data.customCopyStyles || [];
    const settings = { websiteInfo, customCopyStyles };
    const jsonString = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'web_clipper_settings.json';
    link.click();
    URL.revokeObjectURL(url);
  });
}

function saveWebsiteInfo() {
  const websiteInfoElements = document.querySelectorAll('.website-info-item');
  const websiteInfo = [];

  for (const item of websiteInfoElements) {
    const url = item.querySelector('.website-url').value;
    const elements = {};

    for (const elementInput of item.querySelectorAll('.element-input-container')) {
      const key = elementInput.querySelector('.element-key-input').value;
      const value = elementInput.querySelector('.element-input').value;
      const order = parseInt(elementInput.querySelector('.element-order-input').value, 10) || 0;
      elements[key] = { value, order };
    }

    websiteInfo.push({ url, elements });
  }

  chrome.storage.local.set({ websiteInfo: websiteInfo }, () => {
    alert('Website information saved.');
  });
}


function loadWebsiteInfo() {
  chrome.storage.local.get('websiteInfo', (data) => {
    const websiteInfo = data.websiteInfo || [];

    for (const site of websiteInfo) {
      addWebsiteInfoItem(site);
    }
  });
}

function addWebsiteInfoItem(site = { url: '', elements: {} }) {
  const container = document.createElement('div');
  container.className = 'website-info-item';

  const urlLabel = document.createElement('label');
  urlLabel.textContent = 'URL:';
  container.appendChild(urlLabel);

  const urlInput = document.createElement('input');
  urlInput.className = 'website-url input';
  urlInput.type = 'text';
  urlInput.value = site.url;
  container.appendChild(urlInput);

  container.appendChild(document.createElement('br'));

  const elementsContainer = document.createElement('div');
  elementsContainer.className = 'elements-container';
  container.appendChild(elementsContainer);

  const elementsArray = Object.entries(site.elements).map(([key, valueObj]) => ({
    key,
    value: valueObj.value,
    order: valueObj.order,
  }));

  elementsArray.sort((a, b) => a.order - b.order);

  for (const { key, value, order } of elementsArray) {
    addElementInput(elementsContainer, key, value, order);
  }

  const addElementButton = document.createElement('button');
  addElementButton.className = 'button is-light';
  addElementButton.textContent = '要素を追加';
  addElementButton.addEventListener('click', () => {
    addElementInput(elementsContainer);
  });
  container.appendChild(addElementButton);

  const removeWebsiteButton = document.createElement('button');
  removeWebsiteButton.className = 'button is-light';
  removeWebsiteButton.textContent = 'サイトの設定を削除';
  removeWebsiteButton.addEventListener('click', () => {
    container.remove();
  });
  container.appendChild(removeWebsiteButton);

  document.getElementById('websiteInfo').appendChild(container);
}

function addElementInput(container, key = '', value = '', order = 0) {
  const elementInputContainer = document.createElement('div');
  elementInputContainer.className = 'element-input-container';

  // 既存のよりオーダーより他界ものを設定する
  const existingOrders = Array.from(container.querySelectorAll('.element-order-input'))
    .map((input) => parseInt(input.value, 10));
  const highestOrder = existingOrders.length > 0 ? Math.max(...existingOrders) : 0;
  const orderInput = document.createElement('input');
  orderInput.className = 'element-order-input input';
  orderInput.type = 'number';
  orderInput.min = '0';
  orderInput.placeholder = 'Order';
  orderInput.dataset.key = key;
  orderInput.value = highestOrder + 1;
  orderInput.readOnly = true; // Make the order input read-only
  elementInputContainer.appendChild(orderInput);

  orderInput.addEventListener('input', () => {
    elementValueInput.dataset.order = orderInput.value;
  });

  const elementKeyInput = document.createElement('input');
  elementKeyInput.className = 'element-key-input input';
  elementKeyInput.placeholder = 'Element Name';
  elementKeyInput.dataset.key = key;
  elementKeyInput.value = key;
  elementInputContainer.appendChild(elementKeyInput);

  const elementValueInput = document.createElement('input');
  elementValueInput.className = 'element-input input';
  elementValueInput.placeholder = 'XPath';
  elementValueInput.dataset.key = key;
  elementValueInput.value = value;
  elementInputContainer.appendChild(elementValueInput);

  elementKeyInput.addEventListener('input', () => {
    elementValueInput.dataset.key = elementKeyInput.value;
  });

  const removeElementButton = document.createElement('button');
  removeElementButton.textContent = '-';
  removeElementButton.className = 'button is-light'
  removeElementButton.addEventListener('click', () => {
    elementInputContainer.remove();
  });
  elementInputContainer.appendChild(removeElementButton);

  const moveUpButton = document.createElement('button');
  moveUpButton.className = 'button is-light'
  moveUpButton.textContent = '上へ';
  elementInputContainer.appendChild(moveUpButton);

  const moveDownButton = document.createElement('button');
  moveDownButton.className = 'button is-light'
  moveDownButton.textContent = '下へ';
  elementInputContainer.appendChild(moveDownButton);

  moveUpButton.addEventListener('click', () => {
    const previousElement = elementInputContainer.previousElementSibling;
    if (previousElement) {
      elementInputContainer.parentNode.insertBefore(elementInputContainer, previousElement);

      const tempOrder = orderInput.value;
      orderInput.value = previousElement.querySelector('.element-order-input').value;
      previousElement.querySelector('.element-order-input').value = tempOrder;
    }
  });

  moveDownButton.addEventListener('click', () => {
    const nextElement = elementInputContainer.nextElementSibling;
    if (nextElement) {
      elementInputContainer.parentNode.insertBefore(nextElement, elementInputContainer);

      const tempOrder = orderInput.value;
      orderInput.value = nextElement.querySelector('.element-order-input').value;
      nextElement.querySelector('.element-order-input').value = tempOrder;
    }
  });

  container.appendChild(elementInputContainer);
}


function saveCustomCopyStyle() {
  const customCopyStyleElements = document.querySelectorAll('.custom-copy-style-item');
  const customCopyStyles = [];

  for (const item of customCopyStyleElements) {
    const name = item.querySelector('.custom-copy-style-name-input').value;
    const template = item.querySelector('.custom-copy-style-template-input').value;
    customCopyStyles.push({ name, template });
  }

  chrome.storage.local.set({ customCopyStyles: customCopyStyles }, () => {
    alert('コピースタイルを保存しました');
  });
}

function loadCustomCopyStyles() {
  chrome.storage.local.get('customCopyStyles', (data) => {
    const customCopyStyles = data.customCopyStyles || [];
    for (const customCopyStyle of customCopyStyles) {
      addCustomCopyStyleItem(customCopyStyle);
    }
  });
}

function addCustomCopyStyleItem(customCopyStyle = { name: '', template: '' }) {
  const container = document.createElement('div');
  container.className = 'custom-copy-style-item';

  const nameInput = document.createElement('input');
  nameInput.className = 'custom-copy-style-name-input input';
  nameInput.type = 'text';
  nameInput.value = customCopyStyle.name;
  nameInput.placeholder = 'スタイルの名前';
  container.appendChild(nameInput);

  const templateInput = document.createElement('textarea');
  templateInput.className = 'custom-copy-style-template-input textarea';
  templateInput.value = customCopyStyle.template;
  templateInput.placeholder = '要素名1:{要素名1},要素名2:{要素名2}（改行（\\n），タブ文字（\\t），半角スペース（\\s）のみ使えます）';

  container.appendChild(templateInput);

  const removeCustomStyleButton = document.createElement('button');
  removeCustomStyleButton.textContent = 'カスタムスタイルを削除';
  removeCustomStyleButton.className = 'button is-light'
  removeCustomStyleButton.addEventListener('click', () => {
    container.remove();
  });
  container.appendChild(removeCustomStyleButton);

  document.getElementById('customCopyStyles').appendChild(container);
}


function switchTabs() {
  const websiteConfigurationTab = document.getElementById('tab-website-configuration');
  const customCopyStylesTab = document.getElementById('tab-custom-copy-styles');
  const websiteConfigurationSection = document.getElementById('website-info-section');
  const customCopyStylesSection = document.getElementById('custom-copy-styles-section');

  websiteConfigurationTab.addEventListener('click', () => {
    websiteConfigurationTab.classList.add('is-active');
    customCopyStylesTab.classList.remove('is-active');
    websiteConfigurationSection.style.display = 'block';
    customCopyStylesSection.style.display = 'none';
  });

  customCopyStylesTab.addEventListener('click', () => {
    customCopyStylesTab.classList.add('is-active');
    websiteConfigurationTab.classList.remove('is-active');
    customCopyStylesSection.style.display = 'block';
    websiteConfigurationSection.style.display = 'none';
  });
}



document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addWebsiteButton').addEventListener('click', () => {
    addWebsiteInfoItem();
  });

  document.getElementById('saveButton').addEventListener('click', saveWebsiteInfo);
  loadWebsiteInfo();

  document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile').addEventListener('change', importSettings);

  document.getElementById('exportButton').addEventListener('click', exportSettings);

  document.getElementById('addCustomCopyStyleButton').addEventListener('click', () => {
    addCustomCopyStyleItem();
  });
  document.getElementById('saveCustomCopyStylesButton').addEventListener('click', saveCustomCopyStyle);
  loadCustomCopyStyles();
  switchTabs();

});

