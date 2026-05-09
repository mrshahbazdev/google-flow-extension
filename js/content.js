/**
 * Flow Auto Generator - Content Script
 * Runs on labs.google/fx/tools/flow pages
 *
 * DOM findings (May 2026):
 *  - Prompt box: div[role="textbox"][contenteditable="true"]
 *  - Generate button: button with text "arrow_forwardCreate"
 *  - Model button: button containing "Nano Banana"
 *  - Image count tabs: button[role="tab"] with text "1x","x2","x3","x4"
 *  - Aspect ratio tabs: button.flow_tab_slider_trigger
 *  - Images: img[alt="Generated image"] src contains "media.getMediaUrlRedirect"
 *  - Download button (edit view): button with text "downloadDownload"
 */

(function () {
  'use strict';

  const STATE = {
    isGenerating: false,
    queue: [],
    currentIndex: 0,
    delay: 15000,
    autoDownload: false,
    imageCount: 2,
    aspectRatio: '16:9',
    previousImageCount: 0,
  };

  function findPromptBox() {
    const editables = document.querySelectorAll(
      'div[role="textbox"][contenteditable="true"]'
    );
    for (const el of editables) {
      const parent = el.closest('[class*="e5032833"]');
      if (parent) return el;
    }
    if (editables.length > 0) return editables[editables.length - 1];
    return null;
  }

  function findGenerateButton() {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      if (text === 'arrow_forwardCreate') return btn;
    }
    for (const btn of buttons) {
      const text = btn.textContent.trim();
      if (text.includes('arrow_forward') && text.includes('Create')) return btn;
    }
    return null;
  }

  function findModelButton() {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Nano Banana')) return btn;
    }
    return null;
  }

  function getGeneratedImages() {
    return document.querySelectorAll(
      'img[alt="Generated image"], img[src*="media.getMediaUrlRedirect"]'
    );
  }

  function countGeneratedImages() {
    return getGeneratedImages().length;
  }

  // ===== Image Count & Aspect Ratio Selection =====

  async function openModelDropdown() {
    const modelBtn = findModelButton();
    if (!modelBtn) return false;
    modelBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    return true;
  }

  async function closeModelDropdown() {
    document.body.click();
    await new Promise((r) => setTimeout(r, 300));
  }

  function selectImageCount(count) {
    const countMap = { 1: '1x', 2: 'x2', 3: 'x3', 4: 'x4' };
    const targetText = countMap[count];
    if (!targetText) return false;
    const tabs = document.querySelectorAll('button[role="tab"]');
    for (const tab of tabs) {
      if (tab.textContent.trim() === targetText) {
        if (tab.getAttribute('aria-selected') === 'true') return true;
        tab.click();
        return true;
      }
    }
    return false;
  }

  function selectAspectRatio(ratio) {
    const tabs = document.querySelectorAll('button.flow_tab_slider_trigger');
    for (const tab of tabs) {
      if (tab.textContent.includes(ratio)) {
        tab.click();
        return true;
      }
    }
    return false;
  }

  async function configureSettings(imageCount, aspectRatio) {
    const opened = await openModelDropdown();
    if (!opened) return false;
    await new Promise((r) => setTimeout(r, 500));
    if (aspectRatio) selectAspectRatio(aspectRatio);
    await new Promise((r) => setTimeout(r, 300));
    if (imageCount) selectImageCount(imageCount);
    await new Promise((r) => setTimeout(r, 300));
    await closeModelDropdown();
    return true;
  }

  function setPromptText(text) {
    const promptBox = findPromptBox();
    if (!promptBox) {
      console.error('[FlowAutoGen] Prompt box not found');
      return false;
    }

    promptBox.focus();
    promptBox.innerHTML = '';

    const p = document.createElement('p');
    const span = document.createElement('span');
    span.textContent = text;
    p.appendChild(span);
    promptBox.appendChild(p);

    promptBox.dispatchEvent(new Event('input', { bubbles: true }));
    promptBox.dispatchEvent(new Event('change', { bubbles: true }));
    promptBox.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'a' })
    );
    promptBox.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'a' })
    );

    return true;
  }

  function clickGenerate() {
    const btn = findGenerateButton();
    if (!btn) {
      console.error('[FlowAutoGen] Generate button not found');
      return false;
    }
    btn.click();
    return true;
  }

  function isGenerationInProgress() {
    const spinners = document.querySelectorAll(
      '[class*="spinner"], [class*="loading"], [role="progressbar"]'
    );
    return spinners.length > 0;
  }

  function waitForGeneration() {
    return new Promise((resolve) => {
      const startImageCount = countGeneratedImages();
      let stableCount = 0;
      let checkCount = 0;
      const maxChecks = 90;

      const interval = setInterval(() => {
        checkCount++;
        const currentCount = countGeneratedImages();
        const stillLoading = isGenerationInProgress();

        if (currentCount > startImageCount && !stillLoading) {
          stableCount++;
          if (stableCount >= 3) {
            clearInterval(interval);
            resolve(true);
            return;
          }
        } else {
          stableCount = 0;
        }

        if (checkCount >= maxChecks) {
          clearInterval(interval);
          resolve(true);
        }
      }, 2000);
    });
  }

  async function downloadGeneratedImages(newImageCount) {
    const allImages = getGeneratedImages();
    const newImages = Array.from(allImages).slice(-newImageCount);
    let downloaded = 0;

    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];
      const src = img.src;
      if (!src) continue;

      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'flow-image-' + Date.now() + '-' + (i + 1) + '.png';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        downloaded++;

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 1000);

        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error('[FlowAutoGen] Download failed:', err);
        window.open(src, '_blank');
      }
    }
    return downloaded;
  }

  async function downloadViaUI() {
    const allImages = getGeneratedImages();
    const newImages = Array.from(allImages).slice(-STATE.imageCount);

    for (const img of newImages) {
      img.click();
      await new Promise((r) => setTimeout(r, 1500));

      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('downloadDownload')) {
          btn.click();
          await new Promise((r) => setTimeout(r, 1000));
          break;
        }
      }

      const backBtns = document.querySelectorAll('button');
      for (const btn of backBtns) {
        if (btn.textContent.includes('arrow_backBack')) {
          btn.click();
          await new Promise((r) => setTimeout(r, 1000));
          break;
        }
      }
    }
  }

  function createOverlay() {
    let overlay = document.getElementById('flow-auto-gen-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'flow-auto-gen-overlay';
    overlay.innerHTML = [
      '<div class="fag-header">',
      '  <span class="fag-title">Flow Auto Generator</span>',
      '  <button class="fag-minimize" id="fag-minimize-btn">_</button>',
      '</div>',
      '<div class="fag-status" id="fag-status">Ready</div>',
      '<div class="fag-progress">',
      '  <div class="fag-progress-fill" id="fag-progress-fill" style="width: 0%"></div>',
      '</div>',
      '<div class="fag-current-prompt" id="fag-current-prompt"></div>',
    ].join('');
    document.body.appendChild(overlay);

    document.getElementById('fag-minimize-btn').addEventListener('click', () => {
      overlay.classList.toggle('minimized');
    });

    return overlay;
  }

  function updateOverlay(status, progress, currentPrompt) {
    const statusEl = document.getElementById('fag-status');
    const progressEl = document.getElementById('fag-progress-fill');
    const promptEl = document.getElementById('fag-current-prompt');

    if (statusEl) statusEl.textContent = status;
    if (progressEl) progressEl.style.width = progress + '%';
    if (promptEl) promptEl.textContent = currentPrompt || '';
  }

  function removeOverlay() {
    const overlay = document.getElementById('flow-auto-gen-overlay');
    if (overlay) overlay.remove();
  }

  async function processQueue() {
    if (!STATE.isGenerating || STATE.currentIndex >= STATE.queue.length) {
      STATE.isGenerating = false;
      updateOverlay('Complete!', 100, '');
      chrome.runtime.sendMessage({
        action: 'generationComplete',
        total: STATE.queue.length,
      });

      setTimeout(removeOverlay, 5000);
      return;
    }

    const prompt = STATE.queue[STATE.currentIndex];
    const progress = ((STATE.currentIndex + 1) / STATE.queue.length) * 100;

    const truncated = prompt.substring(0, 60) + (prompt.length > 60 ? '...' : '');

    updateOverlay(
      'Generating ' + (STATE.currentIndex + 1) + '/' + STATE.queue.length,
      progress,
      truncated
    );

    chrome.runtime.sendMessage({
      action: 'progressUpdate',
      current: STATE.currentIndex + 1,
      total: STATE.queue.length,
      prompt: prompt,
    });

    // Configure image count & aspect ratio before first generation
    if (STATE.currentIndex === 0) {
      await configureSettings(STATE.imageCount, STATE.aspectRatio);
      await new Promise((r) => setTimeout(r, 500));
    }

    const beforeCount = countGeneratedImages();

    const promptSet = setPromptText(prompt);
    if (!promptSet) {
      console.error('[FlowAutoGen] Failed to set prompt, retrying...');
      await new Promise((r) => setTimeout(r, 2000));
      const retry = setPromptText(prompt);
      if (!retry) {
        STATE.currentIndex++;
        processQueue();
        return;
      }
    }

    await new Promise((r) => setTimeout(r, 1500));

    const clicked = clickGenerate();
    if (!clicked) {
      console.error('[FlowAutoGen] Failed to click generate');
      STATE.currentIndex++;
      processQueue();
      return;
    }

    updateOverlay(
      'Waiting for images ' + (STATE.currentIndex + 1) + '/' + STATE.queue.length,
      progress, truncated
    );

    await waitForGeneration();

    if (STATE.autoDownload) {
      updateOverlay(
        'Downloading ' + (STATE.currentIndex + 1) + '/' + STATE.queue.length,
        progress, 'Downloading images...'
      );
      await new Promise((r) => setTimeout(r, 2000));

      const afterCount = countGeneratedImages();
      const newCount = afterCount - beforeCount;

      if (newCount > 0) {
        try {
          await downloadGeneratedImages(newCount);
        } catch (err) {
          console.error('[FlowAutoGen] Auto-download failed, trying UI:', err);
          await downloadViaUI();
        }
      }
    }

    STATE.currentIndex++;

    if (STATE.currentIndex < STATE.queue.length && STATE.isGenerating) {
      updateOverlay(
        'Waiting ' + (STATE.delay / 1000) + 's before next...', progress, ''
      );
      await new Promise((r) => setTimeout(r, STATE.delay));
    }

    if (STATE.isGenerating) {
      processQueue();
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'startGeneration': {
        STATE.isGenerating = true;
        STATE.queue = message.prompts;
        STATE.currentIndex = 0;
        STATE.delay = message.delay || 15000;
        STATE.autoDownload = message.autoDownload || false;
        STATE.imageCount = message.imageCount || 2;
        STATE.aspectRatio = message.aspectRatio || '16:9';
        STATE.previousImageCount = countGeneratedImages();

        createOverlay();
        processQueue();
        sendResponse({ success: true });
        break;
      }

      case 'stopGeneration': {
        STATE.isGenerating = false;
        STATE.queue = [];
        STATE.currentIndex = 0;
        updateOverlay('Stopped', 0, '');
        setTimeout(removeOverlay, 3000);
        sendResponse({ success: true });
        break;
      }

      case 'getStatus': {
        sendResponse({
          isGenerating: STATE.isGenerating,
          currentIndex: STATE.currentIndex,
          total: STATE.queue.length,
          isOnFlowPage: !!findPromptBox(),
        });
        break;
      }

      case 'checkConnection': {
        sendResponse({
          connected: true,
          hasPromptBox: !!findPromptBox(),
          hasGenerateBtn: !!findGenerateButton(),
          hasModelBtn: !!findModelButton(),
          imageCount: countGeneratedImages(),
        });
        break;
      }

      case 'singleGenerate': {
        (async () => {
          if (message.imageCount || message.aspectRatio) {
            await configureSettings(message.imageCount, message.aspectRatio);
            await new Promise((r) => setTimeout(r, 500));
          }
          const set = setPromptText(message.prompt);
          if (set) {
            setTimeout(() => { clickGenerate(); }, 1000);
          }
          sendResponse({ success: set });
        })();
        break;
      }

      default:
        sendResponse({ error: 'Unknown action' });
    }

    return true;
  });

  console.log('[FlowAutoGen] Content script loaded on Flow page');
})();
