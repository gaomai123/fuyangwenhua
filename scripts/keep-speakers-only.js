const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const keepNames = [
  'L-ACOUSTICS A15i FOCUS 线声源阵列扬声器',
  'L-ACOUSTICS A15i WIDE 线声源阵列扬声器',
  'JBL RM815 高级15寸全频扬声器',
  'JBL GC15 高级15寸全频扬声器',
  'JBL 单18寸超低音扬声器',
  '唐龙太极 全频扬声器',
  '唐龙太极 超低频扬声器',
  '唐龙太极 矩阵全频扬声器'
];

const jblSubwoofer = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/audio-materials-20260622/提取图片/PDF图片/400平方以下酒吧扩声（美国JBL）2026.6.18(1)/003.jpg';
const jblRm815 = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/first-batch-covers/07_JBL_RM815_product.png';
const jblGc15 = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/first-batch-covers/08_JBL_GC15_product.png';
const taicheeFullRange = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/audio-materials-20260622/提取图片/PDF图片/2025民谣集（＜500m²）(1)/004.png';
const taicheeSubwoofer = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/audio-materials-20260622/提取图片/PDF图片/2025民谣集（＜500m²）(1)/006.jpg';
const taicheeMatrixFullRange = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/audio-materials-20260622/提取图片/PDF图片/2025民谣集（＜500m²）(1)/008.png';

const innerCommand = JSON.stringify({
  update: 'wholesale_products',
  updates: [
    {
      q: {},
      u: { $set: { status: 'hidden', updated_at: now } },
      multi: true,
      upsert: false
    },
    {
      q: { name: { $in: keepNames } },
      u: { $set: { status: 'published', category: '音响展示', updated_at: now } },
      multi: true,
      upsert: false
    },
    {
      q: { name: 'JBL RM815 高级15寸全频扬声器' },
      u: { $set: { cover_url: jblRm815, image_urls: jblRm815, updated_at: now } },
      multi: false,
      upsert: false
    },
    {
      q: { name: 'JBL GC15 高级15寸全频扬声器' },
      u: { $set: { cover_url: jblGc15, image_urls: jblGc15, updated_at: now } },
      multi: false,
      upsert: false
    },
    {
      q: { name: 'JBL 单18寸超低音扬声器' },
      u: {
        $set: {
          name: 'JBL 单18寸超低音扬声器',
          category: '音响展示',
          brand: 'JBL',
          cover_url: jblSubwoofer,
          image_urls: jblSubwoofer,
          summary: 'JBL 单18寸超低音扬声器，适合摆放在舞台两侧进行低频补强。',
          specs: '品牌：JBL；类型：单18寸超低音扬声器；摆位：舞台两侧；具体型号和报价以实物确认为准。',
          detail: '用于酒吧、演艺空间和 live house 扩声系统的低频补强，常见摆位为舞台两侧。',
          contact_wechat: '',
          contact_phone: '',
          status: 'published',
          sort_order: 111,
          updated_at: now,
          created_at: now
        }
      },
      multi: false,
      upsert: true
    },
    {
      q: { name: '唐龙太极 全频扬声器' },
      u: {
        $set: {
          name: '唐龙太极 全频扬声器',
          category: '音响展示',
          brand: '唐龙太极',
          cover_url: taicheeFullRange,
          image_urls: taicheeFullRange,
          summary: '唐龙太极 T.D TAICHEE 全频扬声器，来自 500㎡以内民谣集音响系统资料。',
          specs: '品牌：唐龙太极 / T.D TAICHEE；型号资料未明确标注，以实物和报价确认为准。',
          detail: '该音响资料来自已整理的 2025 民谣集酒吧音响系统解决方案，用于展示唐龙太极全频扩声设备。',
          contact_wechat: '',
          contact_phone: '',
          status: 'published',
          sort_order: 115,
          updated_at: now,
          created_at: now
        }
      },
      multi: false,
      upsert: true
    },
    {
      q: { name: '唐龙太极 超低频扬声器' },
      u: {
        $set: {
          name: '唐龙太极 超低频扬声器',
          category: '音响展示',
          brand: '唐龙太极',
          cover_url: taicheeSubwoofer,
          image_urls: taicheeSubwoofer,
          summary: '唐龙太极 T.D TAICHEE 超低频扬声器，适合门店扩声低频补强。',
          specs: '品牌：唐龙太极 / T.D TAICHEE；类型：超低频扬声器；型号资料未明确标注，以实物和报价确认为准。',
          detail: '该音响资料来自已整理的 2025 民谣集酒吧音响系统解决方案，用于展示唐龙太极超低频设备。',
          contact_wechat: '',
          contact_phone: '',
          status: 'published',
          sort_order: 114,
          updated_at: now,
          created_at: now
        }
      },
      multi: false,
      upsert: true
    },
    {
      q: { name: '唐龙太极 矩阵全频扬声器' },
      u: {
        $set: {
          name: '唐龙太极 矩阵全频扬声器',
          category: '音响展示',
          brand: '唐龙太极',
          cover_url: taicheeMatrixFullRange,
          image_urls: taicheeMatrixFullRange,
          summary: '唐龙太极 T.D TAICHEE 矩阵全频扬声器，适合门店扩声覆盖。',
          specs: '品牌：唐龙太极 / T.D TAICHEE；类型：矩阵全频扬声器；型号资料未明确标注，以实物和报价确认为准。',
          detail: '该音响资料来自已整理的 2025 民谣集酒吧音响系统解决方案，用于展示唐龙太极矩阵全频设备。',
          contact_wechat: '',
          contact_phone: '',
          status: 'published',
          sort_order: 113,
          updated_at: now,
          created_at: now
        }
      },
      multi: false,
      upsert: true
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
