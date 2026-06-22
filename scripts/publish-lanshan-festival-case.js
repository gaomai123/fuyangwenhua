const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const baseFileId = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/festival-cases/lanshan-20260623';

const record = {
  source_key: 'lanshan-festival-2026-video-s19712',
  title: '览山音乐节',
  location: '览山',
  tag: '热',
  cover_url: `${baseFileId}/cover.jpg`,
  cover_preview_url: `${baseFileId}/cover.jpg`,
  video_url: `${baseFileId}/S19712.MP4`,
  summary: '览山音乐节现场视频案例，展示音乐节现场氛围、舞台执行与观众互动效果。',
  detail: '本案例用于展示福洋文化音乐节项目现场执行能力，包含现场氛围、舞台呈现、观众互动及活动落地效果。',
  status: 'published',
  sort_order: 300,
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

console.log('Published Lanshan festival case.');
