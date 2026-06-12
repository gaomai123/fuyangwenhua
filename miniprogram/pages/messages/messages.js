const {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead
} = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

const SWIPE_DELETE_WIDTH_RPX = 148;
const SWIPE_TRIGGER_RPX = 72;

Page({
  data: {
    loading: false,
    messages: [],
    filteredMessages: [],
    activeType: '',
    filterOptions: [
      { label: '全部', value: '' },
      { label: '审核', value: 'artist' },
      { label: '预约', value: 'booking' },
      { label: '音乐节', value: 'festival' },
      { label: '系统', value: 'system' }
    ],
    unreadCount: 0,
    unreadNotificationCount: 0,
    unreadNotificationText: '',
    markingAllRead: false,
    deletingId: ''
  },

  onLoad() {
    this.swipe = {
      startX: 0,
      activeId: '',
      deleteWidth: this.rpxToPx(SWIPE_DELETE_WIDTH_RPX),
      triggerWidth: this.rpxToPx(SWIPE_TRIGGER_RPX)
    };
  },

  onShow() {
    if (this.hasLoaded && this.lastLoadedAt && Date.now() - this.lastLoadedAt < 15000) {
      return;
    }

    clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(() => {
      this.loadMessages();
    }, 80);
  },

  onUnload() {
    clearTimeout(this.loadTimer);
  },

  onPullDownRefresh() {
    this.loadMessages().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  formatDate(value) {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const hour = String(value.getHours()).padStart(2, '0');
      const minute = String(value.getMinutes()).padStart(2, '0');
      return `${month}-${day} ${hour}:${minute}`;
    }

    return String(value).slice(5, 16).replace('T', ' ');
  },

  normalizeMessage(item) {
    return {
      ...item,
      display_date: this.formatDate(item.created_at),
      type_label: this.getTypeLabel(item.type),
      offsetX: 0
    };
  },

  getTypeLabel(type) {
    const map = {
      artist: '艺人审核',
      booking: '预约通知',
      festival: '音乐节',
      system: '系统通知'
    };

    return map[type] || '通知';
  },

  getFilteredMessages(messages = this.data.messages, activeType = this.data.activeType) {
    if (!activeType) {
      return messages;
    }

    return messages.filter((item) => item.type === activeType);
  },

  async loadMessages() {
    this.setData({ loading: true });

    try {
      const result = await getMyNotifications();
      const messages = (result.data || []).map((item) => this.normalizeMessage(item));
      const unreadCount = messages.filter((item) => !item.read).length;

      this.setData({
        messages,
        filteredMessages: this.getFilteredMessages(messages),
        unreadCount,
        unreadNotificationCount: unreadCount,
        unreadNotificationText: unreadCount > 99 ? '99+' : String(unreadCount)
      });
      this.hasLoaded = true;
      this.lastLoadedAt = Date.now();
    } catch (error) {
      wx.showToast({
        title: error.message || '读取消息失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onFilterTap(event) {
    const activeType = event.currentTarget.dataset.type || '';

    this.setData({
      activeType,
      filteredMessages: this.getFilteredMessages(this.data.messages, activeType)
    });
  },

  rpxToPx(value) {
    const info = wx.getSystemInfoSync();
    return (Number(value) || 0) * info.windowWidth / 750;
  },

  closeSwipe(messages = this.data.messages) {
    return messages.map((item) => (
      item.offsetX ? { ...item, offsetX: 0 } : item
    ));
  },

  setMessages(messages) {
    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages),
      unreadCount: messages.filter((item) => !item.read).length,
      unreadNotificationCount: messages.filter((item) => !item.read).length,
      unreadNotificationText: messages.filter((item) => !item.read).length > 99
        ? '99+'
        : String(messages.filter((item) => !item.read).length)
    });
  },

  onMessageTouchStart(event) {
    const id = event.currentTarget.dataset.id;

    this.swipe.startX = event.touches[0].clientX;
    this.swipe.activeId = id;

    const messages = this.data.messages.map((item) => (
      item.id === id ? item : { ...item, offsetX: 0 }
    ));

    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages)
    });
  },

  onMessageTouchMove(event) {
    const id = event.currentTarget.dataset.id;

    if (!id || this.swipe.activeId !== id) {
      return;
    }

    const deltaX = event.touches[0].clientX - this.swipe.startX;
    const offsetX = Math.max(-this.swipe.deleteWidth, Math.min(0, deltaX));
    const messages = this.data.messages.map((item) => (
      item.id === id ? { ...item, offsetX } : item
    ));

    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages)
    });
  },

  onMessageTouchEnd(event) {
    const id = event.currentTarget.dataset.id;

    if (!id || this.swipe.activeId !== id) {
      return;
    }

    const current = this.data.messages.find((item) => item.id === id);
    const shouldOpen = current && Math.abs(current.offsetX || 0) >= this.swipe.triggerWidth;
    const messages = this.data.messages.map((item) => (
      item.id === id ? { ...item, offsetX: shouldOpen ? -this.swipe.deleteWidth : 0 } : item
    ));

    this.swipe.activeId = '';

    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages)
    });
  },

  async onMessageTap(event) {
    const id = event.currentTarget.dataset.id;
    const read = event.currentTarget.dataset.read;

    if (this.data.messages.some((item) => item.offsetX)) {
      const messages = this.closeSwipe();
      this.setData({
        messages,
        filteredMessages: this.getFilteredMessages(messages)
      });
      return;
    }

    if (!id || read) {
      return;
    }

    try {
      await markNotificationRead(id);
      const messages = this.data.messages.map((item) => (
        item.id === id ? { ...item, read: true } : item
      ));
      const unreadCount = Math.max(this.data.unreadCount - 1, 0);

      this.setData({
        messages,
        filteredMessages: this.getFilteredMessages(messages),
        unreadCount,
        unreadNotificationCount: unreadCount,
        unreadNotificationText: unreadCount > 99 ? '99+' : String(unreadCount)
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  async onDeleteMessage(event) {
    const id = event.currentTarget.dataset.id;

    if (!id || this.data.deletingId) {
      return;
    }

    this.setData({ deletingId: id });

    try {
      await deleteNotification(id);
      const messages = this.data.messages.filter((item) => item.id !== id);

      this.setMessages(messages);

      wx.showToast({
        title: '已删除',
        icon: 'none'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
    } finally {
      this.setData({ deletingId: '' });
    }
  },

  async onMarkAllRead() {
    if (!this.data.unreadCount || this.data.markingAllRead) {
      return;
    }

    this.setData({ markingAllRead: true });

    try {
      await markAllNotificationsRead();
      const messages = this.data.messages.map((item) => ({
        ...item,
        read: true
      }));

      this.setData({
        messages,
        filteredMessages: this.getFilteredMessages(messages),
        unreadCount: 0,
        unreadNotificationCount: 0,
        unreadNotificationText: ''
      });

      wx.showToast({
        title: '已全部标为已读',
        icon: 'none'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    } finally {
      this.setData({ markingAllRead: false });
    }
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({
        delta: 1,
        animationType: 'slide-out-right',
        animationDuration: 200
      });
      return;
    }

    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  goNav(event) {
    goNavTarget(event.currentTarget.dataset.target);
  }
});
