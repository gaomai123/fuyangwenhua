(function initProductsAdmin() {
  const productStatusFilter = document.querySelector('#productStatusFilter');
  const productMessage = document.querySelector('#productMessage');
  const productForm = document.querySelector('#productForm');
  const productFormReset = document.querySelector('#productFormReset');
  const productList = document.querySelector('#productList');
  const productTemplate = document.querySelector('#productCardTemplate');
  const productTab = document.querySelector('[data-module="products"]');

  if (!productStatusFilter || !productForm || !productList || !productTemplate) {
    return;
  }

  const statusText = {
    draft: '草稿',
    published: '已上架',
    hidden: '已隐藏'
  };

  let loaded = false;

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

  function resetProductForm(clearMessage = true) {
    productForm.reset();
    productForm.elements.id.value = '';
    productForm.elements.sort_order.value = '0';
    productForm.elements.status.value = 'draft';

    if (clearMessage) {
      productMessage.textContent = '';
    }
  }

  function previewProductCover(product) {
    if (!product.cover_url) {
      productMessage.textContent = '该产品暂无封面';
      return;
    }

    const previewWindow = window.open(product.cover_url, '_blank');

    if (previewWindow) {
      previewWindow.opener = null;
    }
  }

  async function uploadProductCoverIfNeeded() {
    const fileInput = productForm.elements.cover_file;

    if (!fileInput.files || fileInput.files.length === 0) {
      return productForm.elements.cover_url.value.trim();
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

  function collectProductFormData(coverUrl) {
    return {
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

  function editProduct(product) {
    productForm.elements.id.value = product.id;
    productForm.elements.name.value = product.name || '';
    productForm.elements.category.value = product.category || '';
    productForm.elements.cover_url.value = product.cover_url || '';
    productForm.elements.image_urls.value = product.image_urls || '';
    productForm.elements.summary.value = product.summary || '';
    productForm.elements.specs.value = product.specs || '';
    productForm.elements.detail.value = product.detail || '';
    productForm.elements.contact_wechat.value = product.contact_wechat || '';
    productForm.elements.contact_phone.value = product.contact_phone || '';
    productForm.elements.status.value = product.status || 'draft';
    productForm.elements.sort_order.value = product.sort_order || 0;
    productMessage.textContent = `正在编辑：${product.name}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveProduct(event) {
    event.preventDefault();
    productMessage.textContent = '正在保存...';

    try {
      const id = productForm.elements.id.value;
      const coverUrl = await uploadProductCoverIfNeeded();
      const body = collectProductFormData(coverUrl);
      const path = id ? `/admin/products/${id}` : '/admin/products';
      const method = id ? 'PUT' : 'POST';

      await AdminApi.request(path, {
        method,
        body: JSON.stringify(body)
      });

      resetProductForm(false);
      await loadProducts(true);
      productMessage.textContent = id ? '产品已更新' : '产品已新增';
    } catch (error) {
      productMessage.textContent = error.message;
    }
  }

  async function updateProductStatus(id, status) {
    await AdminApi.request(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    productMessage.textContent = '产品状态已更新';
    await loadProducts(true);
  }

  async function deleteProduct(id) {
    if (!confirm('确定删除这个产品吗？')) {
      return;
    }

    await AdminApi.request(`/admin/products/${id}`, { method: 'DELETE' });
    productMessage.textContent = '产品已删除';
    await loadProducts(true);
  }

  function renderProduct(product) {
    const card = productTemplate.content.firstElementChild.cloneNode(true);
    const cover = card.querySelector('[data-field="cover_image"]');

    cover.src = product.cover_url || '';
    cover.classList.toggle('is-empty', !product.cover_url);
    setField(card, 'name', product.name);
    setField(card, 'summary', product.summary);
    setField(card, 'category', product.category);
    setField(card, 'status', statusText[product.status] || product.status);
    setField(card, 'sort_order', `排序 ${product.sort_order || 0}`);
    setField(card, 'created_at', formatDateTime(product.created_at));

    card.querySelector('[data-action="previewCover"]').addEventListener('click', () => previewProductCover(product));
    card.querySelector('[data-action="editProduct"]').addEventListener('click', () => editProduct(product));
    card.querySelector('[data-action="publishProduct"]').addEventListener('click', () => updateProductStatus(product.id, 'published'));
    card.querySelector('[data-action="hideProduct"]').addEventListener('click', () => updateProductStatus(product.id, 'hidden'));
    card.querySelector('[data-action="draftProduct"]').addEventListener('click', () => updateProductStatus(product.id, 'draft'));
    card.querySelector('[data-action="deleteProduct"]').addEventListener('click', () => deleteProduct(product.id));

    return card;
  }

  async function loadProducts(force = false) {
    if (!force && loaded) {
      return;
    }

    productMessage.textContent = '正在加载...';
    productList.innerHTML = '';

    try {
      const status = productStatusFilter.value;
      const path = status ? `/admin/products?status=${encodeURIComponent(status)}` : '/admin/products';
      const result = await AdminApi.request(path);

      if (result.data.length === 0) {
        productList.innerHTML = '<div class="empty">暂无产品</div>';
        productMessage.textContent = '';
        loaded = true;
        return;
      }

      result.data.forEach((product) => productList.appendChild(renderProduct(product)));
      productMessage.textContent = `共 ${result.data.length} 个产品`;
      loaded = true;
    } catch (error) {
      productMessage.textContent = error.message;
    }
  }

  productTab.addEventListener('click', () => loadProducts());
  productForm.addEventListener('submit', saveProduct);
  productFormReset.addEventListener('click', resetProductForm);
  productStatusFilter.addEventListener('change', () => loadProducts(true));

  window.ProductsAdmin = {
    loadProducts
  };
})();
