import pako from "pako";
// @ts-ignore - no types
import wawoff from "wawoff2";

/** Convert a WOFF ArrayBuffer to TTF (sfnt) bytes. */
function woffToTtf(buf: ArrayBuffer): Uint8Array {
  const view = new DataView(buf);
  const src = new Uint8Array(buf);

  const signature = view.getUint32(0, false);
  if (signature !== 0x774f4646) throw new Error("Not a WOFF file");

  const flavor = view.getUint32(4, false);
  const numTables = view.getUint16(12, false);

  // Build sfnt header
  const HEADER_SIZE = 12;
  const DIR_ENTRY_SIZE = 16;

  // Compute searchRange, entrySelector, rangeShift
  let entrySelector = 0;
  let searchRange = 1;
  while (searchRange * 2 <= numTables) {
    searchRange *= 2;
    entrySelector++;
  }
  searchRange *= 16;
  const rangeShift = numTables * 16 - searchRange;

  // First pass: decompress tables, compute total size
  type Tbl = { tag: number; data: Uint8Array; origLength: number; origChecksum: number };
  const tables: Tbl[] = [];
  let offset = HEADER_SIZE + numTables * DIR_ENTRY_SIZE;
  const tableData: { tag: number; data: Uint8Array; checksum: number; offset: number }[] = [];

  for (let i = 0; i < numTables; i++) {
    const base = 44 + i * 20;
    const tag = view.getUint32(base, false);
    const offsetSrc = view.getUint32(base + 4, false);
    const compLength = view.getUint32(base + 8, false);
    const origLength = view.getUint32(base + 12, false);
    const origChecksum = view.getUint32(base + 16, false);

    let data: Uint8Array;
    if (compLength !== origLength) {
      data = pako.inflate(src.subarray(offsetSrc, offsetSrc + compLength));
    } else {
      data = src.subarray(offsetSrc, offsetSrc + compLength);
    }
    if (data.length !== origLength) {
      // ok, trust origLength
    }
    tables.push({ tag, data, origLength, origChecksum });
  }

  // Layout tables (4-byte aligned)
  let totalSize = HEADER_SIZE + numTables * DIR_ENTRY_SIZE;
  for (const t of tables) {
    tableData.push({ tag: t.tag, data: t.data, checksum: t.origChecksum, offset: totalSize });
    totalSize += t.data.length;
    while (totalSize % 4 !== 0) totalSize++;
  }

  const out = new Uint8Array(totalSize);
  const outView = new DataView(out.buffer);

  outView.setUint32(0, flavor, false);
  outView.setUint16(4, numTables, false);
  outView.setUint16(6, searchRange, false);
  outView.setUint16(8, entrySelector, false);
  outView.setUint16(10, rangeShift, false);

  // Sort tables by tag for directory
  const sortedIdx = tableData.map((_, i) => i).sort((a, b) => tableData[a].tag - tableData[b].tag);

  sortedIdx.forEach((idx, i) => {
    const t = tableData[idx];
    const dirOff = HEADER_SIZE + i * DIR_ENTRY_SIZE;
    outView.setUint32(dirOff, t.tag, false);
    outView.setUint32(dirOff + 4, t.checksum, false);
    outView.setUint32(dirOff + 8, t.offset, false);
    outView.setUint32(dirOff + 12, t.data.length, false);
  });

  for (const t of tableData) {
    out.set(t.data, t.offset);
  }

  return out;
}

/** Convert a WOFF2 ArrayBuffer to TTF bytes using wawoff2. */
async function woff2ToTtf(buf: ArrayBuffer): Promise<Uint8Array> {
  const input = new Uint8Array(buf);
  const out = await wawoff.decompress(input);
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}

export async function convertFontToTtf(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  const name = file.name.toLowerCase();
  if (name.endsWith(".woff2")) return woff2ToTtf(buf);
  if (name.endsWith(".woff")) return woffToTtf(buf);
  // Sniff by magic
  const sig = new DataView(buf).getUint32(0, false);
  if (sig === 0x774f4632) return woff2ToTtf(buf);
  if (sig === 0x774f4646) return woffToTtf(buf);
  throw new Error("Unsupported file (expected .woff or .woff2)");
}

export function ttfFileName(originalName: string): string {
  return originalName.replace(/\.(woff2?|WOFF2?)$/, "") + ".ttf";
}
