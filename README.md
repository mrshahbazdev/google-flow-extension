# Flow Auto Image Generator - Chrome Extension

A Chrome extension for [Google Flow](https://labs.google/fx/tools/flow) that automates image generation with bulk prompts, auto-download, and prompt templates.

## Features

- **Single & Bulk Prompt Mode** - Generate images from one prompt or queue multiple prompts
- **Image Count Selection** - Choose 1x, 2x, 3x, or 4x images per prompt
- **Aspect Ratio Control** - Select from 16:9, 4:3, 1:1, 3:4, or 9:16
- **Auto-Download** - Automatically download generated images after each generation
- **Prompt Templates** - 10 built-in templates + create your own custom templates
- **Prompt History** - Track and reuse previous prompts
- **Real-time Progress** - Overlay on Flow page showing generation progress
- **Configurable Delay** - Set delay between bulk generations (5-60 seconds)
- **Dark Theme UI** - Beautiful dark-themed popup matching Flow's aesthetic

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `flow-auto-generator` folder
6. The extension icon will appear in your toolbar

## Usage

1. Navigate to [Google Flow](https://labs.google/fx/tools/flow)
2. Open or create a new project
3. Click the extension icon in your toolbar
4. The status dot turns green when connected to Flow

### Single Prompt
1. Type your prompt in the text area
2. Select image count (x1-x4)
3. Toggle auto-download if desired
4. Click **Generate**

### Bulk Prompts
1. Toggle **Bulk Prompts** mode
2. Enter one prompt per line
3. Set delay between generations
4. Click **Generate** to process all prompts sequentially

### Templates
1. Go to the **Templates** tab
2. Click any template to load it into the generator
3. Create custom templates with name and prompt text

### Settings
- **Default Aspect Ratio** - Set preferred aspect ratio for generations
- **Notifications** - Toggle browser notifications on completion

## Project Structure

```
flow-auto-generator/
├── manifest.json          # Extension manifest (MV3)
├── popup.html             # Extension popup UI
├── css/
│   ├── popup.css          # Popup dark theme styles
│   └── content.css        # In-page overlay styles
├── js/
│   ├── popup.js           # Popup UI logic
│   ├── content.js         # Content script (DOM interaction)
│   └── background.js      # Service worker
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## How It Works

The extension injects a content script into Flow pages that:
1. Opens the Nano Banana model dropdown to configure image count and aspect ratio
2. Sets the prompt text in Flow's prompt input box
3. Clicks the Generate button to start image creation
4. Monitors for generation completion by tracking new image elements
5. Auto-downloads images by fetching from Flow's media API and triggering browser downloads
6. Repeats for each prompt in the queue with configurable delay

## Requirements

- Google Chrome (or Chromium-based browser)
- Google account logged into Google Flow
- Active Flow project page open

## License

MIT
