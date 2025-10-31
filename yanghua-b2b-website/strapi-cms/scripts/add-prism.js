const fs=require('fs');
const p='src/admin/app.tsx';
if (!fs.existsSync(p)) { console.error('file not found'); process.exit(1); }
let s=fs.readFileSync(p,'utf8');
if (!s.includes('prismjs')) {
  s=s.replace(/^(import[^\n]*'@strapi\/strapi\/admin';\n)/, "$1import 'prismjs';\n");
  fs.writeFileSync(p,s);
  console.log('updated');
} else {
  console.log('already');
}
