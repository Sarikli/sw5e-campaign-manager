import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.resolve(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`Missing ${indexPath}`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

const headTags = [
  '<meta name="theme-color" content="#0B0F17" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="SW5e Manager" />',
  '<link rel="manifest" href="/manifest.json" />',
  '<link rel="apple-touch-icon" href="/icons/icon-192.png" />',
].join('\n    ');

const swScript = `<script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
      }
    </script>`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `    ${headTags}\n  </head>`);
}

if (!html.includes("serviceWorker.register('/sw.js')")) {
  html = html.replace('</body>', `    ${swScript}\n  </body>`);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Injected PWA metadata and service worker registration into dist/index.html');
