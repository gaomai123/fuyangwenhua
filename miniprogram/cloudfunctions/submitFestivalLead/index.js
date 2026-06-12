const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function cleanString(value) {
  return String(value || '').trim();
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const lead = event.lead || {};
  const data = {
    cooperation_type: cleanString(lead.cooperation_type),
    contact_name: cleanString(lead.contact_name),
    phone: cleanString(lead.phone),
    company: cleanString(lead.company),
    city: cleanString(lead.city),
    event_date: cleanString(lead.event_date),
    requirement: cleanString(lead.requirement)
  };

  if (!data.contact_name || !data.phone) {
    return {
      success: false,
      message: '请填写联系人和手机号'
    };
  }

  try {
    data.openid = wxContext.OPENID;
    data.status = 'pending';
    data.created_at = db.serverDate();
    data.updated_at = db.serverDate();

    const result = await db.collection('festival_leads').add({
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
      message: error.message || '提交合作意向失败'
    };
  }
};
