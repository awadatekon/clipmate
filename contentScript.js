// Copyright (C) 2023 awadatekon
// SPDX-License-Identifier: GPL-3.0-or-later

function copyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

function formatData(copyStyle, currentUrl, sortedElements, customCopyStyles) {
  const sanitizedElements = sortedElements.map(({ key, value }) => ({
    key,
    value: value.replace(/\n/g, ' ')// 改行を空白に
      .replace(/^\s+/, '') // 先頭の空白を削除
      .replace(/\s{3,}/g, '') // 3文字以上の空白を削除
  }));

  console.log(sanitizedElements)

  switch (copyStyle) {
    case 'tab':
      return sanitizedElements
        .map(({ key, value }) => `${key}: ${value}`)
        .join('\t');
    case 'json':
      const jsonData = sanitizedElements.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {});
      return JSON.stringify(jsonData, null, 2);
    case 'csv':
      const keys = sanitizedElements.map(({ key }) => key);
      const values = sanitizedElements.map(({ value }) => value);
      return `${keys.join(',')}\n${values.join(',')}`;
    case 'new-line':
      return sanitizedElements
        .map(({ key, value }) => `${key}: ${value}`)
        .join('\n');
    default:
      // カスタムコピースタイルを確認
      const customCopyStyle = customCopyStyles.find(style => style.name === copyStyle);
      
      if (customCopyStyle) {

        // 一旦なる文字に置き換えてから、元に戻す
        function replaceMetaCharacters(text) {
          return text
            .replace(/\\\\/g, '\0')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\s/g, ' ')
            .replace(/\0/g, '\\');
        }
        
        
        let formattedText = customCopyStyle.template;
        const currentUrl = window.location.href;
        
        formattedText = replaceMetaCharacters(formattedText);
        formattedText = formattedText.replace(/{url}/g, currentUrl);
        
        sanitizedElements.forEach(({ key, value }) => {
          formattedText = formattedText.replace(new RegExp(`{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}}`, 'g'), value);
        });
        
        return formattedText;
      } else { // 実質のデフォルト
        return sanitizedElements
          .map(({ key, value }) => `${key}: ${value}`)
          .join('\n');
      }
  }
}



function copyFromWebsite(copyStyle) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['websiteInfo', 'customCopyStyles'], (data) => {
      const websiteInfo = data.websiteInfo || [];
      const currentUrl = window.location.href;
      const customCopyStyles = data.customCopyStyles || [];

      let websiteFound = false;

      for (const site of websiteInfo) {
        console.log('Checking website configuration for URL:', site.url);

        if (currentUrl.startsWith(site.url)) {
          websiteFound = true;
          const extractedElements = [];
          let missingElements = false;

          for (const elementName in site.elements) {
            const xPath = site.elements[elementName].value;
            const order = site.elements[elementName].order;
            let element;
          
            try {
              // 要素をノードとして解釈
              const xPathResultNode = document.evaluate(
                xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
              );
              element = xPathResultNode.singleNodeValue;
            } catch (error) {
              console.log('Node extraction failed:', error);
            }
          
            if (!element) {
              try {
                // 無理ならテキストとして取得
                const xPathResultString = document.evaluate(
                  xPath, document, null, XPathResult.STRING_TYPE, null
                );
                if (xPathResultString.stringValue) {
                  element = { textContent: xPathResultString.stringValue };
                }
              } catch (error) {
                console.log('String extraction failed:', error);
              }
            }
          
            console.log('Evaluating XPath:', xPath);
            console.log('Extracted element:', element);
          
            if (element) {
              extractedElements.push({ key: elementName, value: element.textContent, order });
            } else {
              missingElements = true;
              console.log('Element not found:', elementName);
              extractedElements.push({ key: elementName, value: 'N/A', order });
            }
            console.log(missingElements)

          }
          // オーダーの順番にもとづいて順序を入れ替える
          const sortedElements = extractedElements.sort(
            (a, b) => a.order - b.order
          );

          if (sortedElements.length > 0) {
            const textToCopy = formatData(copyStyle, currentUrl, sortedElements, customCopyStyles);
            copyTextToClipboard(textToCopy);

            let message = null;
            if (missingElements) {
              message = 'いくつかのデータを見つけられませんでした。';
            }
            console.log(message)
            resolve({ success: true, message: message });
          }
        }
      }

      if (!websiteFound) {
        chrome.runtime.sendMessage({ type: 'websiteNotFound' });
        resolve({ success: false });
      }
    });
  });
}



function startCopyProcess() {
  // バックグラウンドスクリプトから渡されたコピースタイルの引数を取得
  chrome.storage.local.get('copyStyle', (data) => {
    const copyStyle = data.copyStyle;
    copyFromWebsite(copyStyle).then((result) => {
      chrome.runtime.sendMessage({ type: 'copyResult', data: result });
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'startCopyProcess') {
    startCopyProcess();
  }
});