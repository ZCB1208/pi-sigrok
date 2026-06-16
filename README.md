<div align="center">

# pi-sigrok 🪛

**Logic Analyzer Control for [Pi Coding Agent](https://pi.dev)**

<br>

[![npm](https://img.shields.io/npm/v/pi-sigrok)](https://www.npmjs.com/package/pi-sigrok)
[![Pi Package](https://img.shields.io/badge/pi-package-purple)](https://pi.dev/packages/pi-sigrok)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

<br>

[English](#english) | [中文](#中文)

</div>

---

<a name="english"></a>

## 🇬🇧 English

**pi-sigrok** is a [Pi Coding Agent](https://pi.dev) package that brings logic analyzer control and protocol decoding into your AI-powered terminal workflow.

It wraps [sigrok-cli](https://sigrok.org/) — the industry-standard open-source signal analysis tool — as AI-callable tools and educational skills, so you can capture and decode digital signals (UART, SPI, I2C, etc.) just by asking in natural language.

### ✨ Features

| Feature | Description |
|---------|-------------|
| **4 AI Tools** | Scan devices, capture signals, list decoders, inspect decoder details — all callable by Pi agent |
| **Skill Guide** | Built-in skill teaches the AI how to set up firmware, configure protocols, and troubleshoot |
| **Protocols** | UART, SPI, I2C, CAN, 1-Wire, and 200+ more decoders supported by sigrok |
| **Hardware** | DreamSourceLab DSLogic, fx2lafw, and any sigrok-compatible logic analyzer |

### 🚀 Quick Start

#### 1. Install the package

```bash
pi install npm:pi-sigrok
```

#### 2. Connect your logic analyzer

Plug in your DSLogic or compatible device via USB.

#### 3. Use it in natural language

Once installed, just ask Pi:

> *"Scan for connected logic analyzers"*
> → calls `sigrok_scan`

> *"Capture UART at 9600 baud, RX on channel 0, for 3 seconds"*
> → calls `sigrok_capture`

> *"What protocol decoders support I2C?"*
> → calls `sigrok_list_decoders`

> *"Show me the SPI decoder options"*
> → calls `sigrok_protocol_info`

### 📦 Package Structure

```
pi-sigrok/
├── package.json              # Pi package manifest
├── README.md                 # Documentation
├── extensions/
│   └── pi-sigrok.ts          # 4 AI tools (scan, capture, list, info)
└── skills/
    └── dslogic-sigrok/
        └── SKILL.md          # Setup & usage guide for DSLogic
```

### 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `sigrok_scan` | Scan for connected logic analyzers, returns connection strings |
| `sigrok_capture` | Capture and decode signals with configurable samplerate, channels, triggers, and protocol decoders |
| `sigrok_list_decoders` | List available protocol decoders, optionally filter by keyword |
| `sigrok_protocol_info` | Show detailed info about a decoder (pins, options, annotations) |

### 🧰 Requirements

- [sigrok-cli](https://sigrok.org/wiki/Downloads) installed and in PATH
- Firmware files for your logic analyzer (see the dslogic-sigrok skill or [sigrok Wiki](https://sigrok.org/wiki/DreamSourceLab_DSLogic))
- Windows, Linux, or macOS (shell path may need configuration)

---

<a name="中文"></a>

## 🇨🇳 中文

**pi-sigrok** 是一个 [Pi Coding Agent](https://pi.dev) 包，将逻辑分析仪控制和协议解码能力带入你的 AI 终端工作流。

它封装了业界标准的开源信号分析工具 [sigrok-cli](https://sigrok.org/)，提供 AI 可调用的工具和知识技能，让你只需用自然语言就能采集和解码数字信号（UART、SPI、I2C 等）。

### ✨ 功能特性

| 特性 | 说明 |
|------|------|
| **4 个 AI 工具** | 扫描设备、采集信号、列出解码器、查看解码器详情 — Pi agent 可直接调用 |
| **技能指南** | 内置技能教会 AI 如何安装固件、配置协议和排查问题 |
| **支持的协议** | UART、SPI、I2C、CAN、1-Wire 等 200+ 种 sigrok 解码器 |
| **硬件支持** | DreamSourceLab DSLogic、fx2lafw 及任何 sigrok 兼容的逻辑分析仪 |

### 🚀 快速开始

#### 1. 安装包

```bash
pi install npm:pi-sigrok
```

#### 2. 连接逻辑分析仪

通过 USB 连接你的 DSLogic 或兼容设备。

#### 3. 用自然语言操作

安装后，直接对 Pi 说：

> *"扫描一下连接的逻辑分析仪设备"*
> → 调用 `sigrok_scan`

> *"用 UART 9600 波特率抓一下通道 0 的数据，持续 3 秒"*
> → 调用 `sigrok_capture`

> *"列出支持 I2C 的协议解码器"*
> → 调用 `sigrok_list_decoders`

> *"查看 SPI 解码器的配置选项"*
> → 调用 `sigrok_protocol_info`

### 📦 包结构

```
pi-sigrok/
├── package.json              # Pi 包清单
├── README.md                 # 本文档
├── extensions/
│   └── pi-sigrok.ts          # 4 个 AI 工具
└── skills/
    └── dslogic-sigrok/
        └── SKILL.md          # DSLogic 设置与使用指南
```

### 🛠️ 可用工具

| 工具 | 功能 |
|------|------|
| `sigrok_scan` | 扫描连接的分析仪，返回连接标识 |
| `sigrok_capture` | 采集并解码信号，可配置采样率、通道、触发和解码器 |
| `sigrok_list_decoders` | 列出可用协议解码器，支持关键字过滤 |
| `sigrok_protocol_info` | 查看解码器的通道、参数和注释类型等详细信息 |

### 🧰 系统要求

- 安装 [sigrok-cli](https://sigrok.org/wiki/Downloads) 并加入 PATH
- 逻辑分析仪的固件文件（参见 dslogic-sigrok 技能或 [sigrok Wiki](https://sigrok.org/wiki/DreamSourceLab_DSLogic)）
- Windows、Linux 或 macOS（Windows 下可能需要配置 shell 路径）

---

### 📄 License

MIT

### 🔗 Links

- [Pi Coding Agent](https://pi.dev)
- [sigrok](https://sigrok.org/)
- [Pi Package Gallery](https://pi.dev/packages/pi-sigrok)
- [npm Package](https://www.npmjs.com/package/pi-sigrok)