const config = window.CLOUD_ADMIN_CONFIG || {};
const loginPanel = document.querySelector('#loginPanel');
const managerPanel = document.querySelector('#managerPanel');
const loginForm = document.querySelector('#loginForm');
const adminKeyInput = document.querySelector('#adminKeyInput');
const loginMessage = document.querySelector('#loginMessage');
const refreshBtn = document.querySelector('#refreshBtn');
const logoutBtn = document.querySelector('#logoutBtn');
const tabs = [...document.querySelectorAll('.cloud-tabs button')];
const panels = [...document.querySelectorAll('.admin-panel')];

const caseForm = document.querySelector('#caseForm');
const caseList = document.querySelector('#caseList');
const caseMessage = document.querySelector('#caseMessage');
const caseResetBtn = document.querySelector('#caseResetBtn');
const caseStatusFilter = document.querySelector('#caseStatusFilter');

const newsForm = document.querySelector('#newsForm');
const newsList = document.querySelector('#newsList');
const newsMessage = document.querySelector('#newsMessage');
const newsResetBtn = document.querySelector('#newsResetBtn');
const newsStatusFilter = document.querySelector('#newsStatusFilter');

const productForm = document.querySelector('#productForm');
const productList = document.querySelector('#productList');
const productMessage = document.querySelector('#productMessage');
const productResetBtn = document.querySelector('#productResetBtn');
const productStatusFilter = document.querySelector('#productStatusFilter');
const seedProductsBtn = document.querySelector('#seedProductsBtn');

const leadList = document.querySelector('#leadList');
const leadStatusFilter = document.querySelector('#leadStatusFilter');
const promotionList = document.querySelector('#promotionList');
const promotionStatusFilter = document.querySelector('#promotionStatusFilter');
const bookingList = document.querySelector('#bookingList');
const bookingStatusFilter = document.querySelector('#bookingStatusFilter');
const artistForm = document.querySelector('#artistForm');
const artistList = document.querySelector('#artistList');
const artistMessage = document.querySelector('#artistMessage');
const artistResetBtn = document.querySelector('#artistResetBtn');
const artistCreateBtn = document.querySelector('#artistCreateBtn');
const artistStatusFilter = document.querySelector('#artistStatusFilter');
const logList = document.querySelector('#logList');
const mediaPreviewModal = document.querySelector('#mediaPreviewModal');
const mediaPreviewTitle = document.querySelector('#mediaPreviewTitle');
const mediaPreviewBody = document.querySelector('#mediaPreviewBody');
const mediaPreviewClose = document.querySelector('#mediaPreviewClose');

const ADMIN_KEY_STORAGE = 'fuyang_cloud_admin_key';
let app = null;
let adminKey = sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';
let activePanel = 'cases';

function setMessage(target, message, type = '') {
  target.textContent = message || '';
  target.dataset.type = type;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function getFileExtension(name, fallback) {
  const match = String(name || '').match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : fallback;
}

function getCloudPath(file, folder, fallbackExtension) {
  const extension = getFileExtension(file.name, fallbackExtension);
  const random = Math.random().toString(36).slice(2);
  return `${folder}/${Date.now()}-${random}.${extension}`;
}

async function initCloud() {
  if (!window.cloudbase) {
    throw new Error('CloudBase Web SDK 加载失败，请检查网络或安全域名配置');
  }

  if (!config.env) {
    throw new Error('缺少云开发环境 ID');
  }

  app = window.cloudbase.init({ env: config.env });
  const auth = app.auth();

  try {
    if (typeof auth.signInAnonymously === 'function') {
      await auth.signInAnonymously();
      return;
    }

    if (typeof auth.anonymousAuthProvider === 'function') {
      await auth.anonymousAuthProvider().signIn();
      return;
    }

    throw new Error('当前 CloudBase Web SDK 不支持匿名登录方法');
  } catch (error) {
    const message = error.message || error.errMsg || '';
    if (/already|重复|logged/i.test(message)) {
      return;
    }
    throw new Error(`匿名登录失败：${message}`);
  }
}

async function callAdmin(action, data = {}) {
  const response = await app.callFunction({
    name: 'webAdminFestivalCases',
    data: {
      action,
      admin_key: adminKey,
      ...data
    }
  });
  const result = response.result || {};

  if (!result.success) {
    throw new Error(result.message || '云函数调用失败');
  }

  return result.data;
}

async function uploadFileIfNeeded(fileInput, folder, fallbackValue, fallbackExtension) {
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    return String(fallbackValue || '').trim();
  }

  const result = await app.uploadFile({
    cloudPath: getCloudPath(file, folder, fallbackExtension),
    filePath: file
  });

  return result.fileID;
}

async function uploadFileWithPreviewIfNeeded(fileInput, folder, fallbackValue, fallbackPreviewValue, fallbackExtension) {
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    return {
      fileID: String(fallbackValue || '').trim(),
      previewUrl: String(fallbackPreviewValue || '').trim()
    };
  }

  const fileID = await uploadFileIfNeeded(fileInput, folder, '', fallbackExtension);
  let previewUrl = '';

  try {
    previewUrl = await resolveMediaUrl(fileID);
  } catch (error) {
    previewUrl = '';
  }

  return {
    fileID,
    previewUrl
  };
}

function isCloudFileUrl(value) {
  return String(value || '').trim().startsWith('cloud://');
}

async function resolveMediaUrl(value) {
  const url = String(value || '').trim();

  if (!url || !isCloudFileUrl(url)) {
    return url;
  }

  try {
    const result = await app.getTempFileURL({
      fileList: [url]
    });
    const fileList = result.fileList || (result.result && result.result.fileList) || (result.data && result.data.fileList) || [];
    const file = fileList[0] || {};
    const status = String(file.status || '').toUpperCase();
    const tempUrl = file.tempFileURL || file.tempFileUrl || file.download_url || file.downloadUrl || file.url || '';

    if (!file.code && (!file.status || file.status === 0 || status === 'SUCCESS') && tempUrl) {
      return tempUrl;
    }

    console.warn('getTempFileURL fallback to cloud function', result);
  } catch (error) {
    console.warn('getTempFileURL failed, fallback to cloud function', error);
  }

  const fallback = await callAdmin('getTempFileUrl', {
    fileID: url
  });

  return fallback.tempFileURL;
}

async function hydrateImage(image, source) {
  const url = String(source || '').trim();

  if (!url) {
    image.classList.add('is-empty');
    image.removeAttribute('src');
    image.title = '没有图片地址';
    return;
  }

  try {
    const previewUrl = await resolveMediaUrl(url);
    image.src = previewUrl;
    image.title = url;
    image.classList.remove('is-empty');
  } catch (error) {
    image.alt = error.message || '图片加载失败';
    image.removeAttribute('src');
    image.title = error.message || '图片加载失败';
    image.classList.add('is-empty');
  }
}

async function openMediaPreview(type, source, title) {
  const url = String(source || '').trim();

  if (!url) {
    alert('没有可预览的媒体地址');
    return;
  }

  mediaPreviewTitle.textContent = title || '媒体预览';
  mediaPreviewBody.innerHTML = '<div class="empty">正在加载预览...</div>';
  mediaPreviewModal.classList.remove('hidden');

  try {
    const previewUrl = await resolveMediaUrl(url);

    if (type === 'video') {
      mediaPreviewBody.innerHTML = `<video class="media-preview-video" src="${escapeHtml(previewUrl)}" controls autoplay></video>`;
      return;
    }

    mediaPreviewBody.innerHTML = `<img class="media-preview-image" src="${escapeHtml(previewUrl)}" alt="${escapeHtml(title || '图片预览')}">`;
  } catch (error) {
    mediaPreviewBody.innerHTML = `<div class="empty">${escapeHtml(error.message || '预览失败')}</div>`;
  }
}

function closeMediaPreview() {
  mediaPreviewBody.innerHTML = '';
  mediaPreviewModal.classList.add('hidden');
}

function showManager() {
  loginPanel.classList.add('hidden');
  managerPanel.classList.remove('hidden');
}

function showLogin() {
  managerPanel.classList.add('hidden');
  loginPanel.classList.remove('hidden');
}

function statusText(status) {
  return {
    approved: '已通过',
    closed: '已关闭',
    contacted: '已联系',
    draft: '草稿',
    hidden: '隐藏',
    pending: '待处理',
    published: '展示中',
    rejected: '未通过',
    reviewing: '审核中'
  }[status] || status || '-';
}

function renderStatus(status) {
  return `<span class="status-badge status-${escapeHtml(status || 'pending')}">${escapeHtml(statusText(status))}</span>`;
}

function switchPanel(panel) {
  activePanel = panel;
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.panel === panel));
  panels.forEach((item) => item.classList.toggle('active', item.dataset.panel === panel));
  loadActivePanel();
}

function resetCaseForm() {
  caseForm.reset();
  caseForm.elements.id.value = '';
  caseForm.elements.sort_order.value = '0';
  caseForm.elements.status.value = 'published';
  setMessage(caseMessage, '');
}

function collectCaseData(coverUrl, videoUrl, coverPreviewUrl = '') {
  return {
    id: caseForm.elements.id.value.trim(),
    title: caseForm.elements.title.value.trim(),
    location: caseForm.elements.location.value.trim(),
    tag: caseForm.elements.tag.value.trim(),
    cover_url: coverUrl,
    cover_preview_url: coverPreviewUrl,
    video_url: videoUrl,
    summary: caseForm.elements.summary.value.trim(),
    detail: caseForm.elements.detail.value.trim(),
    status: caseForm.elements.status.value,
    sort_order: Number(caseForm.elements.sort_order.value || 0)
  };
}

function editCase(item) {
  caseForm.elements.id.value = item.id || '';
  caseForm.elements.title.value = item.title || '';
  caseForm.elements.location.value = item.location || '';
  caseForm.elements.tag.value = item.tag || '';
  caseForm.elements.cover_url.value = item.cover_url || item.image || '';
  caseForm.elements.video_url.value = item.video_url || '';
  caseForm.elements.summary.value = item.summary || item.desc || '';
  caseForm.elements.detail.value = item.detail || '';
  caseForm.elements.status.value = item.status || 'published';
  caseForm.elements.sort_order.value = item.sort_order || 0;
  setMessage(caseMessage, `正在编辑：${item.title || ''}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveCase(event) {
  event.preventDefault();
  setMessage(caseMessage, '正在保存...');

  try {
    const cover = await uploadFileWithPreviewIfNeeded(caseForm.elements.cover_file, 'festival-case-covers', caseForm.elements.cover_url.value, '', 'jpg');
    const videoUrl = await uploadFileIfNeeded(caseForm.elements.video_file, 'festival-case-videos', caseForm.elements.video_url.value, 'mp4');
    await callAdmin('saveCase', { caseData: collectCaseData(cover.fileID, videoUrl, cover.previewUrl) });
    setMessage(caseMessage, '已保存', 'success');
    resetCaseForm();
    await loadCases();
  } catch (error) {
    setMessage(caseMessage, error.message || '保存失败', 'error');
  }
}

function renderCase(item) {
  const card = document.createElement('article');
  card.className = 'case-admin-card';
  const coverUrl = item.cover_preview_url || item.cover_url || item.image || '';
  card.innerHTML = `
    <button class="media-thumb-button" type="button" aria-label="预览案例封面">
      <img class="case-admin-cover" alt="案例封面">
      <span class="media-thumb-empty">暂无预览</span>
    </button>
    <div class="case-admin-body">
      <div class="case-admin-head">
        <div>
          <h3>${escapeHtml(item.title || '-')}</h3>
          <p>${escapeHtml(item.location || '-')}</p>
        </div>
        ${renderStatus(item.status)}
      </div>
      <p class="case-admin-summary">${escapeHtml(item.summary || item.desc || '暂无简介')}</p>
      <div class="news-meta">
        <span>标签：${escapeHtml(item.tag || '-')}</span>
        <span>排序：${escapeHtml(item.sort_order || 0)}</span>
        <span>视频：${item.video_url ? '已设置' : '未设置'}</span>
      </div>
      <div class="actions"></div>
    </div>
  `;
  const cover = card.querySelector('.case-admin-cover');
  const coverButton = card.querySelector('.media-thumb-button');
  hydrateImage(cover, coverUrl);
  coverButton.addEventListener('click', () => openMediaPreview('image', coverUrl, item.title || '案例封面'));

  const actions = card.querySelector('.actions');
  addAction(actions, '编辑', '', () => editCase(item));
  addAction(actions, '预览封面', 'ghost', () => openMediaPreview('image', coverUrl, item.title || '案例封面'));
  if (item.video_url) {
    addAction(actions, '预览视频', 'ghost', () => openMediaPreview('video', item.video_url, item.title || '案例视频'));
  }
  addAction(actions, '展示', '', () => updateCaseStatus(item.id, 'published'));
  addAction(actions, '隐藏', 'ghost', () => updateCaseStatus(item.id, 'hidden'));
  addAction(actions, '草稿', 'ghost', () => updateCaseStatus(item.id, 'draft'));
  addAction(actions, '删除', 'danger', () => deleteCase(item.id));
  return card;
}

async function loadCases() {
  caseList.innerHTML = '<div class="empty">正在加载...</div>';
  try {
    const data = await callAdmin('listCases', { status: caseStatusFilter.value });
    caseList.innerHTML = data.length ? '' : '<div class="empty">暂无案例</div>';
    data.forEach((item) => caseList.appendChild(renderCase(item)));
  } catch (error) {
    caseList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function updateCaseStatus(id, status) {
  await callAdmin('updateCaseStatus', { id, status });
  await loadCases();
}

async function deleteCase(id) {
  if (!confirm('确认删除这个案例吗？')) return;
  await callAdmin('deleteCase', { id });
  await loadCases();
}

function resetNewsForm() {
  newsForm.reset();
  newsForm.elements.id.value = '';
  newsForm.elements.category.value = '平台公告';
  newsForm.elements.sort_order.value = '0';
  newsForm.elements.status.value = 'draft';
  setMessage(newsMessage, '');
}

function collectNewsData(coverUrl) {
  return {
    id: newsForm.elements.id.value.trim(),
    title: newsForm.elements.title.value.trim(),
    category: newsForm.elements.category.value.trim(),
    summary: newsForm.elements.summary.value.trim(),
    content: newsForm.elements.content.value.trim(),
    cover_url: coverUrl,
    image_urls: newsForm.elements.image_urls.value.trim(),
    video_url: newsForm.elements.video_url.value.trim(),
    status: newsForm.elements.status.value,
    is_top: newsForm.elements.is_top.checked,
    sort_order: Number(newsForm.elements.sort_order.value || 0)
  };
}

function editNews(item) {
  newsForm.elements.id.value = item.id || '';
  newsForm.elements.title.value = item.title || '';
  newsForm.elements.category.value = item.category || '平台公告';
  newsForm.elements.summary.value = item.summary || '';
  newsForm.elements.content.value = item.content || '';
  newsForm.elements.cover_url.value = item.cover_url || '';
  newsForm.elements.image_urls.value = item.image_urls || '';
  newsForm.elements.video_url.value = item.video_url || '';
  newsForm.elements.status.value = item.status || 'draft';
  newsForm.elements.is_top.checked = Boolean(item.is_top);
  newsForm.elements.sort_order.value = item.sort_order || 0;
  setMessage(newsMessage, `正在编辑：${item.title || ''}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveNews(event) {
  event.preventDefault();
  setMessage(newsMessage, '正在保存...');
  try {
    const coverUrl = await uploadFileIfNeeded(newsForm.elements.cover_file, 'news-covers', newsForm.elements.cover_url.value, 'jpg');
    await callAdmin('saveNews', { news: collectNewsData(coverUrl) });
    setMessage(newsMessage, '已保存', 'success');
    resetNewsForm();
    await loadNews();
  } catch (error) {
    setMessage(newsMessage, error.message || '保存失败', 'error');
  }
}

function renderNews(item) {
  const card = document.createElement('article');
  card.className = 'news-card';
  const coverUrl = item.cover_url || '';
  card.innerHTML = `
    <button class="media-thumb-button" type="button" aria-label="预览动态封面">
      <img class="news-cover" alt="动态封面">
      <span class="media-thumb-empty">暂无预览</span>
    </button>
    <div>
      <div class="case-admin-head">
        <div>
          <h3>${escapeHtml(item.title || '-')}</h3>
          <p>${escapeHtml(item.category || '-')}</p>
        </div>
        ${renderStatus(item.status)}
      </div>
      <p>${escapeHtml(item.summary || '暂无摘要')}</p>
      <div class="news-meta">
        <span>${item.is_top ? '置顶' : '未置顶'}</span>
        <span>排序：${escapeHtml(item.sort_order || 0)}</span>
      </div>
      <div class="actions"></div>
    </div>
  `;
  const cover = card.querySelector('.news-cover');
  const coverButton = card.querySelector('.media-thumb-button');
  hydrateImage(cover, coverUrl);
  coverButton.addEventListener('click', () => openMediaPreview('image', coverUrl, item.title || '动态封面'));

  const actions = card.querySelector('.actions');
  addAction(actions, '编辑', '', () => editNews(item));
  addAction(actions, '预览封面', 'ghost', () => openMediaPreview('image', coverUrl, item.title || '动态封面'));
  if (item.video_url) {
    addAction(actions, '预览视频', 'ghost', () => openMediaPreview('video', item.video_url, item.title || '动态视频'));
  }
  addAction(actions, '发布', '', () => updateNewsStatus(item.id, 'published'));
  addAction(actions, '隐藏', 'ghost', () => updateNewsStatus(item.id, 'hidden'));
  addAction(actions, '草稿', 'ghost', () => updateNewsStatus(item.id, 'draft'));
  addAction(actions, '删除', 'danger', () => deleteNews(item.id));
  return card;
}

async function loadNews() {
  newsList.innerHTML = '<div class="empty">正在加载...</div>';
  try {
    const data = await callAdmin('listNews', { status: newsStatusFilter.value });
    newsList.innerHTML = data.length ? '' : '<div class="empty">暂无动态公告</div>';
    data.forEach((item) => newsList.appendChild(renderNews(item)));
  } catch (error) {
    newsList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function updateNewsStatus(id, status) {
  await callAdmin('updateNewsStatus', { id, status });
  await loadNews();
}

async function deleteNews(id) {
  if (!confirm('确认删除这条动态吗？')) return;
  await callAdmin('deleteNews', { id });
  await loadNews();
}

function resetProductForm() {
  productForm.reset();
  productForm.elements.id.value = '';
  productForm.elements.sort_order.value = '0';
  productForm.elements.status.value = 'draft';
  setMessage(productMessage, '');
}

function collectProductData(coverUrl) {
  return {
    id: productForm.elements.id.value.trim(),
    name: productForm.elements.name.value.trim(),
    category: productForm.elements.category.value.trim(),
    cover_url: coverUrl,
    image_urls: productForm.elements.image_urls.value.trim(),
    summary: productForm.elements.summary.value.trim(),
    specs: productForm.elements.specs.value.trim(),
    detail: productForm.elements.detail.value.trim(),
    contact_wechat: productForm.elements.contact_wechat.value.trim(),
    contact_phone: productForm.elements.contact_phone.value.trim(),
    status: productForm.elements.status.value,
    sort_order: Number(productForm.elements.sort_order.value || 0)
  };
}

function editProduct(item) {
  productForm.elements.id.value = item.id || '';
  productForm.elements.name.value = item.name || '';
  productForm.elements.category.value = item.category || '';
  productForm.elements.cover_url.value = item.cover_url || '';
  productForm.elements.image_urls.value = item.image_urls || '';
  productForm.elements.summary.value = item.summary || '';
  productForm.elements.specs.value = item.specs || '';
  productForm.elements.detail.value = item.detail || '';
  productForm.elements.contact_wechat.value = item.contact_wechat || '';
  productForm.elements.contact_phone.value = item.contact_phone || '';
  productForm.elements.status.value = item.status || 'draft';
  productForm.elements.sort_order.value = item.sort_order || 0;
  setMessage(productMessage, `正在编辑：${item.name || ''}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveProduct(event) {
  event.preventDefault();
  setMessage(productMessage, '正在保存...');

  try {
    const coverUrl = await uploadFileIfNeeded(
      productForm.elements.cover_file,
      'product-covers',
      productForm.elements.cover_url.value,
      'jpg'
    );
    await callAdmin('saveProduct', { product: collectProductData(coverUrl) });
    resetProductForm();
    await loadProducts();
    setMessage(productMessage, '产品已保存', 'success');
  } catch (error) {
    setMessage(productMessage, error.message || '保存失败', 'error');
  }
}

function renderProduct(item) {
  const card = document.createElement('article');
  card.className = 'news-card';
  const coverUrl = item.cover_url || '';

  card.innerHTML = `
    <button class="media-thumb-button" type="button" aria-label="预览产品封面">
      <img class="news-cover" alt="产品封面">
      <span class="media-thumb-empty">暂无预览</span>
    </button>
    <div>
      <div class="case-admin-head">
        <div>
          <h3>${escapeHtml(item.name || '-')}</h3>
          <p>${escapeHtml(item.category || '-')}</p>
        </div>
        ${renderStatus(item.status)}
      </div>
      <p>${escapeHtml(item.summary || '暂无摘要')}</p>
      <div class="news-meta">
        <span>批发价联系我们</span>
        <span>排序：${escapeHtml(item.sort_order || 0)}</span>
        <span>微信：${escapeHtml(item.contact_wechat || '-')}</span>
        <span>电话：${escapeHtml(item.contact_phone || '-')}</span>
      </div>
      <div class="actions"></div>
    </div>
  `;

  const cover = card.querySelector('.news-cover');
  const coverButton = card.querySelector('.media-thumb-button');
  hydrateImage(cover, coverUrl);
  coverButton.addEventListener('click', () => openMediaPreview('image', coverUrl, item.name || '产品封面'));

  const actions = card.querySelector('.actions');
  addAction(actions, '编辑', '', () => editProduct(item));
  addAction(actions, '预览封面', 'ghost', () => openMediaPreview('image', coverUrl, item.name || '产品封面'));
  addAction(actions, '上架', '', () => updateProductStatus(item.id, 'published'));
  addAction(actions, '隐藏', 'ghost', () => updateProductStatus(item.id, 'hidden'));
  addAction(actions, '草稿', 'ghost', () => updateProductStatus(item.id, 'draft'));
  addAction(actions, '删除', 'danger', () => deleteProduct(item.id));
  return card;
}

async function loadProducts() {
  productList.innerHTML = '<div class="empty">正在加载...</div>';

  try {
    const data = await callAdmin('listProducts', { status: productStatusFilter.value });
    productList.innerHTML = data.length ? '' : '<div class="empty">暂无产品</div>';
    data.forEach((item) => productList.appendChild(renderProduct(item)));
  } catch (error) {
    productList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function updateProductStatus(id, status) {
  await callAdmin('updateProductStatus', { id, status });
  await loadProducts();
}

async function deleteProduct(id) {
  if (!confirm('确认删除这个产品吗？')) return;
  await callAdmin('deleteProduct', { id });
  await loadProducts();
}

async function seedProducts() {
  if (!confirm('仅当产品集合为空时导入两个示例产品，是否继续？')) return;

  try {
    const result = await callAdmin('seedProducts');
    await loadProducts();
    setMessage(productMessage, `已导入 ${result.count || 0} 个示例产品`, 'success');
  } catch (error) {
    setMessage(productMessage, error.message || '导入失败', 'error');
  }
}

function addAction(container, text, className, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  if (className) button.className = className;
  button.addEventListener('click', handler);
  container.appendChild(button);
}

function renderRecord(item, type) {
  const card = document.createElement('article');
  card.className = 'booking-card';
  const isLead = type === 'lead';
  const title = isLead ? item.cooperation_type || '合作意向' : item.artist_name || '艺人预约';
  const subtitle = `${item.contact_name || '-'} / ${item.phone || '-'}`;
  card.innerHTML = `
    <div class="booking-head">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      ${renderStatus(item.status)}
    </div>
    <dl class="info-grid compact">
      <div><dt>${isLead ? '公司 / 品牌' : '演出城市'}</dt><dd>${escapeHtml(isLead ? item.company || '-' : item.city || '-')}</dd></div>
      <div><dt>${isLead ? '活动城市' : '预计时间'}</dt><dd>${escapeHtml(isLead ? item.city || '-' : item.event_time || '-')}</dd></div>
      <div><dt>${isLead ? '预计时间' : '预算'}</dt><dd>${escapeHtml(isLead ? item.event_date || '-' : item.budget || '-')}</dd></div>
    </dl>
    <p class="bio">${escapeHtml(item.requirement || '暂无需求说明')}</p>
    <div class="actions"></div>
  `;
  const actions = card.querySelector('.actions');
  const updater = isLead ? updateLeadStatus : updateBookingStatus;
  addAction(actions, '待处理', 'ghost', () => updater(item.id, 'pending'));
  addAction(actions, '已联系', '', () => updater(item.id, 'contacted'));
  addAction(actions, '关闭', 'danger', () => updater(item.id, 'closed'));
  addAction(actions, '复制手机', 'ghost', () => navigator.clipboard.writeText(item.phone || ''));
  return card;
}

async function loadLeads() {
  leadList.innerHTML = '<div class="empty">正在加载...</div>';
  try {
    const data = await callAdmin('listFestivalLeads', { status: leadStatusFilter.value });
    leadList.innerHTML = data.length ? '' : '<div class="empty">暂无合作意向</div>';
    data.forEach((item) => leadList.appendChild(renderRecord(item, 'lead')));
  } catch (error) {
    leadList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function updateLeadStatus(id, status) {
  await callAdmin('updateFestivalLeadStatus', { id, status });
  await loadLeads();
}

function renderPromotion(item) {
  const card = document.createElement('article');
  card.className = 'booking-card';
  card.innerHTML = `
    <div class="booking-head">
      <div>
        <h3>${escapeHtml(item.target_position || '晋升申请')}</h3>
        <p>${escapeHtml(item.name || '-')} / ${escapeHtml(item.phone || '-')}</p>
      </div>
      ${renderStatus(item.status)}
    </div>
    <dl class="info-grid compact">
      <div><dt>年龄 / 性别</dt><dd>${escapeHtml(`${item.age || '-'} / ${item.gender || '-'}`)}</dd></div>
      <div><dt>所在门店</dt><dd>${escapeHtml(item.store || '-')}</dd></div>
      <div><dt>现任职位</dt><dd>${escapeHtml(item.current_position || '-')}</dd></div>
      <div><dt>目标职位</dt><dd>${escapeHtml(item.target_position || '-')}</dd></div>
    </dl>
    <p class="bio">${escapeHtml(item.ability_statement || '暂无能力自诉')}</p>
    ${item.review_note ? `<p class="bio">审核意见：${escapeHtml(item.review_note)}</p>` : ''}
    <div class="actions"></div>
  `;
  const actions = card.querySelector('.actions');
  addAction(actions, '审核中', 'ghost', () => updatePromotionStatus(item.id, 'reviewing', item.review_note || ''));
  addAction(actions, '通过', '', () => updatePromotionStatus(item.id, 'approved', item.review_note || ''));
  addAction(actions, '未通过', 'danger', () => updatePromotionStatus(item.id, 'rejected', item.review_note || ''));
  addAction(actions, '恢复待处理', 'ghost', () => updatePromotionStatus(item.id, 'pending', item.review_note || ''));
  addAction(actions, '复制手机', 'ghost', () => navigator.clipboard.writeText(item.phone || ''));
  return card;
}

async function loadPromotions() {
  promotionList.innerHTML = '<div class="empty">正在加载...</div>';
  try {
    const data = await callAdmin('listPromotionApplications', { status: promotionStatusFilter.value });
    promotionList.innerHTML = data.length ? '' : '<div class="empty">暂无晋升申请</div>';
    data.forEach((item) => promotionList.appendChild(renderPromotion(item)));
  } catch (error) {
    promotionList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function updatePromotionStatus(id, status, currentNote = '') {
  let reviewNote = currentNote;
  if (status === 'approved' || status === 'rejected') {
    const input = prompt('请输入审核意见（可留空）', currentNote);
    if (input === null) return;
    reviewNote = input.trim();
  }
  await callAdmin('updatePromotionStatus', { id, status, review_note: reviewNote });
  await loadPromotions();
}

async function loadBookings() {
  bookingList.innerHTML = '<div class="empty">正在加载...</div>';
  try {
    const data = await callAdmin('listBookings', { status: bookingStatusFilter.value });
    bookingList.innerHTML = data.length ? '' : '<div class="empty">暂无艺人预约</div>';
    data.forEach((item) => bookingList.appendChild(renderRecord(item, 'booking')));
  } catch (error) {
    bookingList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function updateBookingStatus(id, status) {
  await callAdmin('updateBookingStatus', { id, status });
  await loadBookings();
}

function firstMedia(value) {
  if (Array.isArray(value)) {
    return value.find(Boolean) || '';
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .find(Boolean) || '';
}

function resetArtistForm({ hide = true } = {}) {
  artistForm.reset();
  artistForm.elements.id.value = '';
  artistForm.elements.category.value = '歌手';
  artistForm.elements.status.value = 'pending';
  artistForm.elements.work_status.value = 'available';
  artistForm.elements.is_hidden.checked = false;
  artistForm.elements.is_featured_guest.checked = false;
  setMessage(artistMessage, '');

  if (hide) {
    artistForm.classList.add('hidden');
  }
}

function createArtist() {
  resetArtistForm({ hide: false });
  artistForm.classList.remove('hidden');
  artistForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function collectArtistData(avatarUrl, coverUrl) {
  return {
    id: artistForm.elements.id.value.trim(),
    stage_name: artistForm.elements.stage_name.value.trim(),
    real_name: artistForm.elements.real_name.value.trim(),
    phone: artistForm.elements.phone.value.trim(),
    city: artistForm.elements.city.value.trim(),
    dispatch_cities: artistForm.elements.dispatch_cities.value.trim(),
    category: artistForm.elements.category.value,
    tags: artistForm.elements.tags.value.trim(),
    singing_type: artistForm.elements.singing_type.value.trim(),
    gender: artistForm.elements.gender.value,
    age: artistForm.elements.age.value.trim(),
    height: artistForm.elements.height.value.trim(),
    price: artistForm.elements.price.value,
    status: artistForm.elements.status.value,
    work_status: artistForm.elements.work_status.value,
    is_hidden: artistForm.elements.is_hidden.checked,
    is_featured_guest: artistForm.elements.is_featured_guest.checked,
    avatar_url: avatarUrl,
    art_photo_urls: coverUrl,
    life_photo_urls: artistForm.elements.life_photo_urls.value.trim(),
    photo_urls: artistForm.elements.photo_urls.value.trim(),
    video_urls: artistForm.elements.video_urls.value.trim(),
    bio: artistForm.elements.bio.value.trim(),
    reject_reason: artistForm.elements.reject_reason.value.trim()
  };
}

function setSelectValue(select, value) {
  const text = String(value || '');

  if (text && ![...select.options].some((option) => option.value === text)) {
    select.add(new Option(text, text));
  }

  select.value = text;
}

function editArtist(item) {
  artistForm.classList.remove('hidden');
  artistForm.elements.id.value = item.id || '';
  artistForm.elements.stage_name.value = item.stage_name || '';
  artistForm.elements.real_name.value = item.real_name || '';
  artistForm.elements.phone.value = item.phone || '';
  artistForm.elements.city.value = item.city || '';
  artistForm.elements.dispatch_cities.value = item.dispatch_cities || '';
  artistForm.elements.category.value = item.category || '歌手';
  artistForm.elements.tags.value = item.tags || '';
  artistForm.elements.singing_type.value = item.singing_type || '';
  artistForm.elements.gender.value = item.gender || '';
  artistForm.elements.age.value = item.age || '';
  artistForm.elements.height.value = item.height || '';
  setSelectValue(artistForm.elements.price, item.price || '');
  artistForm.elements.status.value = item.status || 'pending';
  artistForm.elements.work_status.value = item.work_status || 'available';
  artistForm.elements.is_hidden.checked = Boolean(item.is_hidden);
  artistForm.elements.is_featured_guest.checked = Boolean(item.is_featured_guest);
  artistForm.elements.avatar_url.value = item.avatar_url || '';
  artistForm.elements.art_photo_urls.value = item.art_photo_urls || '';
  artistForm.elements.life_photo_urls.value = item.life_photo_urls || '';
  artistForm.elements.photo_urls.value = item.photo_urls || '';
  artistForm.elements.video_urls.value = item.video_urls || item.video_url || '';
  artistForm.elements.bio.value = item.bio || '';
  artistForm.elements.reject_reason.value = item.reject_reason || '';
  setMessage(artistMessage, `正在编辑：${item.stage_name || item.real_name || '未命名艺人'}`);
  artistForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveArtist(event) {
  event.preventDefault();
  setMessage(artistMessage, '正在保存...');

  try {
    const avatarUrl = await uploadFileIfNeeded(
      artistForm.elements.avatar_file,
      'artist-avatars',
      artistForm.elements.avatar_url.value,
      'jpg'
    );
    const existingCovers = artistForm.elements.art_photo_urls.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const uploadedCover = await uploadFileIfNeeded(
      artistForm.elements.cover_file,
      'artist-covers',
      '',
      'jpg'
    );
    const coverUrl = uploadedCover
      ? [uploadedCover, ...existingCovers.slice(1)].join(',')
      : existingCovers.join(',');
    await callAdmin('saveArtist', {
      artist: collectArtistData(avatarUrl, coverUrl)
    });
    resetArtistForm();
    await loadArtists();
    setMessage(artistMessage, '艺人资料已保存', 'success');
  } catch (error) {
    setMessage(artistMessage, error.message || '保存失败', 'error');
  }
}

function renderArtist(item) {
  const card = document.createElement('article');
  card.className = `artist-card${item.is_hidden ? ' is-hidden' : ''}`;
  const avatarUrl = item.avatar_url || '';
  const coverUrl = firstMedia(item.art_photo_urls) || firstMedia(item.photo_urls) || avatarUrl;
  card.innerHTML = `
    <div class="artist-card-header">
      <div>
        <h3>${escapeHtml(item.stage_name || item.real_name || '未命名艺人')}</h3>
        <p>
          <span>${escapeHtml(item.city || '-')}</span>
          <span>${escapeHtml(item.category || item.tags || '-')}</span>
          <span>${escapeHtml(item.phone || '-')}</span>
        </p>
      </div>
      ${renderStatus(item.status)}
    </div>
    <div class="artist-state-row">
      <span class="artist-state">${escapeHtml(item.work_status === 'available' ? '可预约 / 待岗' : item.work_status === 'on_duty' ? '已下店' : '暂停接单')}</span>
      <span class="artist-state">${item.is_hidden ? '已隐藏' : '小程序展示中'}</span>
      <span class="artist-state">${item.is_featured_guest ? '飞行嘉宾艺人' : '普通艺人'}</span>
    </div>
    <dl class="info-grid compact">
      <div><dt>真实姓名</dt><dd>${escapeHtml(item.real_name || '-')}</dd></div>
      <div><dt>报价</dt><dd>${escapeHtml(item.price || '-')}</dd></div>
      <div><dt>唱功类型</dt><dd>${escapeHtml(item.singing_type || '-')}</dd></div>
      <div><dt>调度城市</dt><dd>${escapeHtml(item.dispatch_cities || '-')}</dd></div>
    </dl>
    <p class="bio">${escapeHtml(item.bio || '暂无简介')}</p>
    <div class="artist-media-preview">
      <button class="media-thumb-button avatar-preview-button" type="button" aria-label="预览头像">
        <img class="media-thumb artist-avatar-preview" alt="艺人头像">
        <span class="media-thumb-empty">暂无头像</span>
      </button>
      <button class="media-thumb-button cover-preview-button" type="button" aria-label="预览推荐封面">
        <img class="media-thumb artist-cover-preview" alt="推荐封面">
        <span class="media-thumb-empty">暂无封面</span>
      </button>
    </div>
    <div class="actions"></div>
  `;
  const avatar = card.querySelector('.artist-avatar-preview');
  const cover = card.querySelector('.artist-cover-preview');
  hydrateImage(avatar, avatarUrl);
  hydrateImage(cover, coverUrl);
  card.querySelector('.avatar-preview-button').addEventListener('click', () => openMediaPreview('image', avatarUrl, `${item.stage_name || ''}头像`));
  card.querySelector('.cover-preview-button').addEventListener('click', () => openMediaPreview('image', coverUrl, `${item.stage_name || ''}推荐封面`));

  const actions = card.querySelector('.actions');
  addAction(actions, '编辑资料', '', () => editArtist(item));
  addAction(actions, '通过', '', () => reviewArtist(item.id, 'approved'));
  addAction(actions, '驳回', 'danger', () => {
    const reason = prompt('请输入驳回原因', item.reject_reason || '资料不完整');
    if (reason !== null) reviewArtist(item.id, 'rejected', reason);
  });
  addAction(actions, '设为待岗', 'ghost', () => updateArtistState(item.id, { work_status: 'available' }));
  addAction(actions, '设为下店', 'ghost', () => updateArtistState(item.id, { work_status: 'on_duty' }));
  addAction(
    actions,
    item.is_featured_guest ? '取消飞行嘉宾' : '设为飞行嘉宾',
    item.is_featured_guest ? 'ghost' : '',
    () => updateArtistState(item.id, { is_featured_guest: !item.is_featured_guest })
  );
  addAction(actions, item.is_hidden ? '恢复展示' : '隐藏', 'ghost', () => updateArtistState(item.id, { is_hidden: !item.is_hidden }));
  addAction(actions, '删除', 'danger', () => deleteArtist(item.id));
  return card;
}

function formatLogTime(value) {
  if (!value) {
    return '-';
  }

  if (typeof value === 'string') {
    return value.replace('T', ' ').slice(0, 19);
  }

  if (value.$date) {
    return new Date(value.$date).toLocaleString();
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  return String(value);
}

function renderLog(item) {
  const card = document.createElement('article');
  card.className = 'log-card';
  const detail = item.detail || {};

  card.innerHTML = `
    <div class="log-head">
      <strong>${escapeHtml(item.action || '-')}</strong>
      <span>${escapeHtml(formatLogTime(item.created_at))}</span>
    </div>
    <div class="log-meta">
      <span>来源：${escapeHtml(item.source || '-')}</span>
      <span>密码尾号：${escapeHtml(item.admin_key_suffix || '-')}</span>
      <span>ID：${escapeHtml(detail.id || '-')}</span>
    </div>
    <pre>${escapeHtml(JSON.stringify(detail, null, 2))}</pre>
  `;

  return card;
}

async function loadLogs() {
  logList.innerHTML = '<div class="empty">正在加载...</div>';
  try {
    const data = await callAdmin('listOperationLogs');
    logList.innerHTML = data.length ? '' : '<div class="empty">暂无操作日志</div>';
    data.forEach((item) => logList.appendChild(renderLog(item)));
  } catch (error) {
    logList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function loadArtists() {
  artistList.innerHTML = '<div class="empty">正在加载...</div>';
  try {
    const data = await callAdmin('listArtists', { status: artistStatusFilter.value });
    artistList.innerHTML = data.length ? '' : '<div class="empty">暂无艺人资料</div>';
    data.forEach((item) => artistList.appendChild(renderArtist(item)));
  } catch (error) {
    artistList.innerHTML = `<div class="empty">${escapeHtml(error.message || '加载失败')}</div>`;
  }
}

async function reviewArtist(id, status, reason = '') {
  await callAdmin('reviewArtist', { id, status, reason });
  await loadArtists();
}

async function updateArtistState(id, patch) {
  await callAdmin('updateArtistState', { id, patch });
  await loadArtists();
}

async function deleteArtist(id) {
  if (!confirm('确认永久删除这位艺人及其资料吗？')) return;
  await callAdmin('deleteArtist', { id });
  resetArtistForm();
  await loadArtists();
}

function loadActivePanel() {
  if (activePanel === 'news') return loadNews();
  if (activePanel === 'products') return loadProducts();
  if (activePanel === 'leads') return loadLeads();
  if (activePanel === 'promotions') return loadPromotions();
  if (activePanel === 'bookings') return loadBookings();
  if (activePanel === 'artists') return loadArtists();
  if (activePanel === 'logs') return loadLogs();
  return loadCases();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  adminKey = adminKeyInput.value.trim();
  sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
  setMessage(loginMessage, '正在进入...');

  try {
    await callAdmin('listCases');
    showManager();
    await loadActivePanel();
  } catch (error) {
    setMessage(loginMessage, error.message || '登录失败', 'error');
  }
});

tabs.forEach((tab) => tab.addEventListener('click', () => switchPanel(tab.dataset.panel)));
refreshBtn.addEventListener('click', loadActivePanel);
logoutBtn.addEventListener('click', () => {
  adminKey = '';
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  showLogin();
});
mediaPreviewClose.addEventListener('click', closeMediaPreview);
mediaPreviewModal.addEventListener('click', (event) => {
  if (event.target.dataset.closePreview !== undefined) {
    closeMediaPreview();
  }
});

caseForm.addEventListener('submit', saveCase);
caseResetBtn.addEventListener('click', resetCaseForm);
caseStatusFilter.addEventListener('change', loadCases);
newsForm.addEventListener('submit', saveNews);
newsResetBtn.addEventListener('click', resetNewsForm);
newsStatusFilter.addEventListener('change', loadNews);
productForm.addEventListener('submit', saveProduct);
productResetBtn.addEventListener('click', resetProductForm);
productStatusFilter.addEventListener('change', loadProducts);
seedProductsBtn.addEventListener('click', seedProducts);
leadStatusFilter.addEventListener('change', loadLeads);
promotionStatusFilter.addEventListener('change', loadPromotions);
bookingStatusFilter.addEventListener('change', loadBookings);
artistForm.addEventListener('submit', saveArtist);
artistResetBtn.addEventListener('click', resetArtistForm);
artistCreateBtn.addEventListener('click', createArtist);
artistStatusFilter.addEventListener('change', loadArtists);

initCloud()
  .then(async () => {
    if (adminKey) {
      try {
        await callAdmin('listCases');
        showManager();
        await loadActivePanel();
        return;
      } catch (error) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      }
    }
    showLogin();
  })
  .catch((error) => {
    setMessage(loginMessage, error.message || '云开发初始化失败', 'error');
    showLogin();
  });
