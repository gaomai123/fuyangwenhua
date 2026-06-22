const fs = require('fs');
const { spawnSync } = require('child_process');

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: node scripts/update-wholesale-products-from-csv.js <csv-path>');
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(value);
      if (row.some((item) => item.trim())) {
        rows.push(row);
      }
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((item) => item.trim())) {
    rows.push(row);
  }

  return rows;
}

const renameForExistingRows = {
  '400平以下酒吧扩声方案': '400㎡以下酒吧扩声方案',
  '400-500平酒吧扩声方案': '400-500㎡酒吧扩声方案',
  '600-800平酒吧扩声方案': '600-800㎡酒吧扩声方案',
  '500平以内民谣集整体方案': '500㎡以内民谣集整体方案'
};

const text = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(text);
const headers = rows[0] || [];
const now = new Date().toISOString();

const updates = rows.slice(1).map((cells) => {
  const row = {};
  headers.forEach((header, index) => {
    row[header] = cells[index] || '';
  });

  const name = renameForExistingRows[row.name] || row.name;

  return {
    q: { name },
    u: {
      $set: {
        name,
        category: row.category,
        brand: row.brand,
        summary: row.summary,
        specs: row.specs,
        detail: row.detail,
        cover_url: row.cover_url,
        image_urls: row.image_urls,
        contact_wechat: row.contact_wechat,
        contact_phone: row.contact_phone,
        status: 'published',
        sort_order: Number(row.sort_order || 0),
        updated_at: now
      }
    },
    multi: false,
    upsert: false
  };
});

updates.push({
  q: { name: '民谣演出音箱套装' },
  u: { $set: { status: 'hidden', updated_at: now } },
  multi: false,
  upsert: false
});

updates.push({
  q: { name: '吉他与乐器配件组合' },
  u: { $set: { status: 'hidden', updated_at: now } },
  multi: false,
  upsert: false
});

let exitCode = 0;

for (let index = 0; index < updates.length; index += 3) {
  const batch = updates.slice(index, index + 3);
  const innerCommand = JSON.stringify({
    update: 'wholesale_products',
    updates: batch
  });
  const command = JSON.stringify([
    {
      TableName: 'wholesale_products',
      CommandType: 'UPDATE',
      Command: innerCommand
    }
  ]);

  const result = spawnSync(
    'cmd.exe',
    ['/c', 'tcb.cmd', 'db', 'nosql', 'execute', '--json', '--command', command],
    { encoding: 'utf8' }
  );

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status) {
    exitCode = result.status;
    break;
  }
}

process.exit(exitCode);
