const { spawnSync } = require('child_process');

const now = new Date().toISOString();
const base = 'cloud://cloud1-d6gpw3i9686e94bf4.636c-cloud1-d6gpw3i9686e94bf4-1433995474/wholesale/audio-materials-20260622/提取图片/音乐中心单价表';

const mediaToFile = {
  'media/image1.png': '001.png',
  'media/image10.png': '002.png',
  'media/image11.png': '003.png',
  'media/image12.jpeg': '004.jpeg',
  'media/image13.png': '005.png',
  'media/image14.jpeg': '006.jpeg',
  'media/image15.png': '007.png',
  'media/image16.jpeg': '008.jpeg',
  'media/image17.jpeg': '009.jpeg',
  'media/image18.png': '010.png',
  'media/image19.jpeg': '011.jpeg',
  'media/image2.jpeg': '012.jpeg',
  'media/image20.png': '013.png',
  'media/image21.png': '014.png',
  'media/image22.png': '015.png',
  'media/image23.jpeg': '016.jpeg',
  'media/image24.png': '017.png',
  'media/image25.jpeg': '018.jpeg',
  'media/image26.png': '019.png',
  'media/image27.jpeg': '020.jpeg',
  'media/image28.png': '021.png',
  'media/image29.png': '022.png',
  'media/image3.png': '023.png',
  'media/image30.jpeg': '024.jpeg',
  'media/image31.jpeg': '025.jpeg',
  'media/image32.png': '026.png',
  'media/image33.png': '027.png',
  'media/image34.jpeg': '028.jpeg',
  'media/image35.png': '029.png',
  'media/image36.png': '030.png',
  'media/image37.jpeg': '031.jpeg',
  'media/image38.jpeg': '032.jpeg',
  'media/image39.png': '033.png',
  'media/image4.png': '034.png',
  'media/image40.jpeg': '035.jpeg',
  'media/image41.png': '036.png',
  'media/image42.jpeg': '037.jpeg',
  'media/image43.png': '038.png',
  'media/image44.png': '039.png',
  'media/image45.jpeg': '040.jpeg',
  'media/image46.jpeg': '041.jpeg',
  'media/image47.png': '042.png',
  'media/image48.jpeg': '043.jpeg',
  'media/image49.jpeg': '044.jpeg',
  'media/image5.png': '045.png',
  'media/image50.jpeg': '046.jpeg',
  'media/image6.jpeg': '047.jpeg',
  'media/image7.png': '048.png',
  'media/image8.png': '049.png',
  'media/image9.png': '050.png'
};

const rows = [
  ['雅马哈 STAGE套鼓', 'media/image2.jpeg'],
  ['美得理MZ928', 'media/image4.png'],
  ['麦尔 拜占庭', 'media/image1.png'],
  ['remo手鼓', 'media/image3.png'],
  ['remo手鼓', 'media/image3.png'],
  ['舒尔psm一拖二', 'media/image5.png'],
  ['张音 手镲', 'media/image7.png'],
  ['声卡托盘', 'media/image8.png'],
  ['莱维特 BEATKIT 鼓麦套装', 'media/image9.png'],
  ['ipad支架', 'media/image10.png'],
  ['舒尔psm300一拖二', 'media/image11.png'],
  ['麦克风 支架', 'media/image13.png'],
  ['声卡托盘', 'media/image14.jpeg'],
  ['鼓凳', 'media/image15.png'],
  ['ipad支架', 'media/image16.jpeg'],
  ['乐手耳返 P16HQ', 'media/image18.png'],
  ['麦克风 支架', 'media/image20.png'],
  ['P16D', 'media/image21.png'],
  ['鼓凳', 'media/image22.png'],
  ['键盘 飞机架', 'media/image24.png'],
  ['吊镲架', 'media/image25.jpeg'],
  ['节拍器 rw200 全套带支架电源', 'media/image26.png'],
  ['音束', 'media/image12.jpeg'],
  ['键盘 吧台椅', 'media/image28.png'],
  ['乐手耳返 P16HQ', 'media/image17.jpeg'],
  ['吉他 立架', 'media/image29.png'],
  ['P16D', 'media/image30.jpeg'],
  ['线材', 'media/image32.png'],
  ['键盘 飞机架', 'media/image23.jpeg'],
  ['键盘踏板', 'media/image33.png'],
  ['节拍器 rw200 全套带支架电源', 'media/image34.jpeg'],
  ['百灵达 DI100', 'media/image35.png'],
  ['亚克力 鼓房', 'media/image31.jpeg'],
  ['麦克 BETA58A', 'media/image36.png'],
  ['键盘 吧台椅', 'media/image37.jpeg'],
  ['矮款麦克风支架', 'media/image39.png'],
  ['地鼓 麦克风架', 'media/image40.jpeg'],
  ['PG58', 'media/image41.png'],
  ['吉他 立架', 'media/image29.png'],
  ['SLXD24/ BETA58A 一拖二', 'media/image43.png'],
  ['科林线材', 'media/image27.jpeg'],
  ['数字调音台', 'media/image44.png'],
  ['键盘踏板', 'media/image45.jpeg'],
  ['sm57', 'media/image47.png'],
  ['百灵达 DI100', 'media/image48.jpeg'],
  ['手镲支架', 'media/image25.jpeg'],
  ['地鼓麦 BETA91A', 'media/image38.jpeg'],
  ['乐器 电容麦 sm57', 'media/image49.jpeg'],
  ['麦克 BETA58A', 'media/image19.jpeg'],
  ['PG58', 'media/image42.jpeg'],
  ['SLXD24/ BETA58A 一拖二', 'media/image6.jpeg'],
  ['调音台 迈达斯 M32', 'media/image50.jpeg'],
  ['地鼓 开孔圈', 'media/image46.jpeg']
];

function normalizeName(name) {
  return name
    .replace(/\s+/g, ' ')
    .replace(/^ipad/i, 'iPad')
    .replace(/^sm57$/i, 'SM57')
    .replace(/^PG58$/i, 'PG58')
    .replace(/^P16D$/i, 'P16D')
    .trim();
}

function inferBrand(name) {
  if (name.includes('雅马哈')) return '雅马哈';
  if (name.includes('美得理')) return '美得理';
  if (name.includes('麦尔')) return '麦尔';
  if (/remo/i.test(name)) return 'remo';
  if (name.includes('舒尔') || name.includes('BETA58A') || name.includes('PG58') || /SLXD24/i.test(name) || /^SM57$/i.test(name)) return '舒尔';
  if (name.includes('张音')) return '张音';
  if (name.includes('莱维特')) return '莱维特';
  if (name.includes('百灵达') || name.includes('P16') || name.includes('DI100')) return '百灵达';
  if (name.includes('迈达斯')) return '迈达斯';
  if (name.includes('科林')) return '科林';
  return '音乐中心';
}

function buildProduct(row, index) {
  const [rawName, media] = row;
  const name = normalizeName(rawName);
  const file = mediaToFile[media];

  if (!file) {
    throw new Error(`Missing media mapping: ${media}`);
  }

  return {
    source_key: `music-center-${String(index + 1).padStart(2, '0')}`,
    name,
    category: '乐器',
    brand: inferBrand(name),
    cover_url: `${base}/${file}`,
    image_urls: `${base}/${file}`,
    summary: `${name}，来自音乐中心单价表，可用于门店设备配置、演出补货和批发选品沟通。`,
    specs: '资料来源：音乐中心单价表；具体型号、规格、数量和报价以实际沟通确认为准。',
    detail: '该产品资料来自已整理的音乐中心单价表。前台统一展示“批发价联系我们”，可通过微信或电话进一步确认库存、规格和批量采购方案。',
    contact_wechat: '',
    contact_phone: '',
    status: 'published',
    sort_order: 200 - index,
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
      q: { category: '乐器' },
      u: { $set: { status: 'hidden', updated_at: now } },
      multi: true,
      upsert: false
    }
  ]
});

const products = rows.map(buildProduct);

for (let index = 0; index < products.length; index += 6) {
  const batch = products.slice(index, index + 6).map((product) => ({
    q: { source_key: product.source_key },
    u: { $set: product },
    multi: false,
    upsert: true
  }));

  runNosql({
    update: 'wholesale_products',
    updates: batch
  });
}

console.log(`Published ${products.length} music center instrument records.`);
