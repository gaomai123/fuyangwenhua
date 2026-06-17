const apiBase = document.querySelector('#apiBase');
const statusFilter = document.querySelector('#statusFilter');
const bookingStatusFilter = document.querySelector('#bookingStatusFilter');
const festivalLeadStatusFilter = document.querySelector('#festivalLeadStatusFilter');
const statusRequestFilter = document.querySelector('#statusRequestFilter');
const newsStatusFilter = document.querySelector('#newsStatusFilter');
const hideTestDataBtn = document.querySelector('#hideTestDataBtn');
const refreshBtn = document.querySelector('#refreshBtn');
const logoutBtn = document.querySelector('#logoutBtn');
const message = document.querySelector('#message');
const bookingMessage = document.querySelector('#bookingMessage');
const festivalLeadMessage = document.querySelector('#festivalLeadMessage');
const statusRequestMessage = document.querySelector('#statusRequestMessage');
const newsMessage = document.querySelector('#newsMessage');
const artistList = document.querySelector('#artistList');
const bookingList = document.querySelector('#bookingList');
const festivalLeadList = document.querySelector('#festivalLeadList');
const statusRequestList = document.querySelector('#statusRequestList');
const newsList = document.querySelector('#newsList');
const newsForm = document.querySelector('#newsForm');
const newsFormReset = document.querySelector('#newsFormReset');
const template = document.querySelector('#artistCardTemplate');
const bookingTemplate = document.querySelector('#bookingTemplate');
const festivalLeadTemplate = document.querySelector('#festivalLeadTemplate');
const statusRequestTemplate = document.querySelector('#statusRequestTemplate');
const moduleTabs = Array.from(document.querySelectorAll('.module-tab'));
const modulePanels = Array.from(document.querySelectorAll('.module-panel'));

const bookingStatusText = {
  pending: '待处理',
  contacted: '已联系',
  closed: '已关闭'
};

const artistStatusText = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

const workStatusText = {
  available: '可预约',
  on_duty: '已下档',
  paused: '暂停接单'
};

const newsStatusText = {
  draft: '草稿',
  published: '已发布',
  hidden: '已隐藏'
};

const statusRequestStatusText = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
};

const loadedModules = {
  news: false,
  festival: false,
  products: false,
  bookings: false,
  statusRequests: false,
  artists: false
};

let activeModule = 'festival';

apiBase.textContent = AdminApi.API_BASE;

if (!AdminApi.getToken()) {
  window.location.href = './login.html';
}

function displayValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatDateTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

function setField(card, field, value) {
  const element = card.querySelector(`[data-field="${field}"]`);

  if (element) {
    element.textContent = displayValue(value);
  }
}

function setDisplayField(card, field, value, map) {
  setField(card, field, map[value] || value);
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createMediaLink(url, label, className) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.className = className;

  if (className.includes('media-thumb')) {
    const image = document.createElement('img');
    image.src = url;
    image.alt = label;
    link.appendChild(image);
  } else {
    link.textContent = label;
  }

  return link;
}

function renderMedia(card, artist) {
  const panel = card.querySelector('[data-role="mediaPanel"]');
  const photos = [
    ...parseList(artist.photo_urls),
    ...parseList(artist.art_photo_urls),
    ...parseList(artist.life_photo_urls)
  ];

  if (!artist.avatar_url && photos.length === 0 && !artist.video_url) {
    panel.remove();
    return;
  }

  if (artist.avatar_url) {
    const group = document.createElement('div');
    group.className = 'media-group avatar-group';
    group.innerHTML = '<div class="media-title">头像</div>';
    group.appendChild(createMediaLink(artist.avatar_url, '头像', 'media-thumb avatar-thumb'));
    panel.appendChild(group);
  }

  if (photos.length > 0) {
    const group = document.createElement('div');
    group.className = 'media-group photos-group';
    group.innerHTML = '<div class="media-title">照片</div>';
    const grid = document.createElement('div');
    grid.className = 'media-grid';
    photos.forEach((url, index) => grid.appendChild(createMediaLink(url, `照片 ${index + 1}`, 'media-thumb')));
    group.appendChild(grid);
    panel.appendChild(group);
  }

  if (artist.video_url) {
    const group = document.createElement('div');
    group.className = 'media-group video-group';
    group.innerHTML = '<div class="media-title">视频</div>';
    group.appendChild(createMediaLink(artist.video_url, artist.video_url, 'media-video-link'));
    panel.appendChild(group);
  }
}

function copyText(value, targetMessage, successMessage) {
  navigator.clipboard.writeText(value).then(() => {
    targetMessage.textContent = successMessage;
  });
}

async function approveArtist(id) {
  await AdminApi.request(`/admin/artists/${id}/approve`, { method: 'PATCH' });
  message.textContent = '已通过';
  await loadArtists();
}

async function toggleWorkStatus(artist) {
  const nextStatus = artist.work_status === 'available' ? 'on_duty' : 'available';

  await AdminApi.request(`/admin/artists/${artist.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ work_status: nextStatus })
  });
  message.textContent = nextStatus === 'available' ? '已设为可预约' : '已设为已下档';
  await loadArtists();
}

async function toggleHidden(artist) {
  const nextHidden = artist.is_hidden ? 0 : 1;

  await AdminApi.request(`/admin/artists/${artist.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_hidden: nextHidden })
  });
  message.textContent = nextHidden ? '已隐藏，不再前台展示' : '已恢复前台展示';
  await loadArtists();
}

async function rejectArtist(id) {
  const reason = prompt('请输入驳回原因', '资料不完整');

  if (reason === null) {
    return;
  }

  await AdminApi.request(`/admin/artists/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason })
  });
  message.textContent = '已驳回';
  await loadArtists();
}

async function deleteArtist(id) {
  if (!confirm('确定删除这条资料吗？')) {
    return;
  }

  await AdminApi.request(`/admin/artists/${id}`, { method: 'DELETE' });
  message.textContent = '已删除';
  await loadArtists();
}

function renderArtist(artist) {
  const card = template.content.firstElementChild.cloneNode(true);
  const fields = [
    'stage_name',
    'real_name',
    'phone',
    'city',
    'dispatch_cities',
    'tags',
    'height',
    'age',
    'gender',
    'category',
    'bio',
    'price',
    'video_url',
    'status',
    'work_status',
    'reject_reason'
  ];

  fields.forEach((field) => setField(card, field, artist[field]));
  setDisplayField(card, 'status', artist.status, artistStatusText);
  setDisplayField(card, 'work_status', artist.work_status, workStatusText);
  setField(card, 'visible_status', artist.is_hidden ? '已隐藏' : '展示中');
  renderMedia(card, artist);

  card.querySelector('[data-action="approve"]').addEventListener('click', () => approveArtist(artist.id));
  card.querySelector('[data-action="toggleWorkStatus"]').textContent =
    artist.work_status === 'available' ? '设为已下档' : '设为可预约';
  card.querySelector('[data-action="toggleWorkStatus"]').addEventListener('click', () => toggleWorkStatus(artist));
  card.querySelector('[data-action="toggleHidden"]').textContent = artist.is_hidden ? '恢复展示' : '隐藏';
  card.querySelector('[data-action="toggleHidden"]').addEventListener('click', () => toggleHidden(artist));
  card.querySelector('[data-action="reject"]').addEventListener('click', () => rejectArtist(artist.id));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteArtist(artist.id));

  return card;
}

function renderBooking(booking) {
  const card = bookingTemplate.content.firstElementChild.cloneNode(true);
  const statusBadge = card.querySelector('[data-role="statusBadge"]');
  const fields = ['artist_name', 'contact_name', 'phone', 'city', 'event_time', 'budget', 'requirement'];

  fields.forEach((field) => setField(card, field, booking[field]));
  setField(card, 'created_at', formatDateTime(booking.created_at));

  statusBadge.textContent = bookingStatusText[booking.status] || booking.status || '-';
  statusBadge.classList.add(`status-${booking.status || 'pending'}`);

  card.querySelector('[data-action="copyPhone"]').addEventListener('click', () => {
    copyText(booking.phone, bookingMessage, '手机号已复制');
  });
  card.querySelector('[data-action="pending"]').addEventListener('click', () => updateBooking(booking.id, 'pending'));
  card.querySelector('[data-action="contacted"]').addEventListener('click', () => updateBooking(booking.id, 'contacted'));
  card.querySelector('[data-action="closed"]').addEventListener('click', () => updateBooking(booking.id, 'closed'));

  return card;
}

function renderFestivalLead(lead) {
  const card = festivalLeadTemplate.content.firstElementChild.cloneNode(true);
  const statusBadge = card.querySelector('[data-role="statusBadge"]');
  const fields = ['cooperation_type', 'contact_name', 'phone', 'company', 'city', 'event_date', 'requirement'];

  fields.forEach((field) => setField(card, field, lead[field]));
  setField(card, 'created_at', formatDateTime(lead.created_at));

  statusBadge.textContent = bookingStatusText[lead.status] || lead.status || '-';
  statusBadge.classList.add(`status-${lead.status || 'pending'}`);

  card.querySelector('[data-action="copyPhone"]').addEventListener('click', () => {
    copyText(lead.phone, festivalLeadMessage, '手机号已复制');
  });
  card.querySelector('[data-action="pending"]').addEventListener('click', () => updateFestivalLead(lead.id, 'pending'));
  card.querySelector('[data-action="contacted"]').addEventListener('click', () => updateFestivalLead(lead.id, 'contacted'));
  card.querySelector('[data-action="closed"]').addEventListener('click', () => updateFestivalLead(lead.id, 'closed'));

  return card;
}

function renderStatusRequest(item) {
  const card = statusRequestTemplate.content.firstElementChild.cloneNode(true);
  const statusBadge = card.querySelector('[data-role="statusBadge"]');
  const fields = ['artist_name', 'artist_city', 'artist_phone', 'customer_nickname', 'reason', 'admin_remark'];

  fields.forEach((field) => setField(card, field, item[field]));
  setField(card, 'current_status', workStatusText[item.current_status] || item.current_status);
  setField(card, 'requested_status', workStatusText[item.requested_status] || item.requested_status);
  setField(card, 'created_at', formatDateTime(item.created_at));

  statusBadge.textContent = statusRequestStatusText[item.status] || item.status || '-';
  statusBadge.classList.add(`status-${item.status || 'pending'}`);

  const approveButton = card.querySelector('[data-action="approve"]');
  const rejectButton = card.querySelector('[data-action="reject"]');

  if (item.status !== 'pending') {
    approveButton.disabled = true;
    rejectButton.disabled = true;
  }

  approveButton.addEventListener('click', () => reviewStatusRequest(item.id, 'approved'));
  rejectButton.addEventListener('click', () => reviewStatusRequest(item.id, 'rejected'));

  return card;
}

function resetNewsForm() {
  newsForm.reset();
  newsForm.elements.id.value = '';
  newsForm.elements.sort_order.value = '0';
  newsForm.elements.status.value = 'draft';
  newsMessage.textContent = '';
}

async function uploadNewsCoverIfNeeded() {
  const fileInput = newsForm.elements.cover_file;

  if (!fileInput.files || fileInput.files.length === 0) {
    return newsForm.elements.cover_url.value.trim();
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  const response = await fetch(`${AdminApi.API_BASE}/uploads/avatar`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || '封面上传失败');
  }

  return data.data.url;
}

function collectNewsFormData(coverUrl) {
  return {
    title: newsForm.elements.title.value.trim(),
    category: newsForm.elements.category.value,
    cover_url: coverUrl,
    summary: newsForm.elements.summary.value.trim(),
    content: newsForm.elements.content.value.trim(),
    image_urls: newsForm.elements.image_urls.value.trim(),
    video_url: newsForm.elements.video_url.value.trim(),
    is_top: newsForm.elements.is_top.checked ? 1 : 0,
    status: newsForm.elements.status.value,
    sort_order: Number(newsForm.elements.sort_order.value || 0)
  };
}

function editNews(news) {
  newsForm.elements.id.value = news.id;
  newsForm.elements.title.value = news.title || '';
  newsForm.elements.category.value = news.category || '平台公告';
  newsForm.elements.cover_url.value = news.cover_url || '';
  newsForm.elements.summary.value = news.summary || '';
  newsForm.elements.content.value = news.content || '';
  newsForm.elements.image_urls.value = news.image_urls || '';
  newsForm.elements.video_url.value = news.video_url || '';
  newsForm.elements.is_top.checked = !!news.is_top;
  newsForm.elements.status.value = news.status || 'draft';
  newsForm.elements.sort_order.value = news.sort_order || 0;
  newsMessage.textContent = `正在编辑：${news.title}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveNews(event) {
  event.preventDefault();
  newsMessage.textContent = '正在保存...';

  try {
    const id = newsForm.elements.id.value;
    const coverUrl = await uploadNewsCoverIfNeeded();
    const body = collectNewsFormData(coverUrl);
    const path = id ? `/admin/news/${id}` : '/admin/news';
    const method = id ? 'PUT' : 'POST';

    await AdminApi.request(path, {
      method,
      body: JSON.stringify(body)
    });

    newsMessage.textContent = id ? '动态已更新' : '动态已新增';
    resetNewsForm();
    await loadNews(true);
  } catch (error) {
    newsMessage.textContent = error.message;
  }
}

async function updateNewsStatus(id, status) {
  await AdminApi.request(`/admin/news/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  newsMessage.textContent = '动态状态已更新';
  await loadNews(true);
}

async function deleteNews(id) {
  if (!confirm('确定删除这条动态吗？')) {
    return;
  }

  await AdminApi.request(`/admin/news/${id}`, { method: 'DELETE' });
  newsMessage.textContent = '动态已删除';
  await loadNews(true);
}

function renderNews(news) {
  const card = document.createElement('article');
  card.className = 'news-card';

  const cover = document.createElement('img');
  cover.className = 'news-cover';
  cover.src = news.cover_url || '';
  cover.alt = news.title || '动态封面';
  card.appendChild(cover);

  const body = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = news.title || '-';
  body.appendChild(title);

  const summary = document.createElement('p');
  summary.textContent = news.summary || '-';
  body.appendChild(summary);

  const meta = document.createElement('div');
  meta.className = 'news-meta';
  meta.innerHTML = `
    <span>${displayValue(news.category)}</span>
    <span>${newsStatusText[news.status] || news.status || '-'}</span>
    <span>${news.is_top ? '置顶' : '未置顶'}</span>
    <span>排序 ${news.sort_order || 0}</span>
    <span>${formatDateTime(news.created_at)}</span>
  `;
  body.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.textContent = '编辑';
  editButton.addEventListener('click', () => editNews(news));
  actions.appendChild(editButton);

  const publishButton = document.createElement('button');
  publishButton.type = 'button';
  publishButton.textContent = '发布';
  publishButton.addEventListener('click', () => updateNewsStatus(news.id, 'published'));
  actions.appendChild(publishButton);

  const hideButton = document.createElement('button');
  hideButton.type = 'button';
  hideButton.className = 'ghost';
  hideButton.textContent = '隐藏';
  hideButton.addEventListener('click', () => updateNewsStatus(news.id, 'hidden'));
  actions.appendChild(hideButton);

  const draftButton = document.createElement('button');
  draftButton.type = 'button';
  draftButton.className = 'ghost';
  draftButton.textContent = '草稿';
  draftButton.addEventListener('click', () => updateNewsStatus(news.id, 'draft'));
  actions.appendChild(draftButton);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'danger';
  deleteButton.textContent = '删除';
  deleteButton.addEventListener('click', () => deleteNews(news.id));
  actions.appendChild(deleteButton);

  body.appendChild(actions);
  card.appendChild(body);

  return card;
}

async function loadNews(force = false) {
  if (!force && loadedModules.news) {
    return;
  }

  newsMessage.textContent = '正在加载...';
  newsList.innerHTML = '';

  try {
    const status = newsStatusFilter.value;
    const path = status ? `/admin/news?status=${encodeURIComponent(status)}` : '/admin/news';
    const result = await AdminApi.request(path);

    if (result.data.length === 0) {
      newsList.innerHTML = '<div class="empty">暂无动态</div>';
      newsMessage.textContent = '';
      loadedModules.news = true;
      return;
    }

    result.data.forEach((news) => newsList.appendChild(renderNews(news)));
    newsMessage.textContent = `共 ${result.data.length} 条`;
    loadedModules.news = true;
  } catch (error) {
    newsMessage.textContent = error.message;
  }
}

async function loadArtists() {
  message.textContent = '正在加载...';
  artistList.innerHTML = '';

  try {
    const status = statusFilter.value;
    const path = status ? `/admin/artists?status=${encodeURIComponent(status)}` : '/admin/artists';
    const result = await AdminApi.request(path);

    if (result.data.length === 0) {
      artistList.innerHTML = '<div class="empty">暂无资料</div>';
      message.textContent = '';
      loadedModules.artists = true;
      return;
    }

    result.data.forEach((artist) => artistList.appendChild(renderArtist(artist)));
    message.textContent = `共 ${result.data.length} 条`;
    loadedModules.artists = true;
  } catch (error) {
    if (error.message === 'Unauthorized') {
      AdminApi.clearToken();
      window.location.href = './login.html';
      return;
    }

    message.textContent = error.message;
  }
}

async function loadBookings() {
  bookingMessage.textContent = '正在加载...';
  bookingList.innerHTML = '';

  try {
    const status = bookingStatusFilter.value;
    const path = status ? `/admin/bookings?status=${encodeURIComponent(status)}` : '/admin/bookings';
    const result = await AdminApi.request(path);

    if (result.data.length === 0) {
      bookingList.innerHTML = '<div class="empty">暂无预约意向</div>';
      bookingMessage.textContent = '';
      loadedModules.bookings = true;
      return;
    }

    result.data.forEach((booking) => bookingList.appendChild(renderBooking(booking)));
    bookingMessage.textContent = `共 ${result.data.length} 条`;
    loadedModules.bookings = true;
  } catch (error) {
    bookingMessage.textContent = error.message;
  }
}

async function loadFestivalLeads() {
  festivalLeadMessage.textContent = '正在加载...';
  festivalLeadList.innerHTML = '';

  try {
    const status = festivalLeadStatusFilter.value;
    const path = status ? `/admin/festival-leads?status=${encodeURIComponent(status)}` : '/admin/festival-leads';
    const result = await AdminApi.request(path);

    if (result.data.length === 0) {
      festivalLeadList.innerHTML = '<div class="empty">暂无音乐节合作意向</div>';
      festivalLeadMessage.textContent = '';
      loadedModules.festival = true;
      return;
    }

    result.data.forEach((lead) => festivalLeadList.appendChild(renderFestivalLead(lead)));
    festivalLeadMessage.textContent = `共 ${result.data.length} 条`;
    loadedModules.festival = true;
  } catch (error) {
    festivalLeadMessage.textContent = error.message;
  }
}

async function loadStatusRequests(force = false) {
  if (!force && loadedModules.statusRequests) {
    return;
  }

  statusRequestMessage.textContent = '正在加载...';
  statusRequestList.innerHTML = '';

  try {
    const status = statusRequestFilter.value;
    const path = status ? `/admin/artist-status-requests?status=${encodeURIComponent(status)}` : '/admin/artist-status-requests';
    const result = await AdminApi.request(path);

    if (result.data.length === 0) {
      statusRequestList.innerHTML = '<div class="empty">暂无状态申请</div>';
      statusRequestMessage.textContent = '';
      loadedModules.statusRequests = true;
      return;
    }

    result.data.forEach((item) => statusRequestList.appendChild(renderStatusRequest(item)));
    statusRequestMessage.textContent = `共 ${result.data.length} 条`;
    loadedModules.statusRequests = true;
  } catch (error) {
    statusRequestMessage.textContent = error.message;
  }
}

async function reviewStatusRequest(id, status) {
  const defaultRemark = status === 'approved' ? '已通过，状态已同步' : '本次申请暂未通过';
  const adminRemark = prompt('请输入审核备注', defaultRemark);

  if (adminRemark === null) {
    return;
  }

  await AdminApi.request(`/admin/artist-status-requests/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      admin_remark: adminRemark
    })
  });

  statusRequestMessage.textContent = status === 'approved' ? '已通过并同步艺人状态' : '已拒绝申请';
  loadedModules.artists = false;
  await loadStatusRequests(true);
}

async function updateBooking(id, status) {
  await AdminApi.request(`/admin/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  bookingMessage.textContent = '预约意向状态已更新';
  await loadBookings();
}

async function updateFestivalLead(id, status) {
  await AdminApi.request(`/admin/festival-leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  festivalLeadMessage.textContent = '音乐节合作意向状态已更新';
  await loadFestivalLeads();
}

async function hideTestData() {
  const confirmed = confirm('将隐藏艺名、姓名包含“测试”或手机号为 13800138000 的艺人，并关闭对应测试预约。不删除数据，是否继续？');

  if (!confirmed) {
    return;
  }

  const result = await AdminApi.request('/admin/maintenance/hide-test-data', {
    method: 'POST',
    body: JSON.stringify({})
  });

  message.textContent = `已隐藏 ${result.data.hidden_artists} 位测试艺人`;
  bookingMessage.textContent = `已关闭 ${result.data.closed_bookings} 条测试预约`;
  loadedModules.artists = false;
  loadedModules.bookings = false;
  await refreshCurrentModule();
}

async function loadModule(moduleName, force = false) {
  if (!force && loadedModules[moduleName]) {
    return;
  }

  if (moduleName === 'news') {
    await loadNews(force);
  } else if (moduleName === 'festival') {
    await loadFestivalLeads();
  } else if (moduleName === 'products' && window.ProductsAdmin) {
    await window.ProductsAdmin.loadProducts(force);
  } else if (moduleName === 'bookings') {
    await loadBookings();
  } else if (moduleName === 'statusRequests') {
    await loadStatusRequests(force);
  } else if (moduleName === 'artists') {
    await loadArtists();
  }
}

async function switchModule(moduleName) {
  activeModule = moduleName;

  moduleTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.module === moduleName);
  });

  modulePanels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.modulePanel === moduleName);
  });

  await loadModule(moduleName);
}

async function refreshCurrentModule() {
  loadedModules[activeModule] = false;
  await loadModule(activeModule, true);
}

moduleTabs.forEach((tab) => {
  tab.addEventListener('click', () => switchModule(tab.dataset.module));
});
refreshBtn.addEventListener('click', refreshCurrentModule);
newsForm.addEventListener('submit', saveNews);
newsFormReset.addEventListener('click', resetNewsForm);
newsStatusFilter.addEventListener('change', () => loadNews(true));
statusFilter.addEventListener('change', () => loadArtists());
bookingStatusFilter.addEventListener('change', () => loadBookings());
festivalLeadStatusFilter.addEventListener('change', () => loadFestivalLeads());
statusRequestFilter.addEventListener('change', () => loadStatusRequests(true));
hideTestDataBtn.addEventListener('click', hideTestData);
logoutBtn.addEventListener('click', () => {
  AdminApi.clearToken();
  window.location.href = './login.html';
});

switchModule(activeModule);
