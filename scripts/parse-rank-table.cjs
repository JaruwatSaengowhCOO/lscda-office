const fs = require('fs');
const c = fs.readFileSync('ref-doc/DistrictAttorneyManual/LosSantosCountyDistrictAttorneysManual.html', 'utf8');
const b = c.match(/<body[^>]*>([\s\S]*)<\/body>/i);
const body = b ? b[1] : '';

// Find all tables in body
const tables = [...body.matchAll(/<table[\s\S]*?<\/table>/gi)];
console.log('Tables found:', tables.length);

tables.forEach((t, ti) => {
  console.log('\n=== Table', ti, '===');
  const rows = [...t[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  rows.slice(0, 20).forEach((r, ri) => {
    const cells = [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    const texts = cells.map(c => c[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    const colspans = cells.map(c => {
      const m = c[0].match(/colspan="(\d+)"/);
      return m ? parseInt(m[1]) : 1;
    });
    console.log(`Row ${ri}:`, texts.map((t, i) => colspans[i] > 1 ? `[HEADER:${t}]` : t));
  });
});
