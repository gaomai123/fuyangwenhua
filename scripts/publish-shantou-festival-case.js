const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const baseFileId = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/festival-cases/shantou-20260623';

const record = {
  source_key: 'shantou-festival-2025-video-181950',
  title: '汕头音乐节',
  location: '汕头',
  tag: '热',
  cover_url: `${baseFileId}/cover.jpg`,
  cover_preview_url: `${baseFileId}/cover.jpg`,
  video_url: `${baseFileId}/2025-02-01-181950.mov`,
  summary: '汕头音乐节现场视频案例，展示城市街区音乐现场、观众互动与舞台执行效果。',
  detail: '本案例用于展示福洋文化音乐节现场执行能力，包含舞台演出、现场氛围、城市街区活动落地与观众互动效果。',
  status: 'published',
  sort_order: 280,
  updated_at: now,
  created_at: now
};

const command = JSON.stringify([
  {
    TableName: 'festival_cases',
    CommandType: 'UPDATE',
    Command: JSON.stringify({
      update: 'festival_cases',
      updates: [
        {
          q: { source_key: record.source_key },
          u: { $set: record },
          multi: false,
          upsert: true
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

console.log('Published Shantou festival case.');
