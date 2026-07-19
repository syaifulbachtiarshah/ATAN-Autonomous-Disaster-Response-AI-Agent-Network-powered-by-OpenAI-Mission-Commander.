import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const env = {
  VITE_PUBLIC_APP_URL: process.env.VITE_PUBLIC_APP_URL || '',
  VITE_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || '',
  VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
};

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(sourcePath, destinationPath);
    else fs.copyFileSync(sourcePath, destinationPath);
  }
}

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'env.js'), `window.__ENV__=${JSON.stringify(env)};\n`);

const html = fs.readFileSync('index.html', 'utf8').replace('/build/src/main.js', '/src/main.js');
fs.writeFileSync(path.join(distDir, 'index.html'), html);

if (fs.existsSync('.env.example')) fs.copyFileSync('.env.example', path.join(distDir, '.env.example'));
copyDirectory('public', distDir);
copyDirectory('build/src', path.join(distDir, 'src'));
fs.copyFileSync('src/styles.css', path.join(distDir, 'src/styles.css'));
