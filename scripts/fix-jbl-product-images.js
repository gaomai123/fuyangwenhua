const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const rm815Image = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/first-batch-covers/07_JBL_RM815_product.png';
const gc15Image = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/first-batch-covers/08_JBL_GC15_product.png';

const innerCommand = JSON.stringify({
  update: 'wholesale_products',
  updates: [
    {
      q: { name: 'JBL RM815 高级15寸全频扬声器' },
      u: {
        $set: {
          cover_url: rm815Image,
          image_urls: rm815Image,
          updated_at: now
        }
      },
      multi: false,
      upsert: false
    },
    {
      q: { name: 'JBL GC15 高级15寸全频扬声器' },
      u: {
        $set: {
          cover_url: gc15Image,
          image_urls: gc15Image,
          updated_at: now
        }
      },
      multi: false,
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
  { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }
);

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.status || 0);
