CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  user_id INTEGER,
  stage_name TEXT NOT NULL,
  real_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wechat TEXT,
  province TEXT,
  city TEXT NOT NULL,
  district TEXT,
  dispatch_cities TEXT,
  tags TEXT NOT NULL,
  height INTEGER,
  age INTEGER,
  gender TEXT,
  category TEXT,
  singing_type TEXT,
  bio TEXT,
  price TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_unit TEXT,
  salary_note TEXT,
  internal_remark TEXT,
  avatar_url TEXT,
  photo_urls TEXT,
  art_photo_urls TEXT,
  life_photo_urls TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  review_status TEXT NOT NULL DEFAULT 'pending',
  work_status TEXT NOT NULL DEFAULT 'available',
  is_hidden INTEGER NOT NULL DEFAULT 0,
  reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT NOT NULL UNIQUE,
  unionid TEXT,
  nickname TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  artist_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id INTEGER NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  event_time TEXT,
  budget TEXT,
  requirement TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE IF NOT EXISTS festival_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  city TEXT,
  event_date TEXT,
  cooperation_type TEXT,
  requirement TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS festival_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  tag TEXT,
  cover_url TEXT,
  video_url TEXT,
  summary TEXT,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  cover_url TEXT,
  summary TEXT,
  content TEXT,
  image_urls TEXT,
  video_url TEXT,
  is_top INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wholesale_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cover_url TEXT,
  image_urls TEXT,
  summary TEXT,
  specs TEXT,
  detail TEXT,
  contact_wechat TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artist_status_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  artist_id INTEGER NOT NULL,
  current_status TEXT NOT NULL,
  requested_status TEXT NOT NULL,
  reason TEXT,
  admin_remark TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES customers(id),
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);
