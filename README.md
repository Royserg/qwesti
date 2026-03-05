# Qwesti

Qwesti is a desktop app for tracking tasks with possibility to infinitely nest them.

[Download the latest release](https://github.com/Royserg/qwesti/releases/latest)

## Features

- Infinitely nested sub-quests
- Completion tracking with completed/pending states
- Filter views (`all`, `pending`, `completed`)
- Drag-and-drop quest ordering
- Offline first - data stored in SQLite database

## Platforms

Release artifacts are published on GitHub Releases for:

- macOS (Apple Silicon + Intel)
- Windows
- Linux
- Android (wip)
- iOS (wip)

## Install

1. Open [latest releases](https://github.com/Royserg/qwesti/releases/latest).
2. Download the installer/archive for your platform.
3. Install and run Qwesti.

On macOS, if Gatekeeper blocks the app, remove quarantine:

```bash
xattr -cr /Applications/Qwesti.app
```

## Development

### Prerequisites

- Node.js
- pnpm
- Rust toolchain

### Local build signing setup

`pnpm t:b:d` and `pnpm tauri build` require updater signing variables.


### Database setup (required first run)

Before starting the app, create the database and run migrations with one of:

```bash
just db-migrate
```

or:

```bash
cd src-tauri && cargo sqlx migrate run
```

### Commands

```bash
# run desktop app in development mode
pnpm d

# build desktop bundles
pnpm t:b:d
```

