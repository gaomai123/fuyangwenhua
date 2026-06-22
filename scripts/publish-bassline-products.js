const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const sourceGroup = 'bassline-2026';
const baseFileId = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/bassline-20260623/images';

function retailText(value) {
  return `零售价 ¥${String(value)}`;
}

const products = [
  {
    source_key: 'bassline-2026-P15',
    name: 'BASSLINE P15',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'P15',
    scene: 'LIVE现场',
    type: '全频音箱',
    retail: '3165.5',
    image: 'image3.png',
    specs: `两分频 全频音箱
低频单元尺寸：1X15″
高频单元尺寸：1X1.4″号角喉管
阻抗：常规被动（内）分频时，8欧；
频响：47HZ-20KHZ
分频点：1.1KHZ
灵敏度：99db SPL Nominal 1瓦 at 1米
最大声压级：133-136db
（高频）辐射角度：水平：50-100° 垂直：55°
允许的功放机功率：常规被动（内）分频时，1000-2000W 8欧 每通道
物理特征：有舞台监听斜度`
  },
  {
    source_key: 'bassline-2026-P12',
    name: 'BASSLINE P12',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'P12',
    scene: 'LIVE现场',
    type: '全频音箱',
    retail: '2077.4',
    image: 'image3.png',
    specs: `两分频 全频音箱
低频单元尺寸：1X12″
高频单元尺寸：1X1″号角喉管
阻抗：常规被动（内）分频时，8欧；
频响：57HZ-20KHZ
分频点：1.8KHZ
灵敏度：99db SPL Nominal 1瓦 at 1米
最大声压级：130-133db
（高频）辐射角度：水平：50-100° 垂直：55°
允许的功放机功率：常规被动（内）分频时，500-1000W 8欧 每通道
物理特征：有舞台监听斜度`
  },
  {
    source_key: 'bassline-2026-S18',
    name: 'BASSLINE S18',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'S18',
    scene: 'LIVE现场',
    type: '超低音',
    retail: '2899',
    image: 'image2.png',
    specs: `使用1只18寸t铁氧体磁低音单元
频率响应28Hz~ 500Hz(+/-3 dB)
额定功率：800瓦
峰值功率：1600瓦
最大声压级：130dB`
  },
  {
    source_key: 'bassline-2026-K12',
    name: 'BASSLINE K12',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'K12',
    scene: 'K歌房',
    type: 'K歌音箱',
    retail: '1807',
    image: 'image1.png',
    specs: `系统类型12“，2路，低音反射
频率响应（-10dB）55 Hz-20 kHz
灵敏度：99分贝
标称阻抗：8欧姆
最大声压级（1米）：125分贝（峰值131分贝）
额功率连续：500W-1000W
覆盖范围：70°x 60°（高x高）
1 x 12英寸低音
1 x 1英寸高音`
  },
  {
    source_key: 'bassline-2026-K10',
    name: 'BASSLINE K10',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'K10',
    scene: 'K歌房',
    type: 'K歌音箱',
    retail: '1547',
    image: 'image1.png',
    specs: `系统类型10“，2路，低音反射
频率响应（-10dB）55 Hz-20 kHz
灵敏度：99分贝
标称阻抗：8欧姆
最大声压级（1米）：122分贝（峰值128分贝）
额功率连续：500W-1000W
覆盖范围：70°x 60°（高x高）
1 x 10英寸低音
1 x 1英寸高音`
  },
  {
    source_key: 'bassline-2026-S15',
    name: 'BASSLINE S15',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'S15',
    scene: 'K歌房',
    type: 'K歌超低音',
    retail: '2067',
    image: 'image7.png',
    specs: `使用1只15寸t铁氧体磁低音单元
频率响应32Hz~ 500Hz(+/-3 dB)
额定功率：800瓦
峰值功率：1600瓦
最大声压级：130dB`
  },
  {
    source_key: 'bassline-2026-S12',
    name: 'BASSLINE S12',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'S12',
    scene: '鸡尾酒吧',
    type: '超低音',
    retail: '1677',
    image: 'image6.png',
    specs: `使用1只12寸t铁氧体磁低音单元
频率响应28Hz~ 500Hz(+/-3 dB)
额定功率：600瓦
峰值功率：1200瓦
最大声压级：127dB`
  },
  {
    source_key: 'bassline-2026-P5',
    name: 'BASSLINE P5',
    category: '音响展示',
    brand: 'BASSLINE',
    model: 'P5',
    scene: '鸡尾酒吧',
    type: '全频音箱',
    retail: '1027',
    image: 'image4.jpeg',
    specs: `低频单元尺寸：1X5″
高频单元尺寸：1X1″
阻抗：常规被动（内）分频时，4欧；
频响：50HZ-20KHZ
分频点：1.5KHZ
灵敏度：90db SPL Nominal 1瓦 at 1米
最大声压级：109dB
（高频）辐射角度：水平：100° 垂直：100°
允许的功放机功率：100-200W 4欧 每通道`
  }
];

function toRecord(product, index) {
  const coverUrl = `${baseFileId}/${product.image}`;
  const priceText = retailText(product.retail);
  const summary = `${product.scene} / ${product.type}，${priceText}`;
  const detail = [
    `型号：${product.model}`,
    `应用场景：${product.scene}`,
    `产品类型：${product.type}`,
    priceText,
    '',
    product.specs
  ].join('\n');

  return {
    source_group: sourceGroup,
    source_key: product.source_key,
    name: product.name,
    category: product.category,
    brand: product.brand,
    model: product.model,
    cover_url: coverUrl,
    image_urls: coverUrl,
    price_text: priceText,
    summary,
    specs: `${priceText}\n${product.specs}`,
    detail,
    contact_wechat: '',
    contact_phone: '',
    status: 'published',
    sort_order: 260 - index,
    updated_at: now,
    created_at: now
  };
}

function runNosql(innerCommand) {
  const command = JSON.stringify([
    {
      TableName: 'wholesale_products',
      CommandType: 'UPDATE',
      Command: JSON.stringify(innerCommand)
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
}

runNosql({
  update: 'wholesale_products',
  updates: [
    {
      q: { source_group: sourceGroup },
      u: { $set: { status: 'hidden', updated_at: now } },
      multi: true,
      upsert: false
    }
  ]
});

const records = products.map(toRecord);

for (let index = 0; index < records.length; index += 4) {
  runNosql({
    update: 'wholesale_products',
    updates: records.slice(index, index + 4).map((record) => ({
      q: { source_key: record.source_key },
      u: { $set: record },
      multi: false,
      upsert: true
    }))
  });
}

console.log(`Published ${records.length} BASSLINE product records with retail prices only.`);
