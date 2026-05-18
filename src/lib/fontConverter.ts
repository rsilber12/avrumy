import { inflateSync } from "fflate";
import { Font, woff2 } from "fonteditor-core";

const WOFF2_WASM_URL = "/wasm/fonteditor-woff2.wasm";
let woff2InitPromise: Promise<unknown> | null = null;

function fontTypeFromBuffer(buffer: ArrayBuffer): "woff" | "woff2" {
  if (buffer.byteLength < 4) throw new Error("File is too small to be a font");
  const signature = new DataView(buffer).getUint32(0, false);
  if (signature === 0x774f4646) return "woff";
  if (signature === 0x774f4632) return "woff2";
  throw new Error("Unsupported file (expected .woff or .woff2)");
}

async function ensureWoff2Ready() {
  if (woff2.isInited()) return;
  woff2InitPromise ??= woff2.init(WOFF2_WASM_URL);
  await woff2InitPromise;
}

function toUint8Array(output: ArrayBuffer | Uint8Array | Buffer | string): Uint8Array {
  if (typeof output === "string") throw new Error("Unexpected text font output");
  if (output instanceof Uint8Array) return new Uint8Array(output);
  return new Uint8Array(output);
}

export async function convertFontToTtf(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer();
  const type = fontTypeFromBuffer(buffer);

  if (type === "woff2") await ensureWoff2Ready();

  const font = Font.create(buffer, {
    type,
    hinting: true,
    kerning: true,
    compound2simple: false,
    inflate: (data) => Array.from(inflateSync(new Uint8Array(data))),
  });

  return toUint8Array(font.write({ type: "ttf", hinting: true, kerning: true, toBuffer: false }));
}

export function ttfFileName(originalName: string): string {
  return originalName.replace(/\.(woff2?|WOFF2?)$/, "") + ".ttf";
}