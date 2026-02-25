#!/usr/bin/env node

/**
 * Seed script to migrate existing artwork to R2 and KV.
 *
 * Usage:
 *   1. Make sure you have wrangler installed and authenticated
 *   2. Ensure the R2 bucket and KV namespace exist
 *   3. Run: npm run seed
 *
 * This uploads assets/images/robot.png to R2 and writes the initial
 * artworks array to KV. Only needs to be run once.
 */

const { execSync } = require('child_process');
const { resolve } = require('path');

const projectRoot = resolve(__dirname, '..');

const artworks = [
  {
    id: 'robot',
    title: 'A silly robot',
    year: '2023',
    imageKey: 'robot.png',
    alt: 'A silly robot',
  },
];

console.log('Uploading robot.png to R2...');
try {
  execSync(
    `npx wrangler r2 object put miladoyle-artwork/robot.png --file=${resolve(projectRoot, 'assets/images/robot.png')} --content-type=image/png --remote`,
    { cwd: projectRoot, stdio: 'inherit' }
  );
  console.log('Done.');
} catch (e) {
  console.error('Failed to upload image. Make sure the R2 bucket exists.');
  process.exit(1);
}

console.log('Writing artworks data to KV...');
try {
  const json = JSON.stringify(artworks);
  execSync(
    `npx wrangler kv key put --namespace-id=1ebfdaf753704940b1e038644efe2d08 artworks '${json}' --remote`,
    { cwd: projectRoot, stdio: 'inherit' }
  );
  console.log('Done.');
} catch (e) {
  console.error('Failed to write KV data. Make sure the KV namespace exists and wrangler.jsonc has the correct ID.');
  process.exit(1);
}

console.log('\nSeed complete! Your existing artwork is now in R2 and KV.');
