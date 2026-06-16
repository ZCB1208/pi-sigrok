# pi-sigrok

Logic analyzer control and protocol decoding via sigrok-cli, as a [Pi](https://pi.dev) package.

Supports **DreamSourceLab DSLogic** and other sigrok-compatible devices. Provides both an **extension** (AI-callable tools) and a **skill** (educational guide for the AI).

## Installation

### From npm (once published)
```bash
pi install npm:pi-sigrok
```

### From git
```bash
pi install git:github.com/your-username/pi-sigrok
```

### Local development
```bash
pi install ./pi-sigrok
```

## What's Included

### Extension: 4 AI Tools

| Tool | Description |
|------|-------------|
| `sigrok_scan` | Scan for connected logic analyzers |
| `sigrok_capture` | Capture and decode signals (UART, SPI, I2C, etc.) |
| `sigrok_list_decoders` | List available protocol decoders |
| `sigrok_protocol_info` | Show decoder details and pin options |

### Skill: DSLogic + sigrok Guide

The `dslogic-sigrok` skill teaches the AI how to:
- Install firmware for DSLogic devices
- Use sigrok-cli commands effectively
- Troubleshoot common issues
- Decode various protocols (UART, SPI, I2C, etc.)

## Usage Examples

Once installed, just ask naturally:

```
Scan for connected logic analyzers
→ calls sigrok_scan

Capture UART at 115200 baud, RX on channel 0, for 5 seconds
→ calls sigrok_capture

What protocol decoders are available for SPI?
→ calls sigrok_list_decoders

Show me the UART decoder options
→ calls sigrok_protocol_info
```

## Requirements

- [sigrok-cli](https://sigrok.org/wiki/Downloads) installed and in PATH
- sigrok firmware files for your device (see the dslogic-sigrok skill)
- A compatible logic analyzer (DreamSourceLab DSLogic, fx2lafw, etc.)

### Troubleshooting

If you get "Failed to open resource" firmware errors, see this detailed guide:

[**DSLogic + sigrok-cli Firmware Setup Guide**](https://www.cnblogs.com/whyNotDIY/p/20541771)
(Covers firmware extraction, renaming, and placement)

## Package Structure

```
pi-sigrok/
├── package.json                # Pi manifest
├── README.md                   # This file
├── extensions/
│   └── pi-sigrok.ts            # Extension: 4 AI tools
└── skills/
    └── dslogic-sigrok/
        └── SKILL.md            # Skill: setup & usage guide
```
