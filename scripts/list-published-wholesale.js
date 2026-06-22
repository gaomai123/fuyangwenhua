const { spawnSync } = require('child_process');

const innerCommand = JSON.stringify({
  find: 'wholesale_products',
  filter: { status: 'published' },
  projection: {
    name: 1,
    category: 1,
    brand: 1,
    cover_url: 1,
    sort_order: 1
  },
  limit: 200
});

const command = JSON.stringify([
  {
    TableName: 'wholesale_products',
    CommandType: 'QUERY',
    Command: innerCommand
  }
]);

const result = spawnSync(
  'cmd.exe',
  ['/c', 'tcb.cmd', 'db', 'nosql', 'execute', '--json', '--command', command],
  { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }
);

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  process.exit(result.status);
}

const parsed = JSON.parse(result.stdout);
const docs = parsed.data.results[0] || [];
const sorted = docs.sort((a, b) => Number(b.sort_order || 0) - Number(a.sort_order || 0));
const byCategory = new Map();
const byCover = new Map();

sorted.forEach((item) => {
  byCategory.set(item.category, (byCategory.get(item.category) || 0) + 1);
  if (item.cover_url) {
    const list = byCover.get(item.cover_url) || [];
    list.push(item);
    byCover.set(item.cover_url, list);
  }
});

console.log(`published=${sorted.length}`);
console.log('categories=');
Array.from(byCategory.entries()).forEach(([category, count]) => {
  console.log(`${category}: ${count}`);
});
console.log('duplicates_by_cover=');
Array.from(byCover.values())
  .filter((items) => items.length > 1)
  .forEach((items) => {
    console.log(items.map((item) => `${item.name} [${item.category}]`).join(' || '));
  });
console.log('items=');
sorted.forEach((item) => {
  console.log(`${item.name}\t${item.category}\t${item.brand || ''}\t${item.cover_url || ''}`);
});
