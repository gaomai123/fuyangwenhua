const caseForm = document.querySelector('#festivalCaseForm');
const caseFormReset = document.querySelector('#caseFormReset');
const caseList = document.querySelector('#festivalCaseList');
const caseMessage = document.querySelector('#caseMessage');
const refreshCasesBtn = document.querySelector('#refreshCasesBtn');

if (!AdminApi.getToken()) {
  window.location.href = './login.html';
}

function formatDateTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

async function uploadFileIfNeeded(input, endpoint, fallbackValue) {
  if (!input.files || input.files.length === 0) {
    return fallbackValue.trim();
  }

  const formData = new FormData();
  formData.append('file', input.files[0]);

  const response = await fetch(`${AdminApi.API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || '文件上传失败');
  }

  return data.data.url;
}

function resetCaseForm() {
  caseForm.reset();
  caseForm.elements.id.value = '';
  caseForm.elements.sort_order.value = '0';
  caseForm.elements.status.value = 'published';
  caseMessage.textContent = '';
}

function collectCaseData(coverUrl, videoUrl) {
  return {
    title: caseForm.elements.title.value.trim(),
    location: caseForm.elements.location.value.trim(),
    tag: caseForm.elements.tag.value.trim(),
    cover_url: coverUrl,
    video_url: videoUrl,
    summary: caseForm.elements.summary.value.trim(),
    detail: caseForm.elements.detail.value.trim(),
    status: caseForm.elements.status.value,
    sort_order: Number(caseForm.elements.sort_order.value || 0)
  };
}

async function saveCase(event) {
  event.preventDefault();
  caseMessage.textContent = '正在保存...';

  try {
    const id = caseForm.elements.id.value;
    const coverUrl = await uploadFileIfNeeded(caseForm.elements.cover_file, '/uploads/case-cover', caseForm.elements.cover_url.value);
    const videoUrl = await uploadFileIfNeeded(caseForm.elements.video_file, '/uploads/video', caseForm.elements.video_url.value);
    const body = collectCaseData(coverUrl, videoUrl);

    await AdminApi.request(id ? `/admin/festival-cases/${id}` : '/admin/festival-cases', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });

    caseMessage.textContent = id ? '案例已更新' : '案例已新增';
    resetCaseForm();
    await loadCases();
  } catch (error) {
    caseMessage.textContent = error.message;
  }
}

function editCase(item) {
  caseForm.elements.id.value = item.id;
  caseForm.elements.title.value = item.title || '';
  caseForm.elements.location.value = item.location || '';
  caseForm.elements.tag.value = item.tag || '';
  caseForm.elements.cover_url.value = item.cover_url || '';
  caseForm.elements.video_url.value = item.video_url || '';
  caseForm.elements.summary.value = item.summary || item.desc || '';
  caseForm.elements.detail.value = item.detail || '';
  caseForm.elements.status.value = item.status || 'published';
  caseForm.elements.sort_order.value = item.sort_order || 0;
  caseMessage.textContent = `正在编辑：${item.title}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateCaseStatus(id, status) {
  await AdminApi.request(`/admin/festival-cases/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  await loadCases();
}

async function deleteCase(id) {
  if (!confirm('确定删除这个案例吗？')) {
    return;
  }

  await AdminApi.request(`/admin/festival-cases/${id}`, { method: 'DELETE' });
  await loadCases();
}

function renderCase(item) {
  const card = document.createElement('article');
  card.className = 'case-admin-card';

  const cover = document.createElement('img');
  cover.className = 'case-admin-cover';
  cover.src = item.cover_url || item.image || '';
  cover.alt = item.title || '案例封面';
  card.appendChild(cover);

  const body = document.createElement('div');
  body.className = 'case-admin-body';
  body.innerHTML = `
    <div class="case-admin-head">
      <div>
        <h3>${item.title || '-'}</h3>
        <p>${item.location || '-'}</p>
      </div>
      <span class="status-badge status-${item.status || 'published'}">${item.status || '-'}</span>
    </div>
    <p class="case-admin-summary">${item.summary || item.desc || '暂无简介'}</p>
    <div class="news-meta">
      <span>角标：${item.tag || '-'}</span>
      <span>排序：${item.sort_order || 0}</span>
      <span>${formatDateTime(item.created_at)}</span>
    </div>
  `;

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.textContent = '编辑';
  editButton.addEventListener('click', () => editCase(item));
  actions.appendChild(editButton);

  const publishButton = document.createElement('button');
  publishButton.type = 'button';
  publishButton.textContent = '展示';
  publishButton.addEventListener('click', () => updateCaseStatus(item.id, 'published'));
  actions.appendChild(publishButton);

  const hideButton = document.createElement('button');
  hideButton.type = 'button';
  hideButton.className = 'ghost';
  hideButton.textContent = '隐藏';
  hideButton.addEventListener('click', () => updateCaseStatus(item.id, 'hidden'));
  actions.appendChild(hideButton);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'danger';
  deleteButton.textContent = '删除';
  deleteButton.addEventListener('click', () => deleteCase(item.id));
  actions.appendChild(deleteButton);

  body.appendChild(actions);
  card.appendChild(body);

  return card;
}

async function loadCases() {
  caseList.innerHTML = '<div class="empty">正在加载...</div>';

  try {
    const result = await AdminApi.request('/admin/festival-cases');
    caseList.innerHTML = '';

    if (!result.data.length) {
      caseList.innerHTML = '<div class="empty">暂无案例</div>';
      return;
    }

    result.data.forEach((item) => caseList.appendChild(renderCase(item)));
  } catch (error) {
    caseList.innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

caseForm.addEventListener('submit', saveCase);
caseFormReset.addEventListener('click', resetCaseForm);
refreshCasesBtn.addEventListener('click', loadCases);

loadCases();
