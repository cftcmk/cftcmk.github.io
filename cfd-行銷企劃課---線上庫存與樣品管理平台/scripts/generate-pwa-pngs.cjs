const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with 1 byte filter (0x00) per row
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  // Brand colors
  // BG gradient: #7da8a3 (125, 168, 163) to #568781 (86, 135, 129)
  // White slats: 255, 255, 255
  const marginRatio = isMaskable ? 0.22 : 0.14;
  const minX = Math.floor(width * marginRatio);
  const maxX = Math.floor(width * (1 - marginRatio));
  const minY = Math.floor(height * (marginRatio + 0.04));
  const maxY = Math.floor(height * (1 - marginRatio - 0.04));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // None filter

    const t = y / height;
    const bgR = Math.round(125 * (1 - t) + 86 * t);
    const bgG = Math.round(168 * (1 - t) + 135 * t);
    const bgB = Math.round(163 * (1 - t) + 129 * t);

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      let r = bgR;
      let g = bgG;
      let b = bgB;
      let a = 255;

      // Draw shade slats inside container
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        const localY = (y - minY) / (maxY - minY);
        // Headrail
        if (localY < 0.15) {
          r = 255; g = 255; b = 255;
        }
        // Slats: 4 horizontal bars
        else if (
          (localY > 0.22 && localY < 0.34) ||
          (localY > 0.40 && localY < 0.52) ||
          (localY > 0.58 && localY < 0.70)
        ) {
          r = 245; g = 250; b = 248;
        }
        // Bottom Rail
        else if (localY > 0.78 && localY < 0.92) {
          r = 255; g = 255; b = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate all required PWA icons
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));

console.log('Successfully generated all PWA icons in /public:');
console.log('- apple-touch-icon.png (180x180)');
console.log('- pwa-192x192.png (192x192)');
console.log('- pwa-512x512.png (512x512)');
console.log('- pwa-maskable-512x512.png (512x512)');
