// Rasterises public/icon.svg into the PNG icons the PWA manifest needs.
import sharp from 'sharp'
const svg = 'public/icon.svg'
for (const [f, s] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]])
  await sharp(svg).resize(s, s).png().toFile('public/' + f)
console.log('icons written')
