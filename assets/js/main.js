/* ===========================================================
   StarMeet 静态模仿站 — 交互脚本
   =========================================================== */
(function () {
  'use strict';

  /* ===========================================================
     站点配置（按需修改）
     =========================================================== */
  const CONFIG = {
    // 客服微信号（点击即可复制）
    serviceWechat: 'starmeet_vip',
    // 客服昵称
    serviceName: 'StarMeet 客服小助手',
    // 客服二维码图片地址（请替换为您真实的客服微信二维码）
    serviceQr: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=starmeet_vip'
  };

  /* ---------- 全局 App 对象 ---------- */
  window.App = {
    toast(msg) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(this._t);
      this._t = setTimeout(() => t.classList.remove('show'), 1800);
    },

    /* ---------- 客服弹窗 ---------- */
    openService() {
      const modal = document.getElementById('serviceModal');
      if (!modal) return;
      modal.classList.add('show');
    },
    closeService() {
      const modal = document.getElementById('serviceModal');
      if (modal) modal.classList.remove('show');
    },
    copyWechat() {
      const id = CONFIG.serviceWechat;
      const done = () => App.toast('微信号已复制：' + id);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(done).catch(() => fallbackCopy(id, done));
      } else {
        fallbackCopy(id, done);
      }
    },

  };

  /* 复制兜底（非 https / 旧浏览器） */
  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb && cb(); }
    catch (e) { App.toast('复制失败，请手动复制：' + text); }
    document.body.removeChild(ta);
  }

  /* ---------- 本地生成头像 / 封面（不依赖外网图床，国内可正常显示） ---------- */
  function hashHue(str) {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  }
  // 头像：渐变底 + 姓名首字（支持中文）
  function avatarURI(name) {
    const ch = (name || '?').trim().charAt(0) || '?';
    const hue = hashHue(name || '?');
    const c1 = 'hsl(' + hue + ',68%,60%)';
    const c2 = 'hsl(' + ((hue + 38) % 360) + ',72%,50%)';
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + c1 + "'/><stop offset='1' stop-color='" + c2 + "'/></linearGradient></defs>" +
      "<rect width='100' height='100' fill='url(#g)'/>" +
      "<text x='50' y='66' font-size='46' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='600'>" + ch + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  // 封面：渐变 + 装饰圆
  const COVER_PALETTE = [
    ['#ff5a6e', '#ff8a3d'], ['#722ed1', '#b37feb'],
    ['#11998e', '#38ef7d'], ['#4a9dff', '#37c2ff'], ['#f6c453', '#ff9f43']
  ];
  function coverURI(seed) {
    const i = ((parseInt(seed, 10) || 0) % COVER_PALETTE.length + COVER_PALETTE.length) % COVER_PALETTE.length;
    const c = COVER_PALETTE[i];
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 320'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + c[0] + "'/><stop offset='1' stop-color='" + c[1] + "'/></linearGradient></defs>" +
      "<rect width='600' height='320' fill='url(#g)'/>" +
      "<circle cx='470' cy='70' r='120' fill='rgba(255,255,255,0.12)'/>" +
      "<circle cx='120' cy='260' r='90' fill='rgba(255,255,255,0.10)'/></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  // 兜底（保留以防万一）
  window.avatarFallback = function (img, name) {
    img.onerror = null;
    img.src = avatarURI(name);
  };
  function coverFallback(img) { img.onerror = null; img.src = coverURI(0); }
  // 客服二维码兜底（外网 qrserver 在国内常被墙，失败时用本地占位）
  function qrPlaceholder(text) {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'>" +
      "<rect width='240' height='240' rx='12' fill='white'/>" +
      "<rect x='20' y='20' width='200' height='150' rx='8' fill='#fff3f1' stroke='#ffd2c8'/>" +
      "<text x='120' y='90' font-size='16' text-anchor='middle' fill='#ff5a6e' font-family='sans-serif'>微信二维码</text>" +
      "<text x='120' y='122' font-size='20' text-anchor='middle' fill='#333' font-family='sans-serif' font-weight='700'>" + (text || '') + "</text>" +
      "<text x='120' y='214' font-size='12' text-anchor='middle' fill='#999' font-family='sans-serif'>长按/扫码添加客服</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  /* 启动时替换所有外网头像/封面：优先用会员详情页的真人照片（按卡片 onclick 的姓名解析），
     无照片则本地生成 SVG 首字头像，避免国内被墙导致图片全丢 */
  function initImages() {
    document.querySelectorAll('img[onerror^="avatarFallback"]').forEach(function (img) {
      // 优先从所在卡片的 onclick="goMember('姓名')" 取全名（onerror 里往往只有首字）
      var fullName = '';
      var el = img;
      while (el && el !== document.body) {
        var oc = el.getAttribute && el.getAttribute('onclick');
        if (oc) {
          var mm = /goMember\(\s*'([^']+)'\s*\)/.exec(oc);
          if (mm) { fullName = mm[1]; break; }
        }
        el = el.parentElement;
      }
      var fbMatch = /avatarFallback\(this,\s*'([^']+)'\)/.exec(img.getAttribute('onerror') || '');
      var fbName = fbMatch ? fbMatch[1] : (img.getAttribute('alt') || '?');
      var name = fullName || fbName;
      // 该会员是否有真人照片（详情页照片）→ 列表也用同一张，由 CSS object-fit:cover 裁剪缩放
      var mid = MEMBER_BY_NAME[name];
      var mem = mid ? MEMBERS[mid] : null;
      if (mem && mem.photo) {
        img.onerror = function () { this.onerror = null; this.src = avatarURI(name); };
        img.src = mem.photo;
      } else {
        img.onerror = null;
        img.src = avatarURI(name);
      }
    });
    document.querySelectorAll('.act-card > img').forEach(function (img, idx) {
      var custom = img.getAttribute('data-custom');
      img.onerror = null;
      img.src = custom ? custom : coverURI(idx);
    });
  }

  /* ---------- 会员数据（数据驱动，?id=编号） ---------- */
  const RAW_MEMBERS = [
    { id:1,  name:'Kelly', gender:'女', img:47, age:38, city:'福州', district:'', height:163, zodiac:'双鱼座', job:'无业游民', income:'0.3万', marriage:'未婚', education:'高中', housing:'无', car:'无', interests:'聊天', intro:'走别人的路，让别人无路可走', birth:'1986-12-10', blood_type:'AB型', weight:70, wechat:'15980276203', uid:'00001', updated:'2026-07-19', photo:'assets/images/member-00001.jpg', expect_gender:'男', expect_age:'18-65岁', expect_height:'140-180cm', expect_education:'不限', expect_marriage:'不限', expect_income:'40万', expect_marry_time:'随时', purpose:'真诚交友', expect_other:'看眼缘' },
    { id:2,  name:'苏曼妮', gender:'女', img:45, age:29, city:'上海', district:'浦东新区', height:170, zodiac:'双子座', job:'留学顾问', income:'30万以上', marriage:'未婚', education:'硕士', housing:'有(无贷款)', car:'有', interests:'旅行、红酒、话剧、宠物', intro:'海归留学顾问，阅人无数但依然相信爱情。喜欢有品位的约会，也享受独处的安静。', uid:'00002', updated:'2026-07-19', photo:'assets/images/member-00002.jpg' },
    { id:3,  name:'陈嘉怡', gender:'女', img:44, age:26, city:'杭州', district:'西湖区', height:165, zodiac:'处女座', job:'UI设计师', income:'10-20万', marriage:'未婚', education:'大专', housing:'租房', car:'无', interests:'插画、看展、咖啡、露营', intro:'文艺系UI设计师，周末爱逛展和露营。期待一个能一起发现生活小美好的你。', uid:'00003', updated:'2026-07-19', photo:'assets/images/member-00003.jpg' },
    { id:4,  name:'李梦琪', gender:'女', img:20, age:29, city:'成都', district:'锦江区', height:163, zodiac:'巨蟹座', job:'护士', income:'10-20万', marriage:'未婚', education:'本科', housing:'租房', car:'无', interests:'美食、追剧、瑜伽', intro:'成都小护士，温柔顾家。希望找一个踏实靠谱、会疼人的另一半。', uid:'00004', updated:'2026-07-19', photo:'assets/images/member-00004.jpg' },
    { id:5,  name:'周雅婷', gender:'女', img:41, age:31, city:'广州', district:'天河区', height:166, zodiac:'摩羯座', job:'高中教师', income:'20-30万', marriage:'未婚', education:'本科', housing:'有(无贷款)', car:'无', interests:'读书、园艺、旅行', intro:'人民教师，理性温和。喜欢有共同话题、能一起成长的人。', uid:'00005', updated:'2026-07-19', photo:'assets/images/member-00005.jpg' },
    { id:6,  name:'白思琪', gender:'女', img:32, age:26, city:'杭州', district:'滨江区', height:167, zodiac:'水瓶座', job:'自由插画师', income:'10-20万', marriage:'未婚', education:'本科', housing:'租房', car:'无', interests:'绘画、动漫、猫、旅行', intro:'自由插画师，养猫一只。喜欢安静也喜欢远方，想找个能读懂我画的人。', uid:'00006', updated:'2026-07-19', photo:'assets/images/member-00006.jpg' },
    { id:7,  name:'熙', gender:'女', img:49, age:35, city:'福州', district:'', height:158, zodiac:'金牛座', job:'老师', income:'20万', marriage:'未婚', education:'本科', housing:'有(有贷款)', car:'有(无贷款)', interests:'美食 旅行 婚礼', intro:'兢兢业业的教育工作者', birth:'1990-04-13', blood_type:'其他', weight:55, wechat:'Elina熙', uid:'00007', updated:'2026-07-18', photo:'assets/images/member-00007.jpg', expect_gender:'不限', expect_age:'45-55岁', expect_height:'170-180cm', expect_education:'本科', expect_marriage:'未婚', expect_income:'20万', expect_marry_time:'1年内', purpose:'真诚交友', expect_other:'真诚 上进 孝顺' },
    { id:10, name:'孙雨桐', gender:'女', img:33, age:27, city:'南京', district:'鼓楼区', height:164, zodiac:'双鱼座', job:'银行职员', income:'20-30万', marriage:'未婚', education:'硕士', housing:'有(无贷款)', car:'无', interests:'旅行、健身、电影', intro:'银行白领，自律爱运动。希望对方也热爱生活、积极向上。', uid:'00010', updated:'2026-07-19', photo:'assets/images/member-00010.jpg' },
    { id:11, name:'王梓涵', gender:'男', img:15, age:32, city:'纽约', district:'', height:178, zodiac:'天秤座', job:'企业主管', income:'30万以上', marriage:'未婚', education:'本科', housing:'有(无贷款)', car:'有', interests:'健身、阅读、旅游', intro:'企业管理者，稳重有担当。希望遇到一个温柔懂事、三观契合的伴侣。', uid:'00011', updated:'2026-07-19', photo:'assets/images/member-00011.jpg' },
    { id:9,  name:'Cindy', gender:'女', img:15, age:48, city:'福州', district:'', height:167, zodiac:'水瓶座', job:'白领', income:'20-30万', marriage:'未婚', education:'本科', housing:'无', car:'无', interests:'旅行、音乐、看书、健身', intro:'喜静不喜争，心安即富足，精神世界的饱满胜于一切。', birth:'1978-01-24', blood_type:'AB型', weight:55, wechat:'Sindy233797', uid:'00009', updated:'2026-07-18', photo:'assets/images/member-00009.jpg', expect_gender:'男', expect_age:'35-45岁', expect_height:'170-180cm', expect_education:'本科', expect_marriage:'离异', expect_income:'50万', expect_marry_time:'暂不考虑', purpose:'真诚交友', expect_other:'同频' },
    { id:12, name:'顾辰',   gender:'男', img:12, age:30, city:'新泽西州', district:'', height:178, zodiac:'天秤座', job:'软件工程师', income:'30万以上', marriage:'未婚', education:'本科', housing:'有(无贷款)', car:'有', interests:'编程、登山、摄影', intro:'程序员但不宅，周末爱登山拍照。想找个能一起看世界的人。', uid:'00012', updated:'2026-07-19', photo:'assets/images/member-00012.jpg' },
    { id:13, name:'张沐阳', gender:'男', img:13, age:33, city:'加利福尼亚州', district:'', height:180, zodiac:'金牛座', job:'投资人', income:'30万以上', marriage:'未婚', education:'硕士', housing:'有(无贷款)', car:'有', interests:'金融、滑雪、红酒', intro:'投资人，看人很准。希望遇到一个真诚、有自己热爱的人。', uid:'00013', updated:'2026-07-19', photo:'assets/images/member-00013.jpg' },
    { id:14, name:'刘宇航', gender:'男', img:14, age:31, city:'明尼苏达州', district:'', height:175, zodiac:'双子座', job:'医生', income:'30万以上', marriage:'未婚', education:'博士', housing:'有(无贷款)', car:'有', interests:'医学研究、跑步、阅读', intro:'外科医生，忙但靠谱。期待一个理解我的节奏、温柔以待的人。', uid:'00014', updated:'2026-07-19', photo:'assets/images/member-00014.jpg' },
    { id:8,  name:'Yoko',   gender:'女', photo:'assets/images/member-00008.jpg', uid:'00008', updated:'2026-07-19', birth:'1979-10-01', age:46, blood_type:'O型', weight:60, city:'福州', district:'', height:168, zodiac:'天秤座', job:'销售', income:'10万', marriage:'离异', education:'本科', housing:'无', car:'无', wechat:'15959005052', interests:'美食', intro:'一个人', expect_gender:'男', expect_age:'55-65岁', expect_height:'170-180cm', expect_education:'大专', expect_marriage:'不限', expect_income:'190万', expect_marry_time:'1年内', purpose:'寻找结婚对象', expect_other:'一个人' },
    { id:15, name:'陈志远', gender:'男', img:15, age:52, city:'纽约', district:'', height:175, zodiac:'狮子座', job:'企业董事长', income:'30万以上', marriage:'离异', education:'本科', housing:'有(无贷款)', car:'有', interests:'高尔夫、阅读、旅行', intro:'沉稳务实的企业管理者，阅尽千帆更懂生活。希望遇到一位知性温柔的伴侣，一起慢享余生。', uid:'00015', updated:'2026-07-19', photo:'assets/images/member-00015.jpg', expect_gender:'女', expect_age:'40-55岁', expect_height:'160-175cm', expect_education:'本科', expect_marriage:'离异', expect_income:'不限', expect_marry_time:'1年内', purpose:'寻找结婚对象', expect_other:'真诚 温柔' },
    { id:16, name:'林浩然', gender:'男', img:16, age:50, city:'加利福尼亚州', district:'', height:178, zodiac:'天蝎座', job:'投资顾问', income:'30万以上', marriage:'未婚', education:'硕士', housing:'有(无贷款)', car:'有', interests:'金融、滑雪、红酒', intro:'华尔街背景的金融人士，理性而不失温度。期待一个独立、有想法的另一半，携手看世界。', uid:'00016', updated:'2026-07-19', photo:'assets/images/member-00016.jpg', expect_gender:'女', expect_age:'38-52岁', expect_height:'160-178cm', expect_education:'本科', expect_marriage:'不限', expect_income:'不限', expect_marry_time:'1-3年', purpose:'真诚交友', expect_other:'独立 有想法' }
  ];

  function buildMember(r) {
    const interests = r.interests || '旅行、美食、电影、运动';
    return {
      id: String(r.id),
      name: r.name,
      gender: r.gender,
      img: r.img,
      photo: r.photo || '',
      age: r.age,
      city: r.city,
      district: r.district || '',
      height: r.height,
      zodiac: r.zodiac,
      blood_type: r.blood_type || '',
      weight: r.weight || '',
      job: r.job,
      income: r.income,
      marriage: r.marriage || '未婚',
      education: r.education || '本科',
      housing: r.housing || '有(无贷款)',
      car: r.car || '无',
      wechat: r.wechat || '',
      interests: interests,
      intro: r.intro || ('我是' + r.name + '，来自' + r.city + '，从事' + r.job + '。平时喜欢' + interests + '。希望在这里遇到合拍的你，真诚交友，非诚勿扰～'),
      uid: r.uid || (String(r.id).padStart(5, '0')),
      updated: r.updated || '',
      birth: r.birth || '',
      expect_gender: r.expect_gender || '',
      expect_age: r.expect_age || '',
      expect_height: r.expect_height || '',
      expect_education: r.expect_education || '',
      expect_marriage: r.expect_marriage || '',
      expect_income: r.expect_income || '',
      expect_marry_time: r.expect_marry_time || '',
      purpose: r.purpose || '',
      expect_other: r.expect_other || ''
    };
  }

  const MEMBERS = {};
  RAW_MEMBERS.forEach(function (r) { const m = buildMember(r); MEMBERS[m.id] = m; });
  const MEMBER_LIST = Object.keys(MEMBERS).map(function (k) { return MEMBERS[k]; });
  const MEMBER_BY_NAME = {};
  MEMBER_LIST.forEach(function (m) { MEMBER_BY_NAME[m.name] = m.id; });

  /* ---------- 跳转会员详情（兼容传姓名或编号） ---------- */
  window.goMember = function (key) {
    const id = MEMBER_BY_NAME[key] || key;
    location.href = 'member.html?id=' + id;
  };

  /* ---------- 喜欢按钮（主页嘉宾卡片） ---------- */
  window.likeUser = function (btn) {
    const liked = btn.classList.toggle('liked');
    btn.textContent = liked ? '已喜欢' : '喜欢TA';
    App.toast(liked ? '已表达好感 ❤' : '已取消');
  };

  /* ---------- 喜欢按钮（找缘分网格） ---------- */
  window.likeGrid = function (btn) {
    const liked = btn.classList.toggle('liked');
    btn.innerHTML = liked
      ? '<i class="fas fa-heart"></i><span>已喜欢</span>'
      : '<i class="far fa-heart"></i><span>喜欢TA</span>';
    App.toast(liked ? '已表达好感 ❤' : '已取消');
  };

  /* ---------- 喜欢按钮（会员详情页） ---------- */
  window.likeDetail = function (btn) {
    const icon = btn.querySelector('i');
    const label = btn.querySelector('span');
    const liked = btn.classList.toggle('liked');
    icon.className = liked ? 'fas fa-heart' : 'far fa-heart';
    label.textContent = liked ? '已喜欢' : '喜欢Ta';
    App.toast(liked ? '已表达好感 ❤' : '已取消');
  };

  /* ---------- 首页轮播（纯图片占位，无文字） ---------- */
  const DEFAULT_BANNERS = [
    { type: 'image', src: 'assets/images/banner-survey.png', link: 'https://wj.qq.com/s2/27344088/a696/' },
    { type: 'image', src: 'assets/images/banner-cindy.png', link: 'member.html?id=9' },
    { type: 'image', src: 'assets/images/banner-yoko.png', link: 'member.html?id=8' }
  ];

  function buildSlide(b) {
    const slide = document.createElement('div');
    slide.className = 'banner-slide';
    if (b.type === 'image') {
      slide.style.background = '#000';
      const img = document.createElement('img');
      img.src = b.src; img.alt = 'banner'; img.className = 'banner-img';
      slide.appendChild(img);
      if (b.link) {
        slide.style.cursor = 'pointer';
        slide.addEventListener('click', () => { window.location.href = b.link; });
      }
    } else {
      slide.style.background = b.bg || '#ff5a6e';
    }
    return slide;
  }

  function initBanner() {
    const track = document.getElementById('bannerTrack');
    const dotsBox = document.getElementById('bannerDots');
    if (!track) return;

    // 渲染幻灯片（纯图片占位，无文字）
    track.innerHTML = '';
    DEFAULT_BANNERS.forEach(b => track.appendChild(buildSlide(b)));

    // 渲染小圆点
    if (dotsBox) {
      dotsBox.innerHTML = '';
      DEFAULT_BANNERS.forEach((_, i) => {
        const d = document.createElement('span');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        dotsBox.appendChild(d);
      });
    }

    const slides = track.children;
    const dots = dotsBox ? dotsBox.children : [];
    const total = slides.length;
    if (total <= 1) { if (dotsBox) dotsBox.style.display = 'none'; }

    let current = 0;
    let timer = null;
    function startTimer() { if (total > 1) timer = setInterval(go.bind(null, 1), 4000); }
    function go(dir) {
      current = (current + dir + total) % total;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('active', i === current);
    }
    if (dotsBox) {
      for (let i = 0; i < dots.length; i++) {
        dots[i].addEventListener('click', () => {
          current = i;
          track.style.transform = 'translateX(-' + (current * 100) + '%)';
          for (let j = 0; j < dots.length; j++) dots[j].classList.toggle('active', j === current);
          clearInterval(timer); startTimer();
        });
      }
    }
    startTimer();
  }

  /* ---------- 找缘分 列表（数据驱动，真实头像优先，其次更新时间倒序） ---------- */
  function initMatchGrid() {
    const grid = document.getElementById('userGrid');
    if (!grid) return;
    const arr = MEMBER_LIST.slice().sort(function (a, b) {
      const pa = a.photo ? 1 : 0, pb = b.photo ? 1 : 0;
      if (pa !== pb) return pb - pa; // 有真实头像的排前面，SVG 排在后面
      const ta = a.updated || '', tb = b.updated || '';
      if (ta !== tb) return ta < tb ? 1 : -1; // 更新时间倒序（新→旧）
      return 0;
    });
    grid.innerHTML = '';
    arr.forEach(function (m) {
      const card = document.createElement('div');
      card.className = 'grid-card';
      card.setAttribute('data-gender', m.gender);
      card.setAttribute('onclick', "goMember('" + m.name + "')");
      const img = document.createElement('img');
      img.onerror = function () { this.onerror = null; this.src = avatarURI(m.name); };
      img.src = m.photo ? m.photo : avatarURI(m.name);
      card.appendChild(img);
      const info = document.createElement('div');
      info.className = 'info';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = m.name;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = m.age + '岁 · ' + m.city + ' · ' + m.job;
      info.appendChild(name);
      info.appendChild(meta);
      card.appendChild(info);
      grid.appendChild(card);
    });
  }

  /* ---------- 找缘分 筛选 ---------- */
  function initMatchFilter() {
    const bar = document.getElementById('filterBar');
    const grid = document.getElementById('userGrid');
    const activeFilters = document.getElementById('activeFilters');
    if (!bar || !grid) return;

    let curGender = '';

    function apply() {
      let tag = [];
      grid.querySelectorAll('.grid-card').forEach(card => {
        const okG = !curGender || card.dataset.gender === curGender;
        card.style.display = okG ? '' : 'none';
      });
      if (curGender) tag.push(curGender === '女' ? '找女生' : '找男生');
      if (tag.length) {
        activeFilters.style.display = 'block';
        activeFilters.innerHTML = '已筛选：' + tag.join(' · ') + ' <a style="color:var(--primary);margin-left:6px;" onclick="clearMatchFilter()">清除</a>';
      } else {
        activeFilters.style.display = 'none';
      }
    }
    window.clearMatchFilter = function () {
      curGender = '';
      bar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      bar.querySelector('.chip[data-gender=""]').classList.add('active');
      apply();
    };

    bar.querySelectorAll('.chip').forEach(c => {
      c.addEventListener('click', () => {
        if (c.dataset.gender === undefined) return; // 筛选按钮（已有 onclick toast）
        bar.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
        if (curGender === c.dataset.gender) {
          curGender = '';
        } else {
          curGender = c.dataset.gender;
          c.classList.add('active');
        }
        apply();
      });
    });

    // 支持 ?g=女 / ?g=男 快捷预筛
    const params = new URLSearchParams(location.search);
    const g = params.get('g');
    if (g === '女' || g === '男') {
      const chip = bar.querySelector('.chip[data-gender="' + g + '"]');
      if (chip) chip.click();
    }
  }

  /* ---------- 活动页筛选（视觉高亮） ---------- */
  function initActivityFilter() {
    const bar = document.getElementById('actFilterBar');
    if (!bar) return;
    const cards = Array.prototype.slice.call(document.querySelectorAll('#actListBox .act-card'));
    bar.querySelectorAll('.chip').forEach(c => {
      c.addEventListener('click', () => {
        bar.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        const f = c.dataset.filter; // '' = 全部, 'open' = 报名中, 'ended' = 已结束
        cards.forEach(card => {
          const st = card.getAttribute('data-status');
          const show = (f === '' || (f === 'open' && st === '报名中') || (f === 'ended' && st === '已结束'));
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------- 横向区域：鼠标拖拽滚动（仅桌面端，移动端用原生触摸） ---------- */
  function initDragScroll() {
    if (!window.matchMedia || !window.matchMedia('(pointer:fine)').matches) return;
    document.querySelectorAll('.activity-row').forEach(function (row) {
      let down = false, startX = 0, startScroll = 0, moved = false;
      row.addEventListener('pointerdown', function (e) {
        // 点击链接/按钮时不要捕获指针，让 <a> 正常跳转
        const target = e.target;
        if (target.closest('a') || target.closest('button')) return;
        down = true; moved = false;
        startX = e.clientX; startScroll = row.scrollLeft;
        try { row.setPointerCapture(e.pointerId); } catch (_) {}
      });
      row.addEventListener('pointermove', function (e) {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 5) moved = true;
        row.scrollLeft = startScroll - dx;
      });
      const end = function () { down = false; };
      row.addEventListener('pointerup', end);
      row.addEventListener('pointercancel', end);
      // 拖拽后阻止误触卡片跳转
      row.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
    });
  }

  /* ---------- 客服弹窗：填充配置 ---------- */
  function initServiceModal() {
    const nameEl = document.getElementById('serviceNameVal');
    const idEl = document.getElementById('serviceWechatVal');
    const qrEl = document.getElementById('serviceQrImg');
    if (nameEl) nameEl.textContent = CONFIG.serviceName;
    if (idEl) idEl.textContent = CONFIG.serviceWechat;
    if (qrEl) {
      qrEl.onerror = function () { this.onerror = null; this.src = qrPlaceholder(CONFIG.serviceWechat); };
      qrEl.src = CONFIG.serviceQr;
    }
  }

  /* ---------- 活动详情数据 ---------- */
  const ACTIVITIES = {
    '1': {
      title: '创始会员招募 填写问卷 加入华人社交圈 提升圈层', cover: 0, img: 'assets/images/banner-survey.png',
      time: '07.19 - 08.15', loc: '线上活动', joined: 4, price: '免费', priceNum: 0, status: '报名中',
      intro: '诚邀同频的你，共建真诚温暖的交友社区。首批创始会员享真人认证、人工审核、高质量会员匹配特权。我们坚信，只有真诚，才值得认真对待。扫码报名，遇见对的人。',
      schedule: [
        { t: '01', x: '进入腾讯问卷，提交个人资料', link: 'https://wj.qq.com/s2/27344088/a696/', linkText: '点击提交 →' },
        { t: '02', x: '联系官方小助手，核实个人信息' },
        { t: '03', x: '加入官方群聊，接收最新交友资讯' }
      ],
      tips: ['活动全程免费，请通过官方腾讯问卷报名，谨防任何收费诈骗', '报名后请留意官方小助手消息，及时加入群聊接收最新资讯'],
      participants: [['C','Cindy'],['熙','熙'],['K','Kelly'],['Y','Yoko']]
    },
    '2': {
      title: '跨界交友晚宴 · 国贸', cover: 1,
      time: '07-25 19:00 - 22:00', loc: '北京 · 国贸大酒店 3F', joined: 86, price: '¥199', priceNum: 199, status: '报名中',
      intro: '高端私密晚宴，每桌 6-8 人，由主持人引导话题，在精致餐食中深度交流。适合注重生活品质、希望高效认识优质对象的你。着装建议：商务休闲。',
      schedule: [
        { t: '19:00', x: '红毯签到 · 香槟迎宾' },
        { t: '19:30', x: '入席 · 主厨六道式晚宴' },
        { t: '20:30', x: '圆桌主题分享：我的理想关系' },
        { t: '21:30', x: '自由社交 & 互换联系方式' }
      ],
      tips: ['着装：商务休闲及以上', '费用为晚宴全包，含酒水', '为保证体验，男生女生比例均衡，名额有限', '迟到超过 30 分钟将影响入席'],
      participants: [['陈','陈一鸣'],['赵','赵思琪'],['孙','孙浩'],['周','周雨彤'],['吴','吴磊']]
    },
    '3': {
      title: '户外徒步相亲 · 西湖', cover: 2,
      time: '07-30 09:00 - 16:00', loc: '杭州 · 西湖风景区', joined: 203, price: '¥99', priceNum: 99, status: '报名中',
      intro: '用脚步丈量西湖，在山水间放下手机、专注当下。全程约 8 公里，强度适中，沿途设置多个打卡互动点，边走边聊，最自然的相处方式。',
      schedule: [
        { t: '09:00', x: '断桥集合 · 分组热身' },
        { t: '09:30', x: '环湖徒步 · 打卡点互动' },
        { t: '12:00', x: '湖畔野餐（自带或团购）' },
        { t: '14:00', x: '双人任务挑战赛' },
        { t: '16:00', x: '返程 · 心意互投' }
      ],
      tips: ['请穿戴舒适运动鞋与防晒', '建议自备饮用水与少量零食', '如遇大雨活动顺延，另行通知', '中途不可擅自离队，注意安全'],
      participants: [['林','林晓薇'],['黄','黄子轩'],['徐','徐若晗'],['马','马俊'],['朱','朱琳']]
    },
    '4': {
      title: '剧本杀破冰局 · 成都', cover: 3,
      time: '08-02 14:00 - 18:00', loc: '成都 · 太古里沉浸式剧场', joined: 64, price: '¥129', priceNum: 129, status: '报名中',
      intro: '在推理与角色扮演中快速熟悉彼此。本场为欢乐本，无需经验，DM 全程带本。6 人一车，性别均衡，开 laughs 不打脸，适合社恐友好型交友。',
      schedule: [
        { t: '14:00', x: '签到 · 角色分配' },
        { t: '14:30', x: '沉浸本开场 · 第一轮搜证' },
        { t: '16:00', x: '圆桌讨论 · 指认凶手' },
        { t: '17:30', x: '复盘 & 自由加好友' }
      ],
      tips: ['建议提前 10 分钟到场', '费用含剧本、茶水与零食', '请勿剧透，文明游戏', '介意悬疑元素的同学可选其他场次'],
      participants: [['何','何雨泽'],['高','高欣怡'],['罗','罗晨'],['郑','郑爽'],['梁','梁博']]
    },
    '5': {
      title: '海归专场咖啡会 · 深圳', cover: 4,
      time: '08-08 15:00 - 17:30', loc: '深圳 · 福田咖啡美术馆', joined: 47, price: '免费', priceNum: 0, status: '已结束',
      intro: '专为海外归国单身青年打造的轻松咖啡局。在艺术与咖啡香气中，聊聊留学见闻与归国生活。现场提供精品手冲，氛围松弛，适合深度一对一交流。',
      schedule: [
        { t: '15:00', x: '签到 · 手冲品鉴' },
        { t: '15:30', x: '破冰：30 秒自我介绍' },
        { t: '16:00', x: '主题圆桌：归国那些事' },
        { t: '17:00', x: '自由配对聊天' }
      ],
      tips: ['免费活动，名额有限先到先得', '请自带水杯更环保', '现场可自愿消费展览门票', '欢迎带留学好友一同参与'],
      participants: [['谢','谢霆'],['唐','唐艺'],['韩','韩雪'],['冯','冯宇'],['董','董洁']]
    }
  };

  function initActivityDetail() {
    const box = document.getElementById('actTitle');
    if (!box) return; // 非详情页
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || '1';
    const a = ACTIVITIES[id] || ACTIVITIES['1'];
    if (!a) return;

    document.title = a.title + ' - StarMeet';
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.textContent = val; };
    set('actTitle', a.title);
    set('actStatus', a.status);
    set('actTime', a.time);
    set('actLoc', a.loc);
    set('actJoined', a.joined + ' 人已报名');
    set('actPrice', a.price);
    set('actPriceFoot', a.price);
    const cover = document.getElementById('actCover');
    if (cover) cover.src = a.img ? a.img : coverURI(a.cover || 0);

    const intro = document.getElementById('actIntro');
    if (intro) intro.textContent = a.intro;

    const sch = document.getElementById('actSchedule');
    if (sch) {
      sch.innerHTML = '';
      a.schedule.forEach(s => {
        const li = document.createElement('li');
        const tSpan = document.createElement('span');
        tSpan.className = 't';
        tSpan.textContent = s.t;
        li.appendChild(tSpan);
        li.appendChild(document.createTextNode(s.x));
        if (s.link) {
          const linkA = document.createElement('a');
          linkA.href = s.link;
          linkA.target = '_blank';
          linkA.rel = 'noopener';
          linkA.textContent = s.linkText || '点击提交';
          linkA.style.cssText = 'color:#ff5a6e;font-weight:600;margin-left:6px;text-decoration:none;display:inline-block;';
          li.appendChild(linkA);
        }
        sch.appendChild(li);
      });
    }
    const tips = document.getElementById('actTips');
    if (tips) {
      tips.innerHTML = '';
      a.tips.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        tips.appendChild(li);
      });
    }
    const parts = document.getElementById('actParticipants');
    if (parts && a.participants) {
      parts.innerHTML = '';
      a.participants.forEach(p => {
        const item = document.createElement('a');
        item.className = 'psug-item';
        const mid = MEMBER_BY_NAME[p[1]] || '';
        const mem = MEMBERS[mid];
        item.href = mid ? ('member.html?id=' + mid) : 'javascript:void(0)';
        const avatarSrc = (mem && mem.photo) ? mem.photo : avatarURI(p[0]);
        item.innerHTML = '<div class="psug-avatar"><img src="' + avatarSrc + '" onerror="avatarFallback(this,\'' + p[0] + '\')"></div>' +
          '<div class="psug-name">' + p[1] + '</div>';
        parts.appendChild(item);
      });
    }

    // 已结束的活动：底部报名按钮置为不可用
    const joinBtn = document.getElementById('actJoinBtn');
    if (joinBtn) {
      if (a.status === '已结束') {
        joinBtn.innerHTML = '<i class="fas fa-ban"></i> 报名已结束';
        joinBtn.classList.add('disabled');
        joinBtn.onclick = function (e) { e.preventDefault(); App.toast('该活动已结束，敬请关注新活动'); };
      } else {
        joinBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 立即报名';
        joinBtn.classList.remove('disabled');
        joinBtn.onclick = function () { App.openService(); };
      }
    }
  }

  /* ---------- 会员详情（数据驱动，?id=编号） ---------- */
  function initMemberDetail() {
    const box = document.getElementById('pdpAvatar');
    if (!box) return; // 非会员详情页
    const params = new URLSearchParams(location.search);
    const id = params.get('id') || '1';
    const m = MEMBERS[id] || MEMBERS['1'];
    if (!m) return;

    document.title = m.name + ' - StarMeet';

    // 头像：优先使用真人照片，否则本地生成SVG
    box.onerror = null;
    if (m.photo) {
      box.src = m.photo;
      box.onerror = function () { this.src = avatarURI(m.name); };
    } else {
      box.src = avatarURI(m.name);
    }

    // 昵称 + 性别图标
    const nm = document.getElementById('pdpName');
    if (nm) {
      const icon = m.gender === '女' ? 'fa-venus' : 'fa-mars';
      nm.innerHTML = m.name + ' <span class="pdp-gender-icon"><i class="fas ' + icon + '"></i></span>';
    }
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.textContent = val; };
    set('pdpUid', '交友ID:' + m.uid);

    const loc = document.getElementById('pdpLocation');
    if (loc) loc.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + m.city + (m.district ? ' · ' + m.district : '');

    // 标签
    const tags = document.getElementById('pdpTags');
    if (tags) {
      tags.innerHTML = '';
      var tagList = [m.age + '岁', m.height + 'cm', m.zodiac, m.job, m.income];
      if (m.blood_type) tagList.push(m.blood_type);
      if (m.weight) tagList.push(m.weight + 'kg');
      tagList.forEach(function (t) {
        var s = document.createElement('span');
        s.className = 'pdp-tag';
        s.textContent = t;
        tags.appendChild(s);
      });
    }

    // 基本资料网格
    const grid = document.getElementById('pdsGrid');
    if (grid) {
      grid.innerHTML = '';
      var fields = [
        ['性别', m.gender],
        ['年龄', m.age + '岁'],
        ['身高', m.height + 'cm'],
        ['婚姻状况', m.marriage],
        ['学历', m.education],
        ['所在地', m.city],
        ['房产信息', m.housing],
        ['车辆信息', m.car]
      ];
      // 有值的新字段追加
      if (m.birth) fields.push(['出生日期', m.birth]);
      if (m.blood_type) fields.push(['血型', m.blood_type]);
      if (m.weight) fields.push(['体重', m.weight + 'kg']);
      if (m.wechat) fields.push(['微信号', '联系客服领取']);

      fields.forEach(function (f) {
        var d = document.createElement('div');
        d.className = 'pds-field';
        d.innerHTML = '<span class="label">' + f[0] + '</span><span class="value">' + f[1] + '</span>';
        grid.appendChild(d);
      });
      var full = document.createElement('div');
      full.className = 'pds-field pds-full';
      full.innerHTML = '<span class="label">兴趣爱好</span><span class="value">' + m.interests + '</span>';
      grid.appendChild(full);
    }

    // 自我介绍
    const intro = document.getElementById('pdpIntro');
    if (intro) intro.textContent = m.intro;

    // 择偶要求（有数据才显示，填入"择偶要求"Tab；无则隐藏该Tab）
    const hasExpect = m.expect_gender || m.expect_age || m.expect_height ||
      m.expect_education || m.expect_marriage || m.expect_income ||
      m.expect_marry_time || m.purpose || m.expect_other;
    const expectBtn = document.getElementById('tabExpectBtn');
    const expectPanel = document.getElementById('tabExpect');
    if (hasExpect && expectPanel) {
      expectPanel.innerHTML = '';
      const eSec = document.createElement('div');
      eSec.className = 'pdp-section';
      const eTitle = document.createElement('div');
      eTitle.className = 'pds-title';
      eTitle.textContent = '择偶要求';
      eSec.appendChild(eTitle);
      const eGrid = document.createElement('div');
      eGrid.className = 'pds-grid';

      const eFields = [];
      if (m.purpose) eFields.push(['注册目的', m.purpose]);
      if (m.expect_gender) eFields.push(['期望性别', m.expect_gender]);
      if (m.expect_age) eFields.push(['期望年龄', m.expect_age]);
      if (m.expect_height) eFields.push(['期望身高', m.expect_height]);
      if (m.expect_education) eFields.push(['最低学历', m.expect_education]);
      if (m.expect_marriage) eFields.push(['婚况要求', m.expect_marriage]);
      if (m.expect_income) eFields.push(['最低年薪', (String(m.expect_income).indexOf('万') >= 0 ? m.expect_income : m.expect_income + '万')]);
      if (m.expect_marry_time) eFields.push(['期望结婚时间', m.expect_marry_time]);

      eFields.forEach(function (f) {
        const d = document.createElement('div');
        d.className = 'pds-field';
        d.innerHTML = '<span class="label">' + f[0] + '</span><span class="value">' + f[1] + '</span>';
        eGrid.appendChild(d);
      });
      if (m.expect_other) {
        const efFull = document.createElement('div');
        efFull.className = 'pds-field pds-full';
        efFull.innerHTML = '<span class="label">其他要求</span><span class="value">' + m.expect_other + '</span>';
        eGrid.appendChild(efFull);
      }
      eSec.appendChild(eGrid);
      expectPanel.appendChild(eSec);
      if (expectBtn) expectBtn.style.display = '';
    } else {
      if (expectBtn) expectBtn.style.display = 'none';
      if (expectPanel) expectPanel.innerHTML = '';
    }

    // Tab 切换（资料 / 择偶要求）
    const tabs = document.querySelectorAll('#pdpTabs .pdp-tab');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const which = t.getAttribute('data-tab');
        const b = document.getElementById('tabBasic');
        const e = document.getElementById('tabExpect');
        if (b) b.classList.toggle('active', which === 'basic');
        if (e) e.classList.toggle('active', which === 'expect');
      });
    });

    // 猜你喜欢（动态展示最新注册的5名会员，排除当前会员）
    const sug = document.getElementById('psugList');
    if (sug) {
      sug.innerHTML = '';
      MEMBER_LIST.slice().sort(function (a, b) {
        var ta = a.updated || '', tb = b.updated || '';
        return ta < tb ? 1 : -1;
      }).filter(function (o) { return o.id !== m.id; })
        .slice(0, 5)
        .forEach(function (o) {
        const a = document.createElement('a');
        a.className = 'psug-item';
        a.href = 'member.html?id=' + o.id;
        const av = document.createElement('div');
        av.className = 'psug-avatar';
        const im = document.createElement('img');
        im.onerror = function () { this.onerror = null; this.src = avatarURI(o.name); };
        im.src = o.photo ? o.photo : avatarURI(o.name);
        av.appendChild(im);
        const nm2 = document.createElement('div');
        nm2.className = 'psug-name';
        nm2.textContent = o.name;
        a.appendChild(av);
        a.appendChild(nm2);
        sug.appendChild(a);
      });
    }
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initBanner();
    initMatchGrid();
    initImages();
    initMatchFilter();
    initActivityFilter();
    initDragScroll();
    initServiceModal();
    initActivityDetail();
    initMemberDetail();
  });
})();
