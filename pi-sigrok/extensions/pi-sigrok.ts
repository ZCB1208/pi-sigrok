/**
 * pi-sigrok — Logic Analyzer Extension for Pi
 *
 * Provides tools to control sigrok-compatible logic analyzers (e.g. DreamSourceLab DSLogic)
 * directly from Pi. Enables scanning for devices, configuring captures, and decoding protocols.
 *
 * Tools:
 *   sigrok_scan             — Scan for connected logic analyzer devices
 *   sigrok_capture          — Capture and decode digital signals
 *   sigrok_list_decoders    — List available protocol decoders
 *   sigrok_protocol_info    — Show details about a specific protocol decoder
 *
 * Install: copy to ~/.pi/agent/extensions/ or .pi/extensions/
 */

import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SIGROK_CLI = "sigrok-cli";
const DEFAULT_DRIVER = "dreamsourcelab-dslogic";

export default function (pi: ExtensionAPI) {
	/** Run a sigrok-cli command and return stdout text */
	async function runSigrok(args: string[], signal?: AbortSignal): Promise<string> {
		const result = await pi.exec(SIGROK_CLI, args, { signal });
		if (result.code !== 0) {
			throw new Error(
				`sigrok-cli failed (exit ${result.code}): ${(result.stderr || result.stdout).slice(0, 1000)}`,
			);
		}
		return result.stdout;
	}

	// ═══════════════════════════════════════════════════════════
	// Tool 1: sigrok_scan — 扫描连接的逻辑分析仪设备
	// ═══════════════════════════════════════════════════════════
	pi.registerTool({
		name: "sigrok_scan",
		label: "Sigrok Scan",
		description:
			"Scan for connected sigrok-compatible logic analyzer devices (e.g. DreamSourceLab DSLogic). " +
			"Returns a list of detected devices with their connection strings and channel counts. " +
			"Use this first to discover the device connection identifier needed by sigrok_capture.",
		promptSnippet: "Scan for connected logic analyzers via sigrok",
		promptGuidelines: [
			"Use sigrok_scan first to discover connected logic analyzer devices before calling sigrok_capture.",
			"The returned connection string (e.g. 'conn=1.36') is required by sigrok_capture.",
		],
		parameters: Type.Object({}),

		async execute(_toolCallId, _params, signal, _onUpdate, _ctx) {
			const output = await runSigrok([
				`--driver=${DEFAULT_DRIVER}`,
				"--scan",
			], signal);

			const lines = output.trim().split("\n");
			const devices = lines
				.filter((l) => l.includes(`${DEFAULT_DRIVER}:`))
				.map((l) => {
					const connMatch = l.match(/conn=([\d.]+)/);
					const nameMatch = l.match(/-\s+(.+?)(?:\s+with|\s*$)/);
					const chMatch = l.match(/(\d+)\s+channel/);
					return {
						connection: connMatch ? `conn=${connMatch[1]}` : "unknown",
						name: nameMatch ? nameMatch[1].trim() : l,
						channels: chMatch ? parseInt(chMatch[1]) : undefined,
					};
				});

			const summary = devices.length > 0
				? `Found ${devices.length} device(s):\n` +
				  devices.map((d) =>
						`  • ${d.name} — ${d.connection}${d.channels ? `, ${d.channels} channels` : ""}`
					).join("\n")
				: `No ${DEFAULT_DRIVER} devices found. Check USB connection and driver.`;

			return {
				content: [{ type: "text", text: summary }],
				details: { devices, raw: output },
			};
		},
	});

	// ═══════════════════════════════════════════════════════════
	// Tool 2: sigrok_list_decoders — 列出可用的协议解码器
	// ═══════════════════════════════════════════════════════════
	pi.registerTool({
		name: "sigrok_list_decoders",
		label: "Sigrok List Decoders",
		description:
			"List all available protocol decoders supported by sigrok. Use this to discover " +
			"which protocols (UART, SPI, I2C, CAN, 1-Wire, etc.) can be used for signal decoding.",
		promptSnippet: "List available sigrok protocol decoders",
		promptGuidelines: [
			"Use sigrok_list_decoders to discover which protocol decoders are available for sigrok_capture.",
		],
		parameters: Type.Object({
			search: Type.Optional(
				Type.String({
					description:
						"Optional keyword to filter decoders (e.g. 'uart', 'spi', 'i2c', 'can', 'one_wire'). " +
						"Case-insensitive partial match against decoder name and description.",
				}),
			),
		}),

		async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
			const output = await runSigrok(["--list-supported"], signal);

			// Extract protocol decoder section from output
			const decoderSection = output.split("Supported protocol decoders:")[1] ?? "";
			const decoders = decoderSection
				.split("\n")
				.map((l) => l.trim())
				.filter((l) => l.length > 0 && !l.startsWith("Supported") && !l.startsWith("---"))
				.map((l) => {
					const match = l.match(/^(\S+)\s+- (.+)/);
					return match
						? { name: match[1], description: match[2] }
						: { name: l, description: "" };
				});

			const filtered = params.search
				? decoders.filter(
					(d) =>
						d.name.toLowerCase().includes(params.search!.toLowerCase()) ||
						d.description.toLowerCase().includes(params.search!.toLowerCase()),
				)
				: decoders;

			const text = filtered.length > 0
				? `Available protocol decoders${params.search ? ` matching "${params.search}"` : ""} (${filtered.length}):\n` +
				  filtered
					.slice(0, 200)
					.map((d) => `  • ${d.name} — ${d.description || "(no description)"}`)
					.join("\n") +
				  (filtered.length > 200 ? `\n  ... and ${filtered.length - 200} more` : "")
				: params.search
					? `No decoders found matching "${params.search}". Try different keywords or call without search for full list.`
					: "No protocol decoders available.";

			return {
				content: [{ type: "text", text }],
				details: { decoders, count: filtered.length, search: params.search },
			};
		},
	});

	// ═══════════════════════════════════════════════════════════
	// Tool 3: sigrok_protocol_info — 查看协议解码器详细信息
	// ═══════════════════════════════════════════════════════════
	pi.registerTool({
		name: "sigrok_protocol_info",
		label: "Sigrok Protocol Info",
		description:
			"Show detailed information about a specific protocol decoder, " +
			"including its input channels, configurable options/parameters, and annotation classes. " +
			"Use this to understand how to configure a decoder before using sigrok_capture.",
		promptSnippet: "Show protocol decoder details and configuration options",
		promptGuidelines: [
			"Use sigrok_protocol_info to learn about a decoder's channel names and options before calling sigrok_capture.",
		],
		parameters: Type.Object({
			decoder: Type.String({
				description:
					"Decoder name (e.g. 'uart', 'spi', 'i2c', 'one_wire', 'ir_nec', 'can', 'dmx512'). " +
					"Use sigrok_list_decoders first to discover available decoder names.",
			}),
		}),

		async execute(_toolCallId, params, signal, _onUpdate, _ctx) {
			const output = await runSigrok([
				"--show",
				"--protocol-decoders", params.decoder,
			], signal);

			return {
				content: [{ type: "text", text: `Decoder details for "${params.decoder}":\n${output}` }],
				details: { decoder: params.decoder, info: output },
			};
		},
	});

	// ═══════════════════════════════════════════════════════════
	// Tool 4: sigrok_capture — 采集并解码数字信号
	// ═══════════════════════════════════════════════════════════
	pi.registerTool({
		name: "sigrok_capture",
		label: "Sigrok Capture",
		description:
			"Capture and decode digital signals from a logic analyzer using sigrok-cli. " +
			"Supports configuring samplerate, channels, trigger conditions, protocol decoders (UART, SPI, I2C, etc.), " +
			"and capture duration. Returns decoded annotation data. " +
			"Use sigrok_scan first to get the device connection string.",
		promptSnippet: "Capture and decode signals from a logic analyzer",
		promptGuidelines: [
			"Call sigrok_scan first to discover the device connection string before using sigrok_capture.",
			"For UART decoding, set protocol like 'uart:baudrate=9600:rx=0' or 'uart:baudrate=115200:rx=0:tx=1'.",
			"For SPI decoding, set protocol like 'spi:miso=0:mosi=1:clk=2:cs=3'.",
			"For I2C decoding, set protocol like 'i2c:scl=0:sda=1'.",
			"Set samplerate at least 4x the signal frequency for reliable decoding (e.g. 4MHz for 1MHz SPI).",
			"Max capture duration is 30 seconds. For longer captures use saveFile to store raw data.",
		],
		parameters: Type.Object({
			connection: Type.String({
				description:
					"Device connection string from sigrok_scan (e.g. 'conn=1.36'). " +
					"Use 'auto' to auto-detect the first available DSLogic device.",
			}),
			protocol: Type.String({
				description:
					"Protocol decoder name and configuration parameters. " +
					"Format: 'decoder_name:option1=value1:option2=value2'. " +
					"Examples:\n" +
					"  • 'uart:baudrate=9600:rx=0' — UART at 9600 baud, RX on channel 0\n" +
					"  • 'uart:baudrate=115200:rx=0:tx=1' — UART with both RX and TX\n" +
					"  • 'spi:miso=0:mosi=1:clk=2:cs=3' — SPI with explicit pins\n" +
					"  • 'i2c:scl=0:sda=1' — I2C on channels 0 and 1\n" +
					"Use sigrok_protocol_info to see available options for each decoder.",
			}),
			samplerate: Type.Optional(
				Type.Number({
					description:
						"Sample rate in Hz (default: 1000000 = 1 MHz). " +
						"Must be at least 4x the signal frequency. " +
						"Common values: 100000 (100 kHz), 1000000 (1 MHz), 10000000 (10 MHz), 100000000 (100 MHz).",
				}),
			),
			channels: Type.Optional(
				Type.String({
					description:
						"Channels to capture (default: '0'). " +
						"Can be a range like '0-3', specific channels like '0,1,2', or all channels '0-15'. " +
						"Capturing fewer channels allows higher effective samplerate on some devices.",
				}),
			),
			annotation: Type.Optional(
				Type.String({
					description:
						"Specific decoder annotation to display (default: all annotations). " +
						"Examples: 'uart=rx-data' for UART RX data only, 'spi=miso-data' for SPI MISO data. " +
						"Use sigrok_protocol_info to see available annotation classes for a decoder.",
				}),
			),
			duration: Type.Optional(
				Type.Number({
					description:
						"Capture duration in milliseconds (default: 3000 = 3 seconds, max: 30000 = 30 seconds). " +
						"Mutually exclusive with samples.",
				}),
			),
			samples: Type.Optional(
				Type.Number({
					description:
						"Number of samples to acquire instead of capturing by time. " +
						"Mutually exclusive with duration. " +
						"Example: 1000000 samples at 1 MHz = 1 second of data.",
				}),
			),
			trigger: Type.Optional(
				Type.String({
					description:
						"Trigger condition to start capture. Format: 'channel=value'. " +
						"Values: 0 = falling edge / low, 1 = rising edge / high, r = rising edge, f = falling edge, " +
						"R = rising edge with glitch filter, F = falling edge with glitch filter. " +
						"Examples: '0=1' (trigger on channel 0 going high), '0=0,1=1' (ch0 low AND ch1 high).",
				}),
			),
			waitTrigger: Type.Optional(
				Type.Boolean({
					description:
						"Wait for trigger condition before starting capture (default: true if trigger is set, false otherwise).",
				}),
			),
			saveFile: Type.Optional(
				Type.String({
					description:
						"Optional path to save the full capture as a sigrok session file (.sr). " +
						"The .sr file can be opened in PulseView for detailed visual analysis later. " +
						"Relative paths are resolved against the project directory.",
				}),
			),
		}),

		async execute(_toolCallId, params, signal, onUpdate, _ctx) {
			onUpdate?.({
				content: [{ type: "text", text: `Starting capture: ${params.protocol} on ${params.connection}...` }],
			});

			// Build sigrok-cli arguments
			const args: string[] = [];
			const deviceConn = params.connection === "auto"
				? DEFAULT_DRIVER
				: `${DEFAULT_DRIVER}:${params.connection}`;
			args.push("-d", deviceConn);

			// Samplerate
			const samplerate = params.samplerate ?? 1_000_000;
			args.push("-c", `samplerate=${samplerate}`);

			// Channels
			const channels = params.channels ?? "0";
			args.push("-C", channels);

			// Trigger
			if (params.trigger) {
				args.push("-t", params.trigger);
				if (params.waitTrigger !== false) {
					args.push("-w");
				}
			} else if (params.waitTrigger) {
				args.push("-w");
			}

			// Protocol decoder
			args.push("-P", params.protocol);

			// Annotation filter
			if (params.annotation) {
				args.push("-A", params.annotation);
			}

			// Duration or samples
			if (params.samples) {
				args.push("--samples", String(params.samples));
			} else {
				const duration = Math.min(params.duration ?? 3000, 30000);
				args.push("--time", String(duration));
			}

			// Save to file
			if (params.saveFile) {
				args.push("-o", params.saveFile);
			}

			// Execute capture
			const output = await runSigrok(args, signal);

			// Parse output into structured annotation data
			const lines = output.trim().split("\n").filter((l) => l.length > 0);
			const annotations = lines.map((l) => {
				const match = l.match(/^([\w-]+-\d+):\s+(.+)/);
				if (match) {
					return { type: match[1], value: match[2] };
				}
				return { type: "raw", value: l };
			});

			// Build summary
			const samplerateStr = samplerate >= 1_000_000
				? `${(samplerate / 1_000_000).toFixed(1)} MHz`
				: samplerate >= 1_000
					? `${(samplerate / 1_000).toFixed(0)} kHz`
					: `${samplerate} Hz`;

			const stats = {
				device: deviceConn,
				samplerate: samplerateStr,
				channels,
				protocol: params.protocol,
				annotation: params.annotation ?? "all",
				duration: params.samples ? `${params.samples} samples` : `${params.duration ?? 3000} ms`,
				dataPoints: annotations.length,
				saveFile: params.saveFile ?? null,
			};

			const header = [
				`📊 Capture Summary:`,
				`   Device:      ${stats.device}`,
				`   Samplerate:  ${stats.samplerate}`,
				`   Channels:    ${stats.channels}`,
				`   Protocol:    ${stats.protocol}`,
				`   Annotation:  ${stats.annotation}`,
				`   Duration:    ${stats.duration}`,
				`   Data points: ${stats.dataPoints}`,
				stats.saveFile ? `   Saved to:    ${stats.saveFile}` : "",
			].filter(Boolean).join("\n");

			const dataBlock = annotations.length > 0
				? `\n\n📝 Decoded Data:\n` +
				  annotations
					.slice(0, 500)
					.map((a) => `   ${a.type}: ${a.value}`)
					.join("\n") +
				  (annotations.length > 500
					? `\n   ... and ${annotations.length - 500} more entries`
					: "")
				: "\n\n⚠️  No data decoded. Possible causes:\n" +
				  "   • Wrong channel assignment in protocol parameters\n" +
				  "   • Incorrect baud rate or protocol settings\n" +
				  "   • No signal activity on the selected channels\n" +
				  "   • Signal voltage incompatible with logic analyzer thresholds";

			return {
				content: [{ type: "text", text: header + dataBlock }],
				details: {
					stats,
					annotations: annotations.slice(0, 2000),
					totalAnnotations: annotations.length,
					truncated: annotations.length > 2000,
					raw: output,
				},
			};
		},
	});
}