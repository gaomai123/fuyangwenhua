const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const allowedFields = [
  'artist_id',
  'artist_name',
  'contact_name',
  'phone',
  'city',
  'event_time',
  'budget',
  'requirement'
];

function cleanString(value) {
  return String(value || '').trim();
}

function pickBooking(booking) {
  return allowedFields.reduce((data, field) => {
    if (booking[field] !== undefined) {
      data[field] = booking[field];
    }

    return data;
  }, {});
}

function isArtistBookable(artist) {
  return artist.can_book !== false && !['on_duty', 'paused'].includes(artist.work_status);
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const booking = event.booking || {};
  const data = pickBooking(booking);

  data.artist_id = cleanString(data.artist_id);
  data.artist_name = cleanString(data.artist_name);
  data.contact_name = cleanString(data.contact_name);
  data.phone = cleanString(data.phone);
  data.city = cleanString(data.city);
  data.event_time = cleanString(data.event_time);
  data.budget = cleanString(data.budget);
  data.requirement = cleanString(data.requirement);

  if (!data.artist_id) {
    return {
      success: false,
      message: '缺少艺人信息'
    };
  }

  if (!data.contact_name || !data.phone) {
    return {
      success: false,
      message: '请填写联系人和手机号'
    };
  }

  try {
    const artistResult = await db.collection('artists').doc(data.artist_id).get();
    const artist = artistResult.data;

    if (!artist || artist.status !== 'approved' || !isArtistBookable(artist)) {
      return {
        success: false,
        message: '艺人暂不可预约'
      };
    }

    data.artist_name = data.artist_name || artist.stage_name || '';
    data.customer_openid = wxContext.OPENID;
    data.status = 'pending';
    data.created_at = db.serverDate();
    data.updated_at = db.serverDate();

    const result = await db.collection('bookings').add({
      data
    });

    return {
      success: true,
      data: {
        id: result._id,
        status: data.status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '提交预约失败'
    };
  }
};
