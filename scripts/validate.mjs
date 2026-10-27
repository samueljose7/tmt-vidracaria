import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'public/index.html'), 'utf8');
const css = await readFile(path.join(root, 'src/styles.css'), 'utf8');
const fonts = await readFile(path.join(root, 'public/assets/fonts/fonts.css'), 'utf8');
const scripts = ['src/assets.js', 'src/components/content.js', 'src/main.js'];
for (const file of scripts) new vm.Script(await readFile(path.join(root, file), 'utf8'), { filename:file });
const files = [];
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)) files.push(path.join(root, match[1].startsWith('./src/') ? match[1] : 'public/'+match[1]));
for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) files.push(path.resolve(root, 'public/src', match[1]));
for (const match of fonts.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) files.push(path.resolve(root, 'public/assets/fonts', match[1]));
const manifest = JSON.parse(await readFile(path.join(root, 'asset-manifest.json'), 'utf8'));
for (const asset of manifest) files.push(path.join(root, 'public', asset.local));
for (const file of new Set(files)) {
  const s = await stat(file);
  if (!s.isFile() || !s.size) throw new Error(`Arquivo ausente ou vazio: ${file}`);
}
if (/chatgpt\.site|\.openai\/|siwc|fonts\.googleapis|images\.unsplash/.test(html+css+fonts)) throw new Error('Dependência externa de apresentação encontrada');
for (const match of html.matchAll(/href="#([^" ]+)"/g)) {
  if (!html.includes(`id="${match[1]}"`)) throw new Error(`Âncora ausente: ${match[1]}`);
}
console.log(`Validação concluída: sintaxe, âncoras e ${new Set(files).size} arquivos locais.`);
