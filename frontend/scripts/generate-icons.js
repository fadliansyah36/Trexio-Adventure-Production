const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const buildDir = path.join(__dirname, '..', 'build');

const svgIconPath = path.join(publicDir, 'logo-icon.svg');
const svgMaskablePath = path.join(publicDir, 'logo-icon-maskable.svg');

const iconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-384.png', size: 384 },
  { name: 'icon-512.png', size: 512 },
];

const maskableSizes = [
  { name: 'icon-maskable-192.png', size: 192 },
  { name: 'icon-maskable-512.png', size: 512 },
];

async function generateIcons() {
  console.log('Generating PWA Icons from SVG...');

  const targets = [publicDir];
  if (fs.existsSync(buildDir)) {
    targets.push(buildDir);
  }

  for (const targetDir of targets) {
    for (const icon of iconSizes) {
      const outputPath = path.join(targetDir, icon.name);
      await sharp(svgIconPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);
      console.log(`Generated: ${outputPath} (${icon.size}x${icon.size})`);
    }

    for (const icon of maskableSizes) {
      const outputPath = path.join(targetDir, icon.name);
      await sharp(svgMaskablePath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);
      console.log(`Generated Maskable: ${outputPath} (${icon.size}x${icon.size})`);
    }

    // Also copy SVG files to buildDir if it exists
    if (targetDir === buildDir) {
      fs.copyFileSync(svgIconPath, path.join(buildDir, 'logo-icon.svg'));
      fs.copyFileSync(svgMaskablePath, path.join(buildDir, 'logo-icon-maskable.svg'));
    }
  }

  console.log('PWA Icons generation completed successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
