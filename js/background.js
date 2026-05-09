/**
 * Flow Auto Generator - Background Service Worker
 * Handles notifications and cross-component communication
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'generationComplete') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Flow Auto Generator',
      message: `Generation complete! ${message.total} prompts processed.`,
    });
  }

  if (message.action === 'progressUpdate') {
    // Forward progress to popup if open
    chrome.runtime.sendMessage({
      action: 'progressToPopup',
      current: message.current,
      total: message.total,
      prompt: message.prompt,
    }).catch(() => {
      // Popup might not be open
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          delay: 15,
          autoDownload: false,
          imageCount: 2,
          notifications: true,
          defaultModel: 'nano-banana-2',
          defaultAspect: '16:9',
        },
        history: [],
        customTemplates: [],
      });
    }
  });
});
