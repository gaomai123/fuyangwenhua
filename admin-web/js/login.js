const form = document.querySelector('#loginForm');
const message = document.querySelector('#message');

if (AdminApi.getToken()) {
  window.location.href = './index.html';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '正在登录...';

  const username = document.querySelector('#username').value.trim();
  const password = document.querySelector('#password').value.trim();

  try {
    const result = await AdminApi.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    AdminApi.setToken(result.data.token);
    window.location.href = './index.html';
  } catch (error) {
    message.textContent = error.message;
  }
});
