const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const sourceKeys = [
  'lanshan-festival-2026-video-s19712',
  'starlight-festival-2026-video-img6810',
  'shantou-festival-2025-video-181950'
];

const command = JSON.stringify([
  {
    TableName: 'festival_cases',
    CommandType: 'UPDATE',
    Command: JSON.stringify({
      update: 'festival_cases',
      updates: [
        {
          q: { source_key: { $in: sourceKeys } },
          u: { $set: { tag: '热', updated_at: now } },
          multi: true,
          upsert: false
        }
      ]
    })
  }
]);

const result = spawnSync(
  'cmd.exe',
  ['/c', 'tcb.cmd', 'db', 'nosql', 'execute', '--json', '--command', command],
  { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }
);

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status) {
  process.exit(result.status);
}

console.log('Updated festival case tags to 热.');
