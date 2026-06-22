const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function cleanString(value) {
  return String(value || '').trim();
}

function assertWebAdmin(event) {
  const secret = cleanString(process.env.WEB_ADMIN_SECRET);
  const inputSecret = cleanString(event.admin_key);

  if (!secret) {
    throw new Error('云函数未配置 WEB_ADMIN_SECRET');
  }

  if (!inputSecret || inputSecret !== secret) {
    throw new Error('后台密码不正确');
  }
}

async function writeOperationLog(event, action, detail = {}) {
  try {
    await db.collection('admin_operation_logs').add({
      data: {
        source: 'web',
        action,
        admin_key_suffix: cleanString(event.admin_key).slice(-4),
        detail,
        created_at: db.serverDate()
      }
    });
  } catch (error) {
    console.error('writeOperationLog failed', error);
  }
}

async function writeNotification(openid, title, content, type) {
  if (!openid) {
    return;
  }

  await db.collection('notifications').add({
    data: {
      openid,
      title,
      content,
      type,
      read: false,
      created_at: db.serverDate()
    }
  });
}

function getTimeValue(value) {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function withId(item) {
  return {
    ...item,
    id: item._id
  };
}

function sortByCreatedAt(data) {
  return data.sort((a, b) => getTimeValue(b.created_at) - getTimeValue(a.created_at));
}

function sortByOrder(data) {
  return data.sort((a, b) => Number(b.sort_order || 0) - Number(a.sort_order || 0));
}

function normalizeCase(input) {
  return {
    title: cleanString(input.title),
    location: cleanString(input.location),
    tag: cleanString(input.tag),
    cover_url: cleanString(input.cover_url || input.image),
    cover_preview_url: cleanString(input.cover_preview_url),
    video_url: cleanString(input.video_url),
    summary: cleanString(input.summary || input.desc),
    detail: cleanString(input.detail),
    status: ['draft', 'published', 'hidden'].includes(input.status) ? input.status : 'published',
    sort_order: Number(input.sort_order || 0),
    updated_at: db.serverDate()
  };
}

function normalizeNews(input) {
  return {
    title: cleanString(input.title),
    category: cleanString(input.category) || '平台公告',
    summary: cleanString(input.summary),
    content: cleanString(input.content),
    cover_url: cleanString(input.cover_url),
    image_urls: cleanString(input.image_urls),
    video_url: cleanString(input.video_url),
    status: ['draft', 'published', 'hidden'].includes(input.status) ? input.status : 'draft',
    is_top: Boolean(input.is_top),
    sort_order: Number(input.sort_order || 0),
    updated_at: db.serverDate()
  };
}

function normalizeProduct(input) {
  return {
    name: cleanString(input.name),
    category: cleanString(input.category),
    brand: cleanString(input.brand),
    cover_url: cleanString(input.cover_url),
    image_urls: cleanString(input.image_urls),
    summary: cleanString(input.summary),
    specs: cleanString(input.specs),
    detail: cleanString(input.detail),
    contact_wechat: cleanString(input.contact_wechat),
    contact_phone: cleanString(input.contact_phone),
    status: ['draft', 'published', 'hidden'].includes(input.status) ? input.status : 'draft',
    sort_order: Number(input.sort_order || 0),
    updated_at: db.serverDate()
  };
}

function splitMediaList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  return cleanString(value)
    .split(',')
    .map((item) => cleanString(item))
    .filter(Boolean);
}

function normalizeArtist(input) {
  const status = ['pending', 'approved', 'rejected'].includes(input.status) ? input.status : 'pending';
  const workStatus = ['available', 'on_duty', 'paused'].includes(input.work_status)
    ? input.work_status
    : 'available';
  const isHidden = Boolean(input.is_hidden);
  const isFeaturedGuest = Boolean(input.is_featured_guest);
  const tags = splitMediaList(input.tags);
  const artPhotos = splitMediaList(input.art_photo_urls);
  const lifePhotos = splitMediaList(input.life_photo_urls);
  const photos = splitMediaList(input.photo_urls);
  const videos = splitMediaList(input.video_urls || input.video_url);

  return {
    stage_name: cleanString(input.stage_name),
    real_name: cleanString(input.real_name),
    phone: cleanString(input.phone),
    city: cleanString(input.city),
    dispatch_cities: cleanString(input.dispatch_cities),
    category: cleanString(input.category),
    tags,
    singing_type: cleanString(input.singing_type),
    gender: cleanString(input.gender),
    age: cleanString(input.age),
    height: cleanString(input.height),
    price: cleanString(input.price),
    status,
    work_status: workStatus,
    is_hidden: isHidden,
    is_featured_guest: isFeaturedGuest,
    can_book: status === 'approved' && workStatus === 'available' && !isHidden,
    avatar_url: cleanString(input.avatar_url),
    art_photo_file_ids: artPhotos,
    art_photo_urls: artPhotos.join(','),
    life_photo_file_ids: lifePhotos,
    life_photo_urls: lifePhotos.join(','),
    photo_file_ids: photos,
    photo_urls: photos.join(','),
    video_file_ids: videos,
    video_file_id: videos[0] || '',
    video_url: videos.join(','),
    bio: cleanString(input.bio),
    reject_reason: status === 'rejected' ? cleanString(input.reject_reason) || '资料不完整' : '',
    updated_at: db.serverDate()
  };
}

async function listCollection(collectionName, event, mapper = withId, sorter = sortByCreatedAt) {
  const status = cleanString(event.status);
  const where = {};

  if (status) {
    where.status = status;
  }

  const result = await db.collection(collectionName).where(where).limit(100).get();
  return sorter(result.data.map(mapper));
}

function mapCase(item) {
  return {
    ...item,
    id: item._id,
    image: item.cover_url || item.image || '',
    cover_preview_url: item.cover_preview_url || '',
    desc: item.summary || item.desc || ''
  };
}

function mapArtist(item) {
  const artPhotos = Array.isArray(item.art_photo_file_ids)
    ? item.art_photo_file_ids.join(',')
    : item.art_photo_urls || '';
  const lifePhotos = Array.isArray(item.life_photo_file_ids)
    ? item.life_photo_file_ids.join(',')
    : item.life_photo_urls || '';
  const videos = Array.isArray(item.video_file_ids)
    ? item.video_file_ids.join(',')
    : item.video_url || '';

  return {
    ...item,
    id: item._id,
    tags: Array.isArray(item.tags) ? item.tags.join(',') : item.tags || '',
    avatar_url: item.avatar_url || item.avatar_file_id || '',
    photo_urls: Array.isArray(item.photo_file_ids) ? item.photo_file_ids.join(',') : item.photo_urls || '',
    art_photo_urls: artPhotos,
    life_photo_urls: lifePhotos,
    video_urls: videos
  };
}

function mapProduct(item) {
  return {
    ...item,
    id: item._id,
    brand: item.brand || '',
    price_text: '批发价联系我们'
  };
}

async function saveCase(event) {
  const input = event.caseData || {};
  const id = cleanString(input.id);
  const data = normalizeCase(input);

  if (!data.title || !data.location) {
    throw new Error('请填写音乐节名称和地址');
  }

  if (id) {
    await db.collection('festival_cases').doc(id).update({ data });
    await writeOperationLog(event, 'case.update', { id, title: data.title, status: data.status });
    return { id };
  }

  data.created_at = db.serverDate();
  const result = await db.collection('festival_cases').add({ data });
  await writeOperationLog(event, 'case.create', { id: result._id, title: data.title, status: data.status });
  return { id: result._id };
}

async function saveNews(event) {
  const input = event.news || {};
  const id = cleanString(input.id);
  const data = normalizeNews(input);

  if (!data.title) {
    throw new Error('请填写动态标题');
  }

  if (id) {
    await db.collection('news').doc(id).update({ data });
    await writeOperationLog(event, 'news.update', { id, title: data.title, status: data.status });
    return { id };
  }

  data.created_at = db.serverDate();
  const result = await db.collection('news').add({ data });
  await writeOperationLog(event, 'news.create', { id: result._id, title: data.title, status: data.status });
  return { id: result._id };
}

async function saveProduct(event) {
  const input = event.product || {};
  const id = cleanString(input.id);
  const data = normalizeProduct(input);

  if (!data.name || !data.category) {
    throw new Error('请填写产品名称和分类');
  }

  if (id) {
    await db.collection('wholesale_products').doc(id).update({ data });
    await writeOperationLog(event, 'product.update', { id, name: data.name, status: data.status });
    return { id };
  }

  data.created_at = db.serverDate();
  const result = await db.collection('wholesale_products').add({ data });
  await writeOperationLog(event, 'product.create', { id: result._id, name: data.name, status: data.status });
  return { id: result._id };
}

async function importProducts(event) {
  const products = Array.isArray(event.products) ? event.products : [];

  if (!products.length) {
    throw new Error('没有可导入的产品');
  }

  if (products.length > 100) {
    throw new Error('单次最多导入 100 个产品');
  }

  const ids = [];

  for (let index = 0; index < products.length; index += 1) {
    const data = normalizeProduct(products[index]);

    if (!data.name || !data.category) {
      throw new Error(`第 ${index + 1} 行缺少产品名称或分类`);
    }

    data.created_at = db.serverDate();
    const result = await db.collection('wholesale_products').add({ data });
    ids.push(result._id);
  }

  await writeOperationLog(event, 'product.import', { ids, count: ids.length });
  return { ids, count: ids.length };
}

async function saveArtist(event) {
  const input = event.artist || {};
  const id = cleanString(input.id);
  const data = normalizeArtist(input);

  if (!data.stage_name || !data.category) {
    throw new Error('请填写艺名和艺人类型');
  }

  if (data.status === 'approved') {
    data.approved_at = db.serverDate();
  }

  if (id) {
    await db.collection('artists').doc(id).update({ data });
    await writeOperationLog(event, 'artist.update', {
      id,
      stage_name: data.stage_name,
      status: data.status,
      work_status: data.work_status,
      is_hidden: data.is_hidden,
      is_featured_guest: data.is_featured_guest
    });
    return { id };
  }

  data.created_at = db.serverDate();
  const result = await db.collection('artists').add({ data });
  await writeOperationLog(event, 'artist.create', {
    id: result._id,
    stage_name: data.stage_name,
    status: data.status
  });
  return { id: result._id };
}

async function updateArtistState(event) {
  const id = cleanString(event.id);
  const patch = event.patch || {};

  if (!id) {
    throw new Error('缺少艺人 ID');
  }

  const result = await db.collection('artists').doc(id).get();
  const artist = result.data || {};
  const data = {
    updated_at: db.serverDate()
  };

  if (patch.work_status !== undefined) {
    const workStatus = cleanString(patch.work_status);

    if (!['available', 'on_duty', 'paused'].includes(workStatus)) {
      throw new Error('艺人工作状态不正确');
    }

    data.work_status = workStatus;
  }

  if (patch.is_hidden !== undefined) {
    data.is_hidden = Boolean(patch.is_hidden);
  }

  if (patch.is_featured_guest !== undefined) {
    data.is_featured_guest = Boolean(patch.is_featured_guest);
  }

  const nextWorkStatus = data.work_status || artist.work_status || 'available';
  const nextHidden = data.is_hidden !== undefined ? data.is_hidden : Boolean(artist.is_hidden);
  data.can_book = artist.status === 'approved' && nextWorkStatus === 'available' && !nextHidden;

  await db.collection('artists').doc(id).update({ data });
  await writeOperationLog(event, 'artist.state', {
    id,
    work_status: nextWorkStatus,
    is_hidden: nextHidden,
    is_featured_guest: data.is_featured_guest !== undefined
      ? data.is_featured_guest
      : Boolean(artist.is_featured_guest),
    can_book: data.can_book
  });
  return { id, ...data };
}

async function seedProducts(event) {
  const existing = await db.collection('wholesale_products').limit(1).get();

  if (existing.data.length) {
    throw new Error('产品集合已有数据，不执行示例导入');
  }

  const products = [
    {
      name: '民谣演出音箱套装',
      category: '音响设备',
      cover_url: '/images/home-entry-training.jpg',
      image_urls: '/images/home-entry-training.jpg,/images/home-banner.jpg',
      summary: '适合小型演出、民谣驻唱、活动暖场使用的便携音箱套装。',
      specs: '包含主音箱、支架、基础连接线；具体配置以实际批发沟通为准。',
      detail: '产品用于展示批发品类，正式图片和文案可在云后台随时替换。',
      contact_wechat: '',
      contact_phone: '',
      status: 'published',
      sort_order: 100
    },
    {
      name: '吉他与乐器配件组合',
      category: '乐器',
      cover_url: '/images/home-entry-artists.jpg',
      image_urls: '/images/home-entry-artists.jpg',
      summary: '面向培训机构、演出团队和门店的乐器及常用配件批发。',
      specs: '支持按批次沟通型号、数量、颜色和配件组合。',
      detail: '批发价联系我们，具体库存和交付周期以客服确认为准。',
      contact_wechat: '',
      contact_phone: '',
      status: 'published',
      sort_order: 90
    }
  ];

  const ids = [];

  for (const product of products) {
    const timestamp = db.serverDate();
    const result = await db.collection('wholesale_products').add({
      data: {
        ...product,
        created_at: timestamp,
        updated_at: timestamp
      }
    });
    ids.push(result._id);
  }

  await writeOperationLog(event, 'product.seed', { ids, count: ids.length });
  return { ids, count: ids.length };
}

async function updateDocStatus(collectionName, event, allowedStatuses, logAction) {
  const id = cleanString(event.id);
  const status = cleanString(event.status);

  if (!id || !allowedStatuses.includes(status)) {
    throw new Error('ID 或状态不正确');
  }

  const result = await db.collection(collectionName).doc(id).get();
  const current = result.data || {};

  await db.collection(collectionName).doc(id).update({
    data: {
      status,
      updated_at: db.serverDate()
    }
  });

  if (current.status !== status) {
    if (collectionName === 'bookings' && current.customer_openid) {
      const statusLabels = {
        pending: '待处理',
        contacted: '已联系',
        closed: '已关闭'
      };
      const artistName = current.artist_name || '艺人';
      await writeNotification(
        current.customer_openid,
        '预约状态已更新',
        `你预约的 ${artistName} 当前状态为：${statusLabels[status] || status}。`,
        'booking'
      );
    }

    if (collectionName === 'festival_leads' && current.openid) {
      const statusLabels = {
        pending: '待处理',
        contacted: '已联系',
        closed: '已关闭'
      };
      const cooperationType = current.cooperation_type || '音乐节合作';
      await writeNotification(
        current.openid,
        '音乐节合作申请已处理',
        `你提交的${cooperationType}申请当前状态为：${statusLabels[status] || status}。`,
        'festival'
      );
    }
  }

  await writeOperationLog(event, logAction || `${collectionName}.status`, { id, status });
  return { id, status };
}

async function updatePromotionStatus(event) {
  const id = cleanString(event.id);
  const status = cleanString(event.status);
  const reviewNote = cleanString(event.review_note);

  if (!id || !['pending', 'reviewing', 'approved', 'rejected'].includes(status)) {
    throw new Error('晋升申请 ID 或状态不正确');
  }

  const result = await db.collection('promotion_applications').doc(id).get();
  const application = result.data || {};

  await db.collection('promotion_applications').doc(id).update({
    data: {
      status,
      review_note: reviewNote,
      updated_at: db.serverDate()
    }
  });

  if (application.openid && application.status !== status) {
    const targetPosition = application.target_position || '目标职位';
    let title = '晋升申请状态已更新';
    let content = `你的${targetPosition}申请正在审核中，请留意后续消息。`;

    if (status === 'approved') {
      title = '晋升申请已通过';
      content = `你的${targetPosition}申请已通过，请留意后续安排。`;
    } else if (status === 'rejected') {
      title = '晋升申请暂未通过';
      content = `你的${targetPosition}申请暂未通过，请查看审核意见后完善资料。`;
      if (reviewNote) {
        content += ` 审核意见：${reviewNote}`;
      }
    } else if (status === 'pending') {
      content = `你的${targetPosition}申请已转为待处理状态。`;
    }

    await writeNotification(application.openid, title, content, 'system');
  }

  await writeOperationLog(event, 'promotion.status', { id, status, review_note: reviewNote });
  return { id, status };
}

async function deleteDoc(collectionName, event, logAction) {
  const id = cleanString(event.id);

  if (!id) {
    throw new Error('缺少 ID');
  }

  await db.collection(collectionName).doc(id).remove();
  await writeOperationLog(event, logAction || `${collectionName}.delete`, { id });
  return { id };
}

async function getTempFileUrl(event) {
  const fileID = cleanString(event.fileID);

  if (!fileID) {
    throw new Error('缺少文件 ID');
  }

  const result = await cloud.getTempFileURL({
    fileList: [fileID]
  });
  const file = (result.fileList || [])[0] || {};

  if (file.status && file.status !== 0 && file.status !== 'SUCCESS') {
    throw new Error(file.errMsg || file.message || `获取临时链接失败：${file.status}`);
  }

  const tempFileURL = file.tempFileURL || file.tempFileUrl || file.download_url || file.downloadUrl || '';

  if (!tempFileURL) {
    throw new Error('云存储未返回临时链接');
  }

  return {
    fileID,
    tempFileURL
  };
}

async function reviewArtist(event) {
  const id = cleanString(event.id);
  const status = cleanString(event.status);
  const reason = cleanString(event.reason);

  if (!id || !['approved', 'rejected'].includes(status)) {
    throw new Error('艺人 ID 或审核状态不正确');
  }

  const result = await db.collection('artists').doc(id).get();
  const artist = result.data || {};
  const data = {
    status,
    reject_reason: status === 'rejected' ? reason || '资料不完整' : '',
    can_book: false,
    updated_at: db.serverDate()
  };

  if (status === 'approved') {
    data.approved_at = db.serverDate();
    data.work_status = 'available';
    data.is_hidden = false;
    data.can_book = true;
  }

  await db.collection('artists').doc(id).update({ data });

  if (artist.openid && artist.status !== status) {
    const stageName = artist.stage_name || artist.real_name || '你的艺人资料';
    const title = status === 'approved' ? '艺人资料审核通过' : '艺人资料审核未通过';
    const content = status === 'approved'
      ? `${stageName} 已通过审核，请留意后续安排。`
      : `${stageName} 暂未通过审核，请查看审核意见后完善资料。审核意见：${data.reject_reason}`;

    await writeNotification(artist.openid, title, content, 'artist');
  }

  await writeOperationLog(event, 'artist.review', { id, status, reason: status === 'rejected' ? data.reject_reason : '' });
  return { id, status };
}

async function listOperationLogs() {
  const result = await db.collection('admin_operation_logs').limit(100).get();
  return sortByCreatedAt(result.data.map(withId));
}

exports.main = async (event = {}) => {
  try {
    assertWebAdmin(event);

    const action = cleanString(event.action);
    let data = null;

    if (action === 'listCases') {
      data = await listCollection('festival_cases', event, mapCase, sortByOrder);
    } else if (action === 'saveCase') {
      data = await saveCase(event);
    } else if (action === 'updateCaseStatus') {
      data = await updateDocStatus('festival_cases', event, ['draft', 'published', 'hidden'], 'case.status');
    } else if (action === 'deleteCase') {
      data = await deleteDoc('festival_cases', event, 'case.delete');
    } else if (action === 'listNews') {
      data = await listCollection('news', event, withId, sortByOrder);
    } else if (action === 'saveNews') {
      data = await saveNews(event);
    } else if (action === 'updateNewsStatus') {
      data = await updateDocStatus('news', event, ['draft', 'published', 'hidden'], 'news.status');
    } else if (action === 'deleteNews') {
      data = await deleteDoc('news', event, 'news.delete');
    } else if (action === 'listProducts') {
      data = await listCollection('wholesale_products', event, mapProduct, sortByOrder);
    } else if (action === 'saveProduct') {
      data = await saveProduct(event);
    } else if (action === 'importProducts') {
      data = await importProducts(event);
    } else if (action === 'updateProductStatus') {
      data = await updateDocStatus('wholesale_products', event, ['draft', 'published', 'hidden'], 'product.status');
    } else if (action === 'deleteProduct') {
      data = await deleteDoc('wholesale_products', event, 'product.delete');
    } else if (action === 'seedProducts') {
      data = await seedProducts(event);
    } else if (action === 'listBookings') {
      data = await listCollection('bookings', event);
    } else if (action === 'updateBookingStatus') {
      data = await updateDocStatus('bookings', event, ['pending', 'contacted', 'closed'], 'booking.status');
    } else if (action === 'listFestivalLeads') {
      data = await listCollection('festival_leads', event);
    } else if (action === 'updateFestivalLeadStatus') {
      data = await updateDocStatus('festival_leads', event, ['pending', 'contacted', 'closed'], 'festivalLead.status');
    } else if (action === 'listPromotionApplications') {
      data = await listCollection('promotion_applications', event);
    } else if (action === 'updatePromotionStatus') {
      data = await updatePromotionStatus(event);
    } else if (action === 'listArtists') {
      data = await listCollection('artists', event, mapArtist);
    } else if (action === 'saveArtist') {
      data = await saveArtist(event);
    } else if (action === 'updateArtistState') {
      data = await updateArtistState(event);
    } else if (action === 'deleteArtist') {
      data = await deleteDoc('artists', event, 'artist.delete');
    } else if (action === 'reviewArtist') {
      data = await reviewArtist(event);
    } else if (action === 'getTempFileUrl') {
      data = await getTempFileUrl(event);
    } else if (action === 'listOperationLogs') {
      data = await listOperationLogs();
    } else {
      throw new Error('未知操作');
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '网页后台操作失败'
    };
  }
};
