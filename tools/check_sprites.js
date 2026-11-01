/* 校验 char-map 精灵的行宽一致性（本地检查，不进游戏） */
const fs = require('fs');
const src = fs.readFileSync('js/art.js', 'utf8');

const re = /const\s+([A-Z0-9_]+)\s*=\s*\[\s*\n([\s\S]*?)\n\s*\];/g;
let m;
let bad = 0;
while ((m = re.exec(src))) {
  const name = m[1];
  const rows = [...m[2].matchAll(/'([^']*)'/g)].map((r) => r[1]);
  if (!rows.length) continue;
  const lens = rows.map((r) => r.length);
  const max = Math.max(...lens);
  const min = Math.min(...lens);
  if (max !== min) {
    bad++;
    console.log(`\n[${name}] widths ${min}..${max}`);
    rows.forEach((r, i) => {
      if (r.length !== max) console.log(`  row ${i}: len=${r.length}  "${r}"`);
    });
  }
}
console.log(bad ? `\n${bad} sprite(s) with ragged rows` : 'all char-maps aligned');
