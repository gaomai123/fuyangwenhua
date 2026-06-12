const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'artist.db');
const schemaPath = path.join(__dirname, 'schema.sql');

let db;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function handleResult(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function createDefaultAdmin() {
  const existingAdmin = await get('SELECT id FROM admins WHERE username = ?', ['admin']);

  if (existingAdmin) {
    return;
  }

  await run(
    'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
    ['admin', hashPassword('admin123')]
  );
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);

  if (exists) {
    return;
  }

  await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function migrateArtistsTable() {
  const columns = [
    ['customer_id', 'INTEGER'],
    ['user_id', 'INTEGER'],
    ['wechat', 'TEXT'],
    ['province', 'TEXT'],
    ['district', 'TEXT'],
    ['dispatch_cities', 'TEXT'],
    ['category', 'TEXT'],
    ['singing_type', 'TEXT'],
    ['salary_min', 'INTEGER'],
    ['salary_max', 'INTEGER'],
    ['salary_unit', 'TEXT'],
    ['salary_note', 'TEXT'],
    ['internal_remark', 'TEXT'],
    ['art_photo_urls', 'TEXT'],
    ['life_photo_urls', 'TEXT'],
    ['review_status', "TEXT NOT NULL DEFAULT 'pending'"],
    ['work_status', "TEXT NOT NULL DEFAULT 'available'"],
    ['is_hidden', 'INTEGER NOT NULL DEFAULT 0']
  ];

  for (const [columnName, definition] of columns) {
    await addColumnIfMissing('artists', columnName, definition);
  }

  await run(
    `UPDATE artists
    SET review_status = status
    WHERE status IN ('pending', 'approved', 'rejected')
      AND COALESCE(NULLIF(review_status, ''), '') != status`
  );
  await run(
    `UPDATE artists
    SET work_status = COALESCE(NULLIF(work_status, ''), 'available')`
  );
}

async function migrateCustomersTable() {
  const columns = [
    ['unionid', 'TEXT'],
    ['role', "TEXT NOT NULL DEFAULT 'user'"],
    ['artist_id', 'INTEGER']
  ];

  for (const [columnName, definition] of columns) {
    await addColumnIfMissing('customers', columnName, definition);
  }

  await run(
    `UPDATE customers
    SET role = COALESCE(NULLIF(role, ''), 'user')`
  );

  await run(
    `UPDATE artists
    SET user_id = customer_id
    WHERE user_id IS NULL
      AND customer_id IS NOT NULL`
  );

  await run(
    `UPDATE customers
    SET role = 'artist',
        artist_id = (
          SELECT artists.id
          FROM artists
          WHERE (artists.customer_id = customers.id OR artists.user_id = customers.id)
            AND COALESCE(NULLIF(artists.review_status, ''), artists.status) = 'approved'
          ORDER BY artists.updated_at DESC, artists.id DESC
          LIMIT 1
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE EXISTS (
      SELECT 1
      FROM artists
      WHERE (artists.customer_id = customers.id OR artists.user_id = customers.id)
        AND COALESCE(NULLIF(artists.review_status, ''), artists.status) = 'approved'
    )`
  );
}

async function migrateNewsPostsTable() {
  const columns = [
    ['image_urls', 'TEXT'],
    ['video_url', 'TEXT'],
    ['is_top', 'INTEGER NOT NULL DEFAULT 0'],
    ['status', "TEXT NOT NULL DEFAULT 'draft'"],
    ['sort_order', 'INTEGER NOT NULL DEFAULT 0']
  ];

  for (const [columnName, definition] of columns) {
    await addColumnIfMissing('news_posts', columnName, definition);
  }
}

async function migrateArtistStatusRequestsTable() {
  const columns = [
    ['admin_remark', 'TEXT'],
    ['status', "TEXT NOT NULL DEFAULT 'pending'"]
  ];

  for (const [columnName, definition] of columns) {
    await addColumnIfMissing('artist_status_requests', columnName, definition);
  }
}

async function migrateFestivalCasesTable() {
  const columns = [
    ['tag', 'TEXT'],
    ['cover_url', 'TEXT'],
    ['video_url', 'TEXT'],
    ['summary', 'TEXT'],
    ['detail', 'TEXT'],
    ['status', "TEXT NOT NULL DEFAULT 'published'"],
    ['sort_order', 'INTEGER NOT NULL DEFAULT 0']
  ];

  for (const [columnName, definition] of columns) {
    await addColumnIfMissing('festival_cases', columnName, definition);
  }
}

async function migrateWholesaleProductsTable() {
  const columns = [
    ['image_urls', 'TEXT'],
    ['summary', 'TEXT'],
    ['specs', 'TEXT'],
    ['detail', 'TEXT'],
    ['contact_wechat', 'TEXT'],
    ['contact_phone', 'TEXT'],
    ['status', "TEXT NOT NULL DEFAULT 'draft'"],
    ['sort_order', 'INTEGER NOT NULL DEFAULT 0']
  ];

  for (const [columnName, definition] of columns) {
    await addColumnIfMissing('wholesale_products', columnName, definition);
  }
}

async function createDefaultNewsPosts() {
  const existing = await get('SELECT id FROM news_posts LIMIT 1');

  if (existing) {
    return;
  }

  await run(
    `INSERT INTO news_posts (
      title,
      category,
      cover_url,
      summary,
      content,
      is_top,
      status,
      sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '福洋文化音乐人平台动态上线',
      '平台公告',
      '/images/home-banner.jpg',
      '平台公告、招募通知、培训动态、音乐节资讯和合作信息将在这里集中发布。',
      '福洋文化音乐人平台动态模块已上线。后续平台公告、艺人招募、培训课程、音乐节合作和系统通知都会在这里同步更新。',
      1,
      'published',
      100
    ]
  );

  await run(
    `INSERT INTO news_posts (
      title,
      category,
      cover_url,
      summary,
      content,
      is_top,
      status,
      sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '全国艺人持续招募中',
      '招募通知',
      '/images/home-entry-artists.jpg',
      '歌手、乐手、DJ、Dancer、MC 均可通过平台投递资料。',
      '福洋文化音乐人平台持续招募优秀音乐人。提交资料后，平台工作人员会进行审核，并根据项目需求进行联系。',
      0,
      'published',
      90
    ]
  );
}

async function createDefaultFestivalCases() {
  const existing = await get('SELECT id FROM festival_cases LIMIT 1');

  if (existing) {
    return;
  }

  const defaults = [
    [
      '星光海岸音乐节',
      '厦门 / 环岛路音乐广场',
      '热',
      '/images/festival-cover.jpg',
      '/uploads/videos/1778242414510-926162111.mp4',
      '两日户外音乐现场，整合乐队、民谣、DJ 与互动市集，服务城市文旅夜经济场景。',
      '项目围绕海岸线夜游和城市青年客群设计，完成艺人统筹、舞台动线、视觉包装、现场执行与短视频传播内容协同。',
      'published',
      100
    ],
    [
      '潮音青年音乐节',
      '广州 / 长隆度假区',
      '新',
      '/images/home-entry-festival.jpg',
      '/uploads/videos/1778242414510-926162111.mp4',
      '聚焦青年文化与品牌互动，打造沉浸式音乐现场和商业合作体验区。',
      '以青年潮流、社交打卡和品牌互动为核心，配置多风格艺人阵容、主题舞台和联名内容，提升现场停留与传播效率。',
      'published',
      90
    ],
    [
      '城市节拍音乐节',
      '成都 / 东郊记忆',
      '荐',
      '/images/festival-cover.jpg',
      '/uploads/videos/1778242414510-926162111.mp4',
      '城市地标联动，音乐、生活方式与文旅商业共振传播。',
      '围绕城市更新空间和周末消费场景，提供从策划、招商、艺人、舞美到现场运营的一体化执行方案。',
      'published',
      80
    ],
    [
      '海岛夏日音乐节',
      '平潭 / 海坛古城外场',
      '夏',
      '/images/home-entry-festival.jpg',
      '/uploads/videos/1778242414510-926162111.mp4',
      '围绕海岛旅游旺季打造落日舞台、民谣演出和青年社交内容。',
      '项目结合海岛度假、夜游消费和本地文旅推广，配置落日民谣、电子派对、互动市集和短视频传播节点，适合文旅品牌和景区活动合作。',
      'published',
      70
    ]
  ];

  for (const item of defaults) {
    await run(
      `INSERT INTO festival_cases (
        title,
        location,
        tag,
        cover_url,
        video_url,
        summary,
        detail,
        status,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item
    );
  }
}

async function createDefaultWholesaleProducts() {
  const existing = await get('SELECT id FROM wholesale_products LIMIT 1');

  if (existing) {
    return;
  }

  const defaults = [
    [
      '民谣演出音箱套装',
      '音响设备',
      '/images/home-entry-training.jpg',
      '/images/home-entry-training.jpg,/images/home-banner.jpg',
      '适合小型演出、民谣驻唱、活动暖场使用的便携音箱套装。',
      '包含主音箱、支架、基础连接线；具体配置以实际批发沟通为准。',
      '产品用于展示批发品类，甲方提供正式图片和文案后可在后台替换。',
      'fuyangwenhua',
      '13800138000',
      'published',
      100
    ],
    [
      '吉他与乐器配件组合',
      '乐器',
      '/images/home-entry-artists.jpg',
      '/images/home-entry-artists.jpg',
      '面向培训机构、演出团队和门店的乐器及常用配件批发。',
      '支持按批次沟通型号、数量、颜色和配件组合。',
      '批发价联系我们，具体库存和交付周期以客服确认为准。',
      'fuyangwenhua',
      '13800138000',
      'published',
      90
    ]
  ];

  for (const item of defaults) {
    await run(
      `INSERT INTO wholesale_products (
        name,
        category,
        cover_url,
        image_urls,
        summary,
        specs,
        detail,
        contact_wechat,
        contact_phone,
        status,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item
    );
  }
}

async function initDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });

  db = new sqlite3.Database(dbPath);

  const schema = fs.readFileSync(schemaPath, 'utf8');

  await new Promise((resolve, reject) => {
    db.exec(schema, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await migrateArtistsTable();
  await migrateCustomersTable();
  await migrateNewsPostsTable();
  await migrateArtistStatusRequestsTable();
  await migrateFestivalCasesTable();
  await migrateWholesaleProductsTable();
  await createDefaultAdmin();
  await createDefaultNewsPosts();
  await createDefaultFestivalCases();
  await createDefaultWholesaleProducts();

  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('Database has not been initialized.');
  }

  return db;
}

module.exports = {
  all,
  get,
  getDatabase,
  hashPassword,
  initDatabase,
  run
};
