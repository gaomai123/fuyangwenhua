const navRoutes = {
  home: '/pages/index/index',
  dynamic: '/pages/dynamic/dynamic',
  brand: '/pages/brand/brand',
  messages: '/pages/messages/messages',
  artists: '/pages/artists/artists',
  submit: '/pages/submit/submit',
  customer: '/pages/customer/customer',
  festival: '/pages/festival/festival'
};

let navigating = false;

function getCurrentRoute() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];

  return current ? `/${current.route}` : '';
}

function goNavTarget(target) {
  const url = navRoutes[target];

  if (!url || url === getCurrentRoute() || navigating) {
    return;
  }

  const pages = getCurrentPages();
  const targetRoute = url.replace(/^\//, '');
  const existingIndex = pages.findIndex((page) => page.route === targetRoute);
  const finishNavigation = () => {
    setTimeout(() => {
      navigating = false;
    }, 80);
  };

  navigating = true;

  if (existingIndex >= 0 && existingIndex < pages.length - 1) {
    wx.navigateBack({
      delta: pages.length - 1 - existingIndex,
      animationDuration: 0,
      complete: finishNavigation
    });
    return;
  }

  if (pages.length >= 6) {
    wx.redirectTo({
      url,
      complete: finishNavigation
    });
    return;
  }

  wx.navigateTo({
    url,
    animationDuration: 0,
    complete: finishNavigation,
    fail() {
      wx.redirectTo({
        url,
        complete: finishNavigation
      });
    }
  });
}

module.exports = {
  goNavTarget,
  navRoutes
};
