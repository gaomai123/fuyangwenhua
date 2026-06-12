const { getFestivalCaseDetail: getCloudFestivalCaseDetail, getFestivalCases: getCloudFestivalCases } = require('./cloud');

const cases = [
  {
    id: 'starlight-coast',
    tag: '热',
    title: '星光海岸音乐节',
    location: '厦门 / 环岛路音乐广场',
    desc: '两日户外音乐现场，整合乐队、民谣、DJ 与互动市集，服务城市文旅夜经济场景。',
    detail: '项目围绕海岸线夜游和城市青年客群设计，完成艺人统筹、舞台动线、视觉包装、现场执行与短视频传播内容协同。',
    image: '/images/festival-cover.jpg',
    video_url: ''
  },
  {
    id: 'youth-wave',
    tag: '新',
    title: '潮音青年音乐节',
    location: '广州 / 长隆度假区',
    desc: '聚焦青年文化与品牌互动，打造沉浸式音乐现场和商业合作体验区。',
    detail: '以青年潮流、社交打卡和品牌互动为核心，配置多风格艺人阵容、主题舞台和联名内容，提升现场停留与传播效率。',
    image: '/images/home-entry-festival.jpg',
    video_url: ''
  },
  {
    id: 'city-beat',
    tag: '城',
    title: '城市节拍音乐节',
    location: '成都 / 东郊记忆',
    desc: '城市地标联动，音乐、生活方式与文旅商业共振传播。',
    detail: '围绕城市更新空间和周末消费场景，提供从策划、招商、艺人、舞美到现场运营的一体化执行方案。',
    image: '/images/festival-cover.jpg',
    video_url: ''
  },
  {
    id: 'island-summer',
    tag: '夏',
    title: '海岛夏日音乐节',
    location: '平潭 / 海坛古城外场',
    desc: '围绕海岛旅游旺季打造落日舞台、民谣演出和青年社交内容。',
    detail: '项目结合海岛度假、夜游消费和本地文旅推广，配置落日民谣、电子派对、互动市集和短视频传播节点。',
    image: '/images/home-entry-festival.jpg',
    video_url: ''
  }
];

function getFestivalCase(id) {
  return cases.find((item) => String(item.id) === String(id)) || null;
}

async function getFestivalCases() {
  const result = await getCloudFestivalCases();
  const data = result.data || [];
  return Array.isArray(data) && data.length ? data : cases;
}

async function getFestivalCaseDetail(id) {
  try {
    const result = await getCloudFestivalCaseDetail(id);
    return result.data;
  } catch (error) {
    return getFestivalCase(id);
  }
}

module.exports = {
  cases,
  getFestivalCase,
  getFestivalCaseDetail,
  getFestivalCases
};
