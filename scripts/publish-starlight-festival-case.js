const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const baseFileId = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/festival-cases/starlight-20260623';

const record = {
  source_key: 'starlight-festival-2026-video-img6810',
  title: '星光音乐节',
  location: '星光现场',
  tag: '热',
  cover_url: `${baseFileId}/cover.jpg`,
  cover_preview_url: `${baseFileId}/cover.jpg`,
  video_url: `${baseFileId}/IMG_6810.MOV`,
  summary: '星光音乐节现场视频案例，展示舞台视觉、现场氛围与音乐节执行效果。',
  detail: '本案例用于展示福洋文化音乐节现场执行能力，包含舞台视觉呈现、现场互动氛围、品牌露出及活动落地效果。',
  status: 'published',
  sort_order: 290,
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

console.log('Published Starlight festival case.');
