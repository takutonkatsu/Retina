const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const assets = [
  'style.css',
  'script.js',
  'README.md',
  'LICENSE',
  'privacy.html',
  'Retina_icon.png',
  'Retina_icon_background.png',
  'share_img.png',
  'favicon.ico',
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!html.includes('src="capacitor.js"')) {
  html = html.replace(
    '    <script src="script.js"></script>',
    '    <script src="capacitor.js"></script>\n    <script src="script.js"></script>',
  );
}
fs.writeFileSync(path.join(dist, 'index.html'), html);

for (const asset of assets) {
  fs.copyFileSync(path.join(root, asset), path.join(dist, asset));
}

console.log(`Built Capacitor web assets in ${dist}`);
