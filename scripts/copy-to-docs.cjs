#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const distDir = path.join(__dirname, '../dist');
const docsDir = path.join(__dirname, '../docs');

// Function to recursively copy files
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy dist to docs
if (fs.existsSync(distDir)) {
  console.log('Copying dist/ to docs/...');
  copyDir(distDir, docsDir);
  // Preserve legacy /public/ URLs without leaving an older administrative panel online.
  copyDir(path.join(__dirname, '../public'), path.join(docsDir, 'public'));
  console.log('✅ Files copied successfully!');
} else {
  console.error('❌ dist/ folder not found');
  process.exit(1);
}
