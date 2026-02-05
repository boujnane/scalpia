import sharp from 'sharp';

async function main() {
  const input = 'public/Artset/ArtsetEB10.png';
  const output = 'public/Artset/ArtsetEB10-trimmed.png';

  const meta = await sharp(input).metadata();
  console.log('Original:', meta.width + 'x' + meta.height);

  const trimmed = await sharp(input)
    .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 }, threshold: 10 })
    .toBuffer();

  const trimmedMeta = await sharp(trimmed).metadata();
  console.log('Trimmed:', trimmedMeta.width + 'x' + trimmedMeta.height);

  await sharp(trimmed).png({ compressionLevel: 9 }).toFile(output);
  console.log('Saved to:', output);
}

main();
