---
name: dslogic-sigrok
description: Setup, configure, troubleshoot, and use DreamSourceLab DSLogic logic analyzers with sigrok-cli. Covers firmware installation, protocol decoding (UART/SPI/I2C), troubleshooting common errors, and advanced capture techniques.
---

# DSLogic + sigrok-cli 使用指南

Guide for setting up and using DreamSourceLab DSLogic logic analyzers with sigrok-cli on Windows.

## Prerequisites

- sigrok-cli installed and in PATH
- DreamSourceLab DSLogic (Basic/Plus/Pro) connected via USB
- Firmware files (see Step 2)

## Step 1: Scan for Device

Always start by scanning to verify the device is detected:

```bash
sigrok-cli --driver=dreamsourcelab-dslogic --scan
```

Successful output:
```
dreamsourcelab-dslogic:conn=1.36 - DreamSourceLab DSLogic Plus with 16 channels: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
```

The `conn=1.36` is the connection identifier needed for capture commands.

## Step 2: Firmware Installation

If scan shows the device but `--scan` or capture fails with "Failed to open resource", firmware files are missing.

### 2.1 Get Firmware Files

Download from the [sigrok Wiki](https://sigrok.org/wiki/DreamSourceLab_DSLogic) or extract from DSView software (`C:\Program Files\DSView\res\`).

| Original (DSView) | Rename to (sigrok expects) |
|---|---|
| `DSLogicPlus.fw` | `dreamsourcelab-dslogic-plus-fx2.fw` |
| `DSLogicPlus.bin` | `dreamsourcelab-dslogic-plus-fpga.fw` |

For DSLogic Basic:
| Original | Rename to |
|---|---|
| `DSLogic.fw` | `dreamsourcelab-dslogic-fx2.fw` |
| `DSLogic.bin` | `dreamsourcelab-dslogic-fpga-5v.fw` (or `-3v3.fw`) |

### 2.2 Place Firmware

Copy renamed files to:
```
<sigrok-install-dir>\share\sigrok-firmware\
```

Other search paths (if needed):
- `%LOCALAPPDATA%\sigrok-firmware`
- `C:\ProgramData\sigrok-firmware`

### 2.3 Verify

Unplug and replug the device, then run `--scan` again. No errors means firmware is working.

## Step 3: Basic Capture

### Simple Digital Capture
```bash
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M --samples=100 -O csv
```

### Capture with Duration
```bash
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M -C 0 --time 3000
```

### Save to File
```bash
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M --time 3000 -o capture.sr
```

## Step 4: Protocol Decoding

### UART Decoding
```bash
# RX only, 9600 baud
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M -C 0 \
  -P uart:baudrate=9600:rx=0 -A uart=rx-data --time 3000

# RX + TX, 115200 baud
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M -C 0,1 \
  -P uart:baudrate=115200:rx=0:tx=1 -A uart=rx-data --time 5000
```

### SPI Decoding
```bash
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=4M -C 0,1,2,3 \
  -P spi:miso=0:mosi=1:clk=2:cs=3 -A spi=miso-data --time 3000
```

### I2C Decoding
```bash
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M -C 0,1 \
  -P i2c:scl=0:sda=1 -A i2c=data --time 3000
```

## Step 5: Triggered Capture

Capture only when a signal condition is met:

```bash
# Trigger on channel 0 rising edge
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M -C 0 \
  -t 0=1 -w -P uart:baudrate=9600:rx=0 -A uart=rx-data --time 1000

# Trigger on channel 0 falling edge + channel 1 high
sigrok-cli -d dreamsourcelab-dslogic:conn=1.36 -c samplerate=1M -C 0,1 \
  -t 0=0,1=1 -w -P uart:baudrate=9600:rx=0 -A uart=rx-data --time 1000
```

Trigger syntax: `channel=value`
- `0` — low / falling edge
- `1` — high / rising edge
- `r` — rising edge
- `f` — falling edge
- `R` — rising edge with glitch filter
- `F` — falling edge with glitch filter

## Step 6: View Decoder Info

List all available protocol decoders:
```bash
sigrok-cli --list-supported
```

Show details of a specific decoder (pins, options, annotations):
```bash
sigrok-cli --show --protocol-decoders uart
sigrok-cli --show --protocol-decoders spi
sigrok-cli --show --protocol-decoders i2c
```

## Common Parameters

| Parameter | Description | Example |
|---|---|---|
| `samplerate` | Sample rate in Hz (≥4× signal freq) | `samplerate=1M`, `samplerate=10M` |
| `--time` | Capture duration in ms | `--time 3000` = 3 seconds |
| `--samples` | Number of samples | `--samples 1000000` |
| `-C` | Channels to capture | `-C 0`, `-C 0,1`, `-C 0-7` |
| `-P` | Protocol decoder with options | `-P uart:baudrate=9600:rx=0` |
| `-A` | Annotation type to display | `-A uart=rx-data` |
| `-t` | Trigger condition | `-t 0=1` |
| `-w` | Wait for trigger | `-w` |
| `-o` | Output file (.sr) | `-o capture.sr` |

## Troubleshooting

### "Failed to open resource 'dreamsourcelab-dslogic-plus-fx2.fw'"

Firmware files are missing or incorrectly named. See Step 2.

### Scan shows device but capture fails

The FPGA firmware (`*fpga.fw`) is also required for capture operations. Verify both fx2.fw and fpga.fw are in the firmware directory.

### No data decoded

Possible causes:
- Wrong channel assignment in protocol parameters
- Incorrect baud rate or protocol settings
- Signal not toggling (check with `-O csv`)
- Signal voltage incompatible with logic analyzer thresholds (DSLogic is 3.3V tolerant)
- Sample rate too low (need ≥4× signal frequency for reliable decoding)

### Re-plug after firmware update

Always unplug and replug the USB cable after placing new firmware files. The device re-enumerates and uploads the new firmware on connect.

### Use verbose logging

```bash
sigrok-cli -l 5 --driver=dreamsourcelab-dslogic --scan
```

Log level 5 shows detailed firmware search paths and upload status.