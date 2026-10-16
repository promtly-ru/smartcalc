import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Две иконки: светлая тема (build/icon.svg) и тёмная (build/icon-dark.svg).
// Светлая — иконка .exe и ярлыков; обе — иконка окна/панели задач, меняется вместе с темой.
const variants = [
  { theme: 'light', svg: readFileSync(join(root, 'build', 'icon.svg')) },
  { theme: 'dark', svg: readFileSync(join(root, 'build', 'icon-dark.svg')) },
];

const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
const icoSizes = [16, 24, 32, 48, 64, 128, 256];

mkdirSync(join(root, 'electron', 'icons'), { recursive: true });

for (const { theme, svg } of variants) {
  const pngs = [];
  for (const size of sizes) {
    const png = await sharp(svg, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    if (icoSizes.includes(size)) pngs.push(png);
    if (theme === 'light' && size === 512) writeFileSync(join(root, 'build', 'icon.png'), png);
    if (theme === 'light' && size === 256) writeFileSync(join(root, 'build', 'icon-256.png'), png);
  }

  const ico = await pngToIco(pngs);
  writeFileSync(join(root, 'electron', 'icons', `icon-${theme}.ico`), ico);
  if (theme === 'light') writeFileSync(join(root, 'build', 'icon.ico'), ico);

  writeFileSync(join(root, 'public', theme === 'light' ? 'icon.svg' : 'icon-dark.svg'), svg);
}

// Телефоны и PWA
const png = (svg, size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
const light = variants[0].svg;
const maskable = readFileSync(join(root, 'build', 'icon-maskable.svg'));
writeFileSync(join(root, 'public', 'pwa-192.png'), await png(light, 192));
writeFileSync(join(root, 'public', 'pwa-512.png'), await png(light, 512));
writeFileSync(join(root, 'public', 'pwa-maskable-512.png'), await png(maskable, 512));
// iOS сам скругляет углы и не любит прозрачность — берём версию на весь квадрат
writeFileSync(join(root, 'public', 'apple-touch-icon.png'), await png(maskable, 180));

// Android (Capacitor): иконки лаунчера и заставка поверх шаблонных
const res = join(root, 'android', 'app', 'src', 'main', 'res');
if (existsSync(res)) {
  const fg = readFileSync(join(root, 'build', 'icon-android-fg.svg'));
  const bg = readFileSync(join(root, 'build', 'icon-android-bg.svg'));
  const circle = (s) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/></svg>`);
  // плотность → [иконка 48dp, слой адаптивной иконки 108dp]
  const densities = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
  for (const [d, [icon, layer]] of Object.entries(densities)) {
    const dir = join(res, `mipmap-${d}`);
    writeFileSync(join(dir, 'ic_launcher.png'), await png(light, icon));
    const round = await sharp(await png(maskable, icon)).composite([{ input: circle(icon), blend: 'dest-in' }]).png().toBuffer();
    writeFileSync(join(dir, 'ic_launcher_round.png'), round);
    writeFileSync(join(dir, 'ic_launcher_foreground.png'), await png(fg, layer));
    writeFileSync(join(dir, 'ic_launcher_background.png'), await png(bg, layer));
  }
  // Фон адаптивной иконки — наш градиент вместо белого цвета из шаблона
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  writeFileSync(join(res, 'mipmap-anydpi-v26', 'ic_launcher.xml'), adaptive);
  writeFileSync(join(res, 'mipmap-anydpi-v26', 'ic_launcher_round.xml'), adaptive);

  // Заставка (Android 11 и старше): иконка по центру на тёмном фоне, размеры как у шаблонных
  for (const dir of readdirSync(res).filter((n) => n.startsWith('drawable'))) {
    const file = join(res, dir, 'splash.png');
    if (!existsSync(file)) continue;
    const { width, height } = await sharp(file).metadata();
    const size = Math.round(Math.min(width, height) * 0.28);
    const splash = await sharp({ create: { width, height, channels: 4, background: '#171717' } })
      .composite([{ input: await png(light, size), gravity: 'center' }])
      .png()
      .toBuffer();
    writeFileSync(file, splash);
  }
}

console.log('Wrote build/icon.{png,ico}, electron/icons/icon-{light,dark}.ico, public/icon{,-dark}.svg, PWA/iOS icons' + (existsSync(res) ? ', Android icons + splash' : ''));
