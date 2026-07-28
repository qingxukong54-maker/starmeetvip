/* 生成 90 条女性测试数据，严格遵循 main.js 中 RAW_MEMBERS 的字段结构。
   输出到 assets/js/female-test-data.js（window.RAW_FEMALE_TEST 数组）。 */
const fs = require('fs');
const path = require('path');

/* ---------- 可复现随机数（mulberry32） ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260728);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pickN = (arr, n) => {
  const a = arr.slice(); const out = [];
  while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]);
  return out;
};

/* ---------- 姓名池 ---------- */
const SURNAMES = '王李张刘陈杨黄赵周吴徐孙朱马胡林郭何高罗郑梁谢宋唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢傅钟姜崔谭廖范汪陆石毛秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文'.split('');
const GIVEN_F = ['婷','雅','琪','璐','欣','怡','悦','萱','涵','彤','琳','静','雯','倩','娜','雪','薇','妍','婧','璇','媛','蓓','蕾','菲','露','萌','曦','玥','熙','诺','馨','晴','岚','舒','蔓','佳','宁','桐','梓','若','诗','曼','珂','珊','沁','然','宸','恩','依','筱','芊','悦','楚','韵','潞','婕','昭','希','颜','淳'];
const EN_NAMES = ['Kelly','Cindy','Nora','Emily','Sarah','Jessica','Olivia','Sophia','Alice','Grace','Lily','Lucy','Ruby','May','Ivy','Amy','Anna','Bella','Chloe','Diana','Eva','Fiona','Helen','Irene','Karen','Linda','Mia','Nina','Rita','Tina','Vera','Wendy','Yoyo','Zoey','Crystal','Cherry','Coco','Daisy','Eileen','Hailey','Janice','Kiki','Lydia','Maggie','Nancy','Phoebe','Serena','Tracy','Vicky','Winnie','Zoe','Queenie','Paula','Stella','Bonnie'];

/* ---------- 城市 / 区 ---------- */
const CITY_DISTRICT = {
  '福州': ['鼓楼区', '台江区', '仓山区', '晋安区', '马尾区', ''],
  '上海': ['浦东新区', '徐汇区', '静安区', '黄浦区', '长宁区', '杨浦区'],
  '杭州': ['西湖区', '滨江区', '上城区', '拱墅区', '余杭区'],
  '成都': ['锦江区', '武侯区', '青羊区', '成华区', '高新区'],
  '广州': ['天河区', '越秀区', '海珠区', '番禺区', '白云区'],
  '南京': ['鼓楼区', '秦淮区', '建邺区', '玄武区', '江宁区'],
  '北京': ['朝阳区', '海淀区', '东城区', '西城区', '丰台区'],
  '深圳': ['福田区', '南山区', '罗湖区', '宝安区', '龙岗区'],
  '武汉': ['武昌区', '江汉区', '洪山区', '汉阳区', '江岸区'],
  '重庆': ['渝中区', '江北区', '南岸区', '九龙坡区', '渝北区'],
  '西安': ['雁塔区', '碑林区', '莲湖区', '未央区', '新城区'],
  '苏州': ['姑苏区', '工业园区', '吴中区', '相城区', '虎丘区'],
  '厦门': ['思明区', '湖里区', '集美区', '海沧区'],
  '长沙': ['岳麓区', '芙蓉区', '天心区', '雨花区', '开福区'],
  '天津': ['和平区', '南开区', '河西区', '滨海新区'],
  '青岛': ['市南区', '市北区', '崂山区', '李沧区'],
  '宁波': ['海曙区', '江北区', '鄞州区', '镇海区'],
  '无锡': ['梁溪区', '滨湖区', '新吴区', '锡山区'],
  '东莞': ['莞城街道', '南城街道', '东城街道', '万江街道'],
  '佛山': ['禅城区', '南海区', '顺德区', '三水区'],
  '合肥': ['蜀山区', '包河区', '庐阳区', '瑶海区'],
  '郑州': ['金水区', '二七区', '中原区', '管城回族区'],
  '昆明': ['五华区', '盘龙区', '西山区', '官渡区'],
  '大连': ['中山区', '西岗区', '沙河口区', '甘井子区'],
  '沈阳': ['和平区', '沈河区', '皇姑区', '铁西区'],
  '济南': ['历下区', '市中区', '槐荫区', '历城区'],
  '常州': ['天宁区', '钟楼区', '新北区', '武进区'],
  '南通': ['崇川区', '港闸区', '通州区'],
  '泉州': ['鲤城区', '丰泽区', '洛江区', '晋江市'],
  '温州': ['鹿城区', '龙湾区', '瓯海区', '瑞安市'],
  '嘉兴': ['南湖区', '秀洲区', '海宁市', '桐乡市'],
  '珠海': ['香洲区', '斗门区', '金湾区'],
  '三亚': ['海棠区', '吉阳区', '天涯区', '崖州区'],
  '纽约': [''], '洛杉矶': [''], '旧金山': [''], '新泽西州': [''], '加利福尼亚州': [''],
  '华盛顿州': [''], '德克萨斯州': [''], '伊利诺伊州': [''], '多伦多': [''], '温哥华': [''],
  '伦敦': [''], '悉尼': [''], '墨尔本': [''], '新加坡': [''], '东京': [''], '首尔': ['']
};
const CITIES = Object.keys(CITY_DISTRICT);

/* ---------- 其他属性池 ---------- */
const ZODIAC = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const JOBS = ['教师', '护士', '设计师', '会计', 'HR', '行政专员', '市场专员', '编辑', '记者', '律师', '医生', '药剂师', '银行职员', '公务员', '翻译', '平面设计', '产品经理', '运营', '培训师', '美容师', '瑜伽教练', '咖啡师', '花艺师', '幼师', '心理咨询师', '营养师', '主播', '电商运营', '文案策划', '采购', '客服主管', '财务', '审计', '销售', '市场总监', '品牌策划', '插画师', '摄影师', '烘焙师', '茶艺师', '图书管理员', '导游', '空乘', '软件测试', '前端开发', '数据分析师', '大学讲师', '研究员', '公关', '服装设计师', '室内设计', '宠物医生', '健身教练'];
const INCOME = ['0.3万', '10万', '10-20万', '20万', '20-30万', '30万', '30万以上'];
const EDU = ['高中', '大专', '本科', '硕士', '博士'];
const HOUSING = ['无', '租房', '有(无贷款)', '有(有贷款)'];
const CAR = ['无', '有', '有(无贷款)'];
const BLOOD = ['A型', 'B型', 'O型', 'AB型'];
const INTERESTS = ['旅行', '美食', '电影', '音乐', '阅读', '瑜伽', '健身', '摄影', '绘画', '插画', '咖啡', '露营', '宠物', '动漫', '话剧', '红酒', '园艺', '烘焙', '跳舞', '滑雪', '游泳', '爬山', '书法', '茶艺', '手工', '养花', '看展', '听歌', '追剧', '跑步', '网球', '羽毛球', '烹饪', '志愿者', '写作', '吉他', '养猫', '养狗', '钢琴', '陶艺', '香薰', '冥想'];
const INTROS = [
  '温柔爱笑，喜欢把生活过得有仪式感。期待一个能一起逛菜市场也愿意陪我看星星的人。',
  '独立但不强势，有自己的小世界。希望遇到三观契合、能聊到一块儿的你。',
  '工作认真，生活随性。周末爱窝在家看书做饭，也乐意为了喜欢的人出门看世界。',
  '爱旅行爱拍照，走过不少地方却还没遇到想一起走下去的人。真诚交友，非诚勿扰。',
  '乐观开朗，朋友都说我像小太阳。想找一个情绪稳定、会疼人的另一半。',
  '安静的外表下藏着有趣的灵魂，喜欢深度交流胜过寒暄。期待同频的你。',
  '热爱生活的一枚吃货，擅长发现城市里的小确幸。希望你也懂得珍惜当下。',
  '理性与感性兼具，既能聊工作也能聊诗和远方。愿遇见彼此欣赏的我们。',
  '慢热型选手，熟了之后话很多。想要一段细水长流、互相托底的关系。',
  '健身与阅读是我日常的两大支柱，相信身体和灵魂都要在路上。期待自律又可爱的你。'
];
const PURPOSE = ['真诚交友', '寻找结婚对象', '谈场恋爱', '认识新朋友'];
const EXPECT_OTHER = ['真诚', '三观合', '有责任心', '情绪稳定', '上进', '聊得来', '孝顺', '顾家', '无不良嗜好', '同频'];

/* ---------- 生成单条 ---------- */
function pad(n, w) { return String(n).padStart(w, '0'); }

function genOne(id) {
  const useEn = rnd() < 0.12;
  const name = useEn ? pick(EN_NAMES) : (pick(SURNAMES) + pick(GIVEN_F));
  const city = pick(CITIES);
  const district = pick(CITY_DISTRICT[city]);
  const age = 22 + Math.floor(rnd() * 29); // 22-50
  // 生日：由年龄推算（当年 2026 - 年龄）
  const birthYear = 2026 - age;
  const m = 1 + Math.floor(rnd() * 12);
  const d = 1 + Math.floor(rnd() * 28);
  const birth = birthYear + '-' + pad(m, 2) + '-' + pad(d, 2);
  const marriage = rnd() < 0.82 ? '未婚' : '离异';
  const height = 155 + Math.floor(rnd() * 21); // 155-175
  const weight = 45 + Math.floor(rnd() * 21); // 45-65
  const interests = pickN(INTERESTS, 3 + Math.floor(rnd() * 2)).join('、');
  const edu = pick(EDU);
  const income = marriage === '离异' ? pick(['10-20万', '20-30万', '30万', '30万以上']) : pick(INCOME);
  const obj = {
    id: id,
    name: name,
    gender: '女',
    img: 1 + Math.floor(rnd() * 60),
    age: age,
    city: city,
    district: district,
    height: height,
    zodiac: pick(ZODIAC),
    job: pick(JOBS),
    income: income,
    marriage: marriage,
    education: edu,
    housing: pick(HOUSING),
    car: pick(CAR),
    interests: interests,
    intro: pick(INTROS),
    birth: birth,
    blood_type: pick(BLOOD),
    weight: weight,
    uid: pad(id, 5),
    updated: '2026-07-' + pad(10 + Math.floor(rnd() * 18), 2),
    // 无真人照片：留空，渲染时自动回退 SVG 首字头像
    expect_gender: rnd() < 0.85 ? '男' : '不限',
    expect_age: pick(['25-40岁', '28-45岁', '同龄', '大5岁内', '30-50岁', '不限']),
    expect_height: pick(['170-185cm', '172-188cm', '175-190cm', '不限']),
    expect_education: pick(['本科', '大专', '不限', '硕士']),
    expect_marriage: marriage === '离异' ? pick(['不限', '离异不介意', '未婚']) : pick(['未婚', '不限', '离异不介意']),
    expect_income: pick(['20万', '30万', '50万', '不限', '40万']),
    expect_marry_time: pick(['1年内', '1-3年', '3年内', '随时', '看缘分']),
    purpose: pick(PURPOSE),
    expect_other: pickN(EXPECT_OTHER, 2).join('、')
  };
  // 约 35% 带微信号（其余留空，详情页显示"联系客服领取"）
  if (rnd() < 0.35) obj.wechat = 'sm_' + pad(1000 + Math.floor(rnd() * 8999), 4);
  return obj;
}

/* ---------- 输出：单行 JS 对象，严格对齐 RAW_MEMBERS 风格 ---------- */
const START_ID = 100;
const COUNT = 90;
const entries = [];
for (let i = 0; i < COUNT; i++) entries.push(genOne(START_ID + i));

const keys = ['id', 'name', 'gender', 'img', 'age', 'city', 'district', 'height', 'zodiac', 'job', 'income', 'marriage', 'education', 'housing', 'car', 'interests', 'intro', 'birth', 'blood_type', 'weight', 'wechat', 'uid', 'updated', 'photo', 'expect_gender', 'expect_age', 'expect_height', 'expect_education', 'expect_marriage', 'expect_income', 'expect_marry_time', 'purpose', 'expect_other'];
function toLine(o) {
  const parts = keys.map(k => {
    let v = o[k];
    if (v === undefined) return null;
    if (typeof v === 'string') return k + ":'" + v.replace(/'/g, '') + "'";
    return k + ':' + v;
  }).filter(Boolean);
  return '    { ' + parts.join(', ') + ' }';
}

const lines = [];
lines.push('/* 自动生成：90 条女性测试数据（结构同 main.js RAW_MEMBERS）');
lines.push('   生成脚本：tools/gen_females.js  |  便于批量测试"找缘分/猜你喜欢/筛选"等。');
lines.push('   用法：把本数组内容合并进 main.js 的 RAW_MEMBERS，或 window.RAW_FEMALE_TEST 单独引用。 */');
lines.push('window.RAW_FEMALE_TEST = [');
entries.forEach((o, i) => lines.push(toLine(o) + (i < COUNT - 1 ? ',' : '')));
lines.push('];');

const outPath = path.join(__dirname, '..', 'assets', 'js', 'female-test-data.js');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('已生成 ' + COUNT + ' 条女性测试数据 -> ' + outPath);
console.log('样例(首条):', JSON.stringify(entries[0]));

/* 简单统计校验 */
const byCity = {}, byMarriage = {};
entries.forEach(o => { byCity[o.city] = (byCity[o.city] || 0) + 1; byMarriage[o.marriage] = (byMarriage[o.marriage] || 0) + 1; });
console.log('城市分布:', JSON.stringify(byCity));
console.log('婚况分布:', JSON.stringify(byMarriage));
