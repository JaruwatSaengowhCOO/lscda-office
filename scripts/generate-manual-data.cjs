const fs = require('fs');
const path = require('path');

// Image URL: served via /api/manual-images/<dir>/images/<file>
function imageUrl(dir, src) {
  // src is like "images/image1.png"
  return `/api/manual-images/${dir}/${src}`;
}

function getText(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function parseTable(tableHtml, imageDir) {
  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const parsed = [];

  rows.forEach(r => {
    const cells = [...r[1].matchAll(/<t([dh])([^>]*)>([\s\S]*?)<\/t[dh]>/gi)];
    const cellData = cells.map(c => {
      const colspanMatch = c[2].match(/colspan="(\d+)"/);
      const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
      const isHeader = c[1] === 'h';
      const inner = c[3];

      // Check for image
      const imgMatch = inner.match(/src="([^"]+)"/);
      const imgSrc = imgMatch ? imgMatch[1] : null;

      const text = getText(inner);

      return {
        text,
        colspan,
        isHeader,
        image: imgSrc ? imageUrl(imageDir, imgSrc) : null,
      };
    });

    // Determine if this is a group header row (colspan=2, single cell)
    if (cellData.length === 1 && cellData[0].colspan >= 2) {
      parsed.push({ type: 'group', label: cellData[0].text });
    } else if (cellData.length > 0) {
      parsed.push({ type: 'row', cells: cellData });
    }
  });

  return parsed;
}

function parseManual(file, key, imageDir) {
  const c = fs.readFileSync(file, 'utf8');
  const b = c.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = b ? b[1] : '';

  // Split into segments by h2
  const h2re = /<h2([^>]*)>([\s\S]*?)<\/h2>/gi;
  const h2s = [...body.matchAll(h2re)];

  const chapters = [];

  h2s.forEach((h2match, hi) => {
    const heading = getText(h2match[2]);
    if (!heading) return;

    const start = body.indexOf(h2match[0]) + h2match[0].length;
    const nextH2 = h2s[hi + 1];
    const end = nextH2 ? body.indexOf(nextH2[0]) : body.length;
    const section = body.substring(start, end);

    const chapter = { heading, paragraphs: [], sections: [], tables: [] };

    // Parse tables in this chapter
    const tableMatches = [...section.matchAll(/<table[\s\S]*?<\/table>/gi)];
    const tablePositions = tableMatches.map(m => ({
      start: section.indexOf(m[0]),
      end: section.indexOf(m[0]) + m[0].length,
      data: parseTable(m[0], imageDir),
    }));

    // Replace tables with placeholders to avoid double-parsing
    let bodySection = section;
    tableMatches.forEach((m, ti) => {
      bodySection = bodySection.replace(m[0], `__TABLE_${ti}__`);
    });

    // Parse h3 sections
    const h3re = /<h3([^>]*)>([\s\S]*?)<\/h3>/gi;
    const h3s = [...bodySection.matchAll(h3re)];

    let curSection = null;

    // Tokenize: h3 + p + ul
    const tokenRe = /<h3([^>]*)>([\s\S]*?)<\/h3>|<p([^>]*)>([\s\S]*?)<\/p>|<ul([^>]*)>([\s\S]*?)<\/ul>/gi;
    const tokens = [...bodySection.matchAll(tokenRe)];

    tokens.forEach(t => {
      if (t[2] !== undefined) {
        // h3
        const htext = getText(t[2]);
        if (!htext) return;
        curSection = { heading: htext, paragraphs: [] };
        chapter.sections.push(curSection);
      } else {
        // p or ul
        const raw = (t[4] !== undefined ? t[4] : t[6]) || '';

        // Check for table placeholder
        const tableRef = raw.match(/__TABLE_(\d+)__/);
        if (tableRef) {
          const ti = parseInt(tableRef[1]);
          chapter.tables.push({ afterSection: curSection ? curSection.heading : null, data: tablePositions[ti].data });
          return;
        }

        // bullet list
        let text = raw;
        if (t[6] !== undefined) {
          const bullets = [...raw.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
            .map(li => getText(li[1]))
            .filter(Boolean);
          text = bullets.map(b => `• ${b}`).join('\n');
        } else {
          text = getText(raw);
        }

        if (!text || text.length < 2) return;

        if (curSection) curSection.paragraphs.push(text);
        else chapter.paragraphs.push(text);
      }
    });

    // Attach tables that were outside tokenRe (direct table placeholder in chapter)
    tablePositions.forEach((tp, ti) => {
      const alreadyAttached = chapter.tables.find(t => t.data === tp.data);
      if (!alreadyAttached) {
        chapter.tables.push({ afterSection: null, data: tp.data });
      }
    });

    chapters.push(chapter);
  });

  return { key, chapters };
}

const outDir = 'src/app/dashboard/manuals';
fs.mkdirSync(outDir, { recursive: true });

const da = parseManual(
  'ref-doc/DistrictAttorneyManual/LosSantosCountyDistrictAttorneysManual.html',
  'da',
  'DistrictAttorneyManual'
);
const inv = parseManual(
  'ref-doc/DAInvestigatorManual/LosSantosCountyDistrictAttorneysManual.html',
  'investigator',
  'DAInvestigatorManual'
);

fs.writeFileSync(`${outDir}/da-manual-data.json`, JSON.stringify(da, null, 2), 'utf8');
fs.writeFileSync(`${outDir}/investigator-manual-data.json`, JSON.stringify(inv, null, 2), 'utf8');

// Summary
[da, inv].forEach(m => {
  console.log(`\n=== ${m.key} ===`);
  m.chapters.forEach(ch => {
    console.log(`  CH: ${ch.heading} | paras:${ch.paragraphs.length} secs:${ch.sections.length} tables:${ch.tables.length}`);
    ch.tables.forEach(t => console.log(`    TABLE rows:${t.data.length}`));
  });
});
