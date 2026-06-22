const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const keepCategories = [
  '门店音响方案',
  '音响扩声设备',
  '音频设备',
  '麦克风',
  'JBL酒吧扩声方案图册',
  '民谣集整体方案图册',
  '音响设备清单图册'
];
const hideCategories = [
  '鼓类设备',
  '舞台配件',
  '音乐中心单价表图册'
];

const innerCommand = JSON.stringify({
  update: 'wholesale_products',
  updates: [
    {
      q: { category: { $in: hideCategories } },
      u: { $set: { status: 'hidden', updated_at: now } },
      multi: true,
      upsert: false
    },
    {
      q: { category: { $in: keepCategories } },
      u: { $set: { status: 'published', updated_at: now } },
      multi: true,
      upsert: false
    }
  ]
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

process.exit(result.status || 0);
