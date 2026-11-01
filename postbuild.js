const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');

if (fs.existsSync(outDir)) {
  // 1. Create .nojekyll to prevent GitHub Pages Jekyll from hiding _next folder
  const nojekyllPath = path.join(outDir, '.nojekyll');
  fs.writeFileSync(nojekyllPath, '');
  console.log('✓ Created out/.nojekyll for GitHub Pages');

  // 2. Clone index.html to 404.html for seamless SPA fallback on GitHub Pages
  const indexPath = path.join(outDir, 'index.html');
  const notFoundPath = path.join(outDir, '404.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
    console.log('✓ Cloned out/index.html to out/404.html for SPA routing');
  }
}
