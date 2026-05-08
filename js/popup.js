/**
 * Flow Auto Generator - Popup Script
 * Handles the extension popup UI and user interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // ===== State =====
  let isGenerating = false;

  // ===== DOM Elements =====
  const elements = {
    statusDot: document.getElementById('statusDot'),
    promptInput: document.getElementById('promptInput'),
    bulkMode: document.getElementById('bulkMode'),
    bulkSection: document.getElementById('bulkSection'),
    bulkPrompts: document.getElementById('bulkPrompts'),
    promptCount: document.getElementById('promptCount'),
    autoDownload: document.getElementById('autoDownload'),
    delaySlider: document.getElementById('delaySlider'),
    delayValue: document.getElementById('delayValue'),
    generateBtn: document.getElementById('generateBtn'),
    stopBtn: document.getElementById('stopBtn'),
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    templateGrid: document.getElementById('templateGrid'),
    templateName: document.getElementById('templateName'),
    templatePrompt: document.getElementById('templatePrompt'),
    saveTemplate: document.getElementById('saveTemplate'),
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    defaultModel: document.getElementById('defaultModel'),
    defaultAspect: document.getElementById('defaultAspect'),
    notifications: document.getElementById('notifications'),
  };

  // ===== Default Templates =====
  const defaultTemplates = [
    {
      emoji: '🌄',
      name: 'Landscape',
      prompt:
        'A breathtaking landscape with mountains, golden hour lighting, cinematic composition, highly detailed',
    },
    {
      emoji: '👤',
      name: 'Portrait',
      prompt:
        'A professional portrait photo, soft studio lighting, shallow depth of field, high quality',
    },
    {
      emoji: '🌃',
      name: 'Cyberpunk',
      prompt:
        'A futuristic cyberpunk city at night, neon lights, rain-soaked streets, atmospheric, detailed',
    },
    {
      emoji: '🎨',
      name: 'Abstract',
      prompt:
        'Abstract art, vibrant colors, fluid shapes, modern design, high resolution, artistic',
    },
    {
      emoji: '🐾',
      name: 'Animals',
      prompt:
        'A majestic wild animal in its natural habitat, professional wildlife photography, detailed',
    },
    {
      emoji: '🍕',
      name: 'Food',
      prompt:
        'Gourmet food photography, beautifully plated, soft lighting, shallow depth of field, appetizing',
    },
    {
      emoji: '🏛️',
      name: 'Architecture',
      prompt:
        'Stunning modern architecture, dramatic angles, professional photography, golden hour light',
    },
    {
      emoji: '🚀',
      name: 'Sci-Fi',
      prompt:
        'Epic science fiction scene, space, futuristic technology, dramatic lighting, cinematic, 8K',
    },
    {
      emoji: '🧚',
      name: 'Fantasy',
      prompt:
        'Magical fantasy world, enchanted forest, mystical creatures, ethereal lighting, detailed art',
    },
    {
      emoji: '📸',
      name: 'Product',
      prompt:
        'Clean product photography on white background, studio lighting, professional commercial shot',
    },
  ];

  // ===== Initialize =====
  function init() {
    checkConnection();
    loadSettings();
    loadTemplates();
    loadHistory();
    setupEventListeners();
  }

  // ===== Connection Check =====
  function checkConnection() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (
        tab &&
        tab.url &&
        tab.url.includes('labs.google/fx/tools/flow')
      ) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'checkConnection' },
          (response) => {
            if (chrome.runtime.lastError || !response) {
              elements.statusDot.classList.remove('connected');
              elements.statusDot.title = 'Not connected - Open a Flow project';
              return;
            }
            if (response.connected) {
              elements.statusDot.classList.add('connected');
              elements.statusDot.title = 'Connected to Flow';
            }
          }
        );
      } else {
        elements.statusDot.classList.remove('connected');
        elements.statusDot.title =
          'Not on Flow page - Navigate to labs.google/fx/tools/flow';
      }
    });
  }

  // ===== Settings =====
  function loadSettings() {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      elements.delaySlider.value = settings.delay || 15;
      elements.delayValue.textContent = settings.delay || 15;
      elements.autoDownload.checked = settings.autoDownload || false;
      elements.notifications.checked =
        settings.notifications !== undefined ? settings.notifications : true;
      elements.defaultModel.value = settings.defaultModel || 'nano-banana-2';
      elements.defaultAspect.value = settings.defaultAspect || '16:9';

      const imageCount = settings.imageCount || 2;
      const radio = document.querySelector(
        `input[name="imageCount"][value="${imageCount}"]`
      );
      if (radio) radio.checked = true;
    });
  }

  function saveSettings() {
    const imageCountRadio = document.querySelector(
      'input[name="imageCount"]:checked'
    );
    const settings = {
      delay: parseInt(elements.delaySlider.value, 10),
      autoDownload: elements.autoDownload.checked,
      imageCount: imageCountRadio ? parseInt(imageCountRadio.value, 10) : 2,
      notifications: elements.notifications.checked,
      defaultModel: elements.defaultModel.value,
      defaultAspect: elements.defaultAspect.value,
    };
    chrome.storage.local.set({ settings });
  }

  // ===== Templates =====
  function loadTemplates() {
    chrome.storage.local.get(['customTemplates'], (result) => {
      const custom = result.customTemplates || [];
      const all = [...defaultTemplates, ...custom];
      renderTemplates(all);
    });
  }

  function renderTemplates(templates) {
    elements.templateGrid.innerHTML = '';
    templates.forEach((tmpl) => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="template-emoji">${tmpl.emoji || '📝'}</div>
        <div class="template-name">${tmpl.name}</div>
        <div class="template-desc">${tmpl.prompt.substring(0, 50)}...</div>
      `;
      card.addEventListener('click', () => {
        elements.promptInput.value = tmpl.prompt;
        switchToTab('generator');
      });
      elements.templateGrid.appendChild(card);
    });
  }

  // ===== History =====
  function loadHistory() {
    chrome.storage.local.get(['history'], (result) => {
      const history = result.history || [];
      renderHistory(history);
    });
  }

  function renderHistory(history) {
    if (history.length === 0) {
      elements.historyList.innerHTML =
        '<div class="empty-state">No history yet</div>';
      return;
    }

    elements.historyList.innerHTML = '';
    history
      .slice()
      .reverse()
      .forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
        <div class="history-text">${item.prompt}</div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
          <span class="history-time">${formatTime(item.timestamp)}</span>
          <button class="history-reuse">Reuse</button>
        </div>
      `;
        div.querySelector('.history-reuse').addEventListener('click', (e) => {
          e.stopPropagation();
          elements.promptInput.value = item.prompt;
          switchToTab('generator');
        });
        elements.historyList.appendChild(div);
      });
  }

  function addToHistory(prompt) {
    chrome.storage.local.get(['history'], (result) => {
      const history = result.history || [];
      history.push({ prompt, timestamp: Date.now() });
      if (history.length > 50) history.shift();
      chrome.storage.local.set({ history });
      renderHistory(history);
    });
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // ===== Tab Navigation =====
  function switchToTab(tabName) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document
      .querySelectorAll('.tab-content')
      .forEach((t) => t.classList.remove('active'));
    document
      .querySelector(`.tab[data-tab="${tabName}"]`)
      .classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  }

  // ===== Event Listeners =====
  function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        switchToTab(tab.dataset.tab);
      });
    });

    // Bulk mode toggle
    elements.bulkMode.addEventListener('change', () => {
      elements.bulkSection.classList.toggle('hidden', !elements.bulkMode.checked);
    });

    // Bulk prompt count
    elements.bulkPrompts.addEventListener('input', () => {
      const lines = elements.bulkPrompts.value
        .split('\n')
        .filter((l) => l.trim());
      elements.promptCount.textContent = lines.length;
    });

    // Delay slider
    elements.delaySlider.addEventListener('input', () => {
      elements.delayValue.textContent = elements.delaySlider.value;
      saveSettings();
    });

    // Settings changes
    elements.autoDownload.addEventListener('change', saveSettings);
    elements.notifications.addEventListener('change', saveSettings);
    elements.defaultModel.addEventListener('change', saveSettings);
    elements.defaultAspect.addEventListener('change', saveSettings);
    document.querySelectorAll('input[name="imageCount"]').forEach((radio) => {
      radio.addEventListener('change', saveSettings);
    });

    // Generate button
    elements.generateBtn.addEventListener('click', startGeneration);

    // Stop button
    elements.stopBtn.addEventListener('click', stopGeneration);

    // Save custom template
    elements.saveTemplate.addEventListener('click', () => {
      const name = elements.templateName.value.trim();
      const prompt = elements.templatePrompt.value.trim();
      if (!name || !prompt) {
        showToast('Please fill in both name and prompt');
        return;
      }
      chrome.storage.local.get(['customTemplates'], (result) => {
        const templates = result.customTemplates || [];
        templates.push({ emoji: '📝', name, prompt });
        chrome.storage.local.set({ customTemplates: templates }, () => {
          elements.templateName.value = '';
          elements.templatePrompt.value = '';
          loadTemplates();
          showToast('Template saved!');
        });
      });
    });

    // Clear history
    elements.clearHistory.addEventListener('click', () => {
      chrome.storage.local.set({ history: [] }, () => {
        loadHistory();
        showToast('History cleared');
      });
    });

    // Listen for progress updates from content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'progressToPopup') {
        updateProgress(message.current, message.total);
      }
    });
  }

  // ===== Generation =====
  function startGeneration() {
    let prompts = [];

    if (elements.bulkMode.checked) {
      prompts = elements.bulkPrompts.value
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => l.trim());
    } else {
      const single = elements.promptInput.value.trim();
      if (single) prompts = [single];
    }

    if (prompts.length === 0) {
      showToast('Please enter at least one prompt');
      return;
    }

    const imageCountRadio = document.querySelector(
      'input[name="imageCount"]:checked'
    );
    const delay = parseInt(elements.delaySlider.value, 10) * 1000;
    const autoDownload = elements.autoDownload.checked;
    const imageCount = imageCountRadio
      ? parseInt(imageCountRadio.value, 10)
      : 2;

    // Save to history
    prompts.forEach((p) => addToHistory(p));

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url || !tab.url.includes('labs.google/fx/tools/flow')) {
        showToast('Please open a Flow project first');
        return;
      }

      const aspectRatio = elements.defaultAspect.value || '16:9';

      chrome.tabs.sendMessage(
        tab.id,
        {
          action: 'startGeneration',
          prompts,
          delay,
          autoDownload,
          imageCount,
          aspectRatio,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            showToast('Connection error - reload the Flow page');
            return;
          }
          if (response && response.success) {
            isGenerating = true;
            elements.generateBtn.classList.add('hidden');
            elements.stopBtn.classList.remove('hidden');
            elements.progressSection.classList.remove('hidden');
            updateProgress(1, prompts.length);
          }
        }
      );
    });
  }

  function stopGeneration() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { action: 'stopGeneration' });
      }
    });

    isGenerating = false;
    elements.generateBtn.classList.remove('hidden');
    elements.stopBtn.classList.add('hidden');
    elements.progressSection.classList.add('hidden');
    showToast('Generation stopped');
  }

  function updateProgress(current, total) {
    const percent = (current / total) * 100;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `Processing ${current}/${total}`;

    if (current >= total) {
      setTimeout(() => {
        isGenerating = false;
        elements.generateBtn.classList.remove('hidden');
        elements.stopBtn.classList.add('hidden');
        elements.progressSection.classList.add('hidden');
        showToast('All prompts generated!');
      }, 2000);
    }
  }

  // ===== Toast Notification =====
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ===== Start =====
  init();
});
