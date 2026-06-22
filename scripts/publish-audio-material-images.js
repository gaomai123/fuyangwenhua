const fs = require('fs');
const { spawnSync } = require('child_process');

const csvPath = process.argv[2] || 'C:/Users/Administrator/Desktop/音响/提取图片/全部图片清单.csv';

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

function getMeta(row) {
  const sourceType = row['来源类型'];
  const folder = row['文件夹'];
  const name = row.Name;
  const number = name.replace(/\.[^.]+$/, '');

  if (sourceType === 'PDF') {
    if (folder.includes('400平方以下')) {
      return {
        title: `400㎡以下酒吧扩声方案资料图 ${number}`,
        category: 'JBL酒吧扩声方案图册',
        brand: 'JBL',
        summary: '400㎡以下酒吧扩声方案 PDF 提取资料图。',
        sort: 49
      };
    }

    if (folder.includes('400-500')) {
      return {
        title: `400-500㎡酒吧扩声方案资料图 ${number}`,
        category: 'JBL酒吧扩声方案图册',
        brand: 'JBL',
        summary: '400-500㎡酒吧扩声方案 PDF 提取资料图。',
        sort: 48
      };
    }

    if (folder.includes('600-800')) {
      return {
        title: `600-800㎡酒吧扩声方案资料图 ${number}`,
        category: 'JBL酒吧扩声方案图册',
        brand: 'JBL',
        summary: '600-800㎡酒吧扩声方案 PDF 提取资料图。',
        sort: 47
      };
    }

    return {
      title: `500㎡以内民谣集方案资料图 ${number}`,
      category: '民谣集整体方案图册',
      brand: '福洋民谣集',
      summary: '500㎡以内民谣集整体方案 PDF 提取资料图。',
      sort: 46
    };
  }

  if (folder.includes('音响设备清单')) {
    return {
      title: `音响设备清单资料图 ${number}`,
      category: '音响设备清单图册',
      brand: '音响设备清单',
      summary: '音响设备清单 Excel 提取产品图。',
      sort: 45
    };
  }

  return {
    title: `音乐中心单价表资料图 ${number}`,
    category: '音乐中心单价表图册',
    brand: '音乐中心单价表',
    summary: '音乐中心单价表 Excel 提取产品图。',
    sort: 44
  };
}

const baseFileId = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/audio-materials-20260622/提取图片';
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''));
const headers = rows[0] || [];
const now = new Date().toISOString();

const products = rows.slice(1).map((cells, index) => {
  const row = {};
  headers.forEach((header, cellIndex) => {
    row[header] = cells[cellIndex] || '';
  });

  const meta = getMeta(row);
  const path = row['来源类型'] === 'PDF'
    ? `${baseFileId}/PDF图片/${row['文件夹']}/${row.Name}`
    : `${baseFileId}/${row['文件夹']}/${row.Name}`;

  return {
    name: meta.title,
    category: meta.category,
    brand: meta.brand,
    cover_url: path,
    image_urls: path,
    summary: meta.summary,
    specs: `资料来源：${row['来源类型']} / ${row['文件夹']} / ${row.Name}`,
    detail: '该资料图来自已整理并上传的批发资料包，可用于甲方查看产品图片、方案图片和后续选品沟通。',
    contact_wechat: '',
    contact_phone: '',
    status: 'published',
    sort_order: meta.sort - index / 1000,
    updated_at: now,
    created_at: now
  };
});

const updates = products.map((product) => ({
  q: { name: product.name },
  u: { $set: product },
  multi: false,
  upsert: true
}));

let exitCode = 0;

for (let index = 0; index < updates.length; index += 4) {
  const batch = updates.slice(index, index + 4);
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

console.log(`Published ${products.length} material image records.`);
process.exit(exitCode);
