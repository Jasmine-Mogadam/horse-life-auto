# Horse Life Auto

A desktop app for help breeding horses in the roblox game "Horse Life".
Be warned, the artifacts (things you download to actually run this) are unsigned and a lot of this is vibe coded. Download and run at your own risk.

## Features

- Horse breeding planner
- Color prediction

## Features in Progress

- Horse probability punnet square (best horses to breed)
- Add horse by image (game screenshots)

## Installation

You can download the latest version for your operating system from the releases page:

- [Windows (.exe)](https://github.com/Jasmine-Mogadam/horse-life-auto/releases/latest) | [![Downloads](https://img.shields.io/github/downloads/Jasmine-Mogadam/horse-life-auto/total)]
- [macOS (.dmg)](https://github.com/Jasmine-Mogadam/horse-life-auto/releases/latest) | [![Downloads](https://img.shields.io/github/downloads/Jasmine-Mogadam/horse-life-auto/total)]
- [Linux (.AppImage)](https://github.com/Jasmine-Mogadam/horse-life-auto/releases/latest) | [![Downloads](https://img.shields.io/github/downloads/Jasmine-Mogadam/horse-life-auto/total)]

Or you can build it from source.

## Building from Source

### Prerequisites

- Node.js (v20 or later)
- npm (comes with Node.js)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/Jasmine-Mogadam/horse-life-auto.git
cd horse-life-auto
```

2. Install dependencies:

```bash
npm install
```

### Development

Run the app in development mode:

```bash
npm run dev
```

For debugging:

```bash
npm run debug
```

### Building

Build for your current platform:

```bash
npm run build
```

Platform-specific builds:

```bash
npm run build:mac    # For macOS (.dmg)
npm run build:win    # For Windows (.exe)
npm run build:linux  # For Linux (.AppImage)
```

The built applications will be available in the `dist` directory.

## Troubleshooting

### "App is damaged and can't be opened" (macOS)

Because this app is not digitally signed (which requires a paid Apple Developer account), macOS may block it from running. To fix this:

1.  Move the app to your `Applications` folder.
2.  Open Terminal.
3.  Run the following command:
    ```bash
    xattr -cr /Applications/Horse\ Life\ Auto.app
    ```
4.  You should now be able to open the app normally.

## Contributing

Wanna add something to this dumpster fire? Here's how:

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

### Setting Up Development Environment

1. Clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/horse-life-auto.git
   ```

2. Add the upstream repository:

   ```bash
   git remote add upstream https://github.com/Jasmine-Mogadam/horse-life-auto.git
   ```

3. Install development dependencies:

   ```bash
   npm install
   ```

4. Create a branch for your work:

   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Before Submitting a Pull Request

- Rebase your branch on the latest main branch (please I beg you)
