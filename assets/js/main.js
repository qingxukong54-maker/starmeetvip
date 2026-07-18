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
    serviceWechat: 'StarMeet_KF',
    // 客服昵称
    serviceName: 'StarMeet 客服小助手',
    // 客服二维码图片地址（请替换为您真实的客服微信二维码）
    serviceQr: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=StarMeet%E5%AE%A2%E6%9C%8D%E5%BE%AE%E4%BF%A1'
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
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
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
  /* 启动时用本地图替换所有外网头像/封面，避免国内被墙导致图片全丢 */
  function initImages() {
    document.querySelectorAll('img[onerror^="avatarFallback"]').forEach(function (img) {
      const m = /avatarFallback\(this,\s*'([^']+)'\)/.exec(img.getAttribute('onerror') || '');
      const name = m ? m[1] : (img.getAttribute('alt') || '?');
      img.onerror = null;
      img.src = avatarURI(name);
    });
    document.querySelectorAll('.act-card > img').forEach(function (img, idx) {
      img.onerror = null;
      img.src = coverURI(idx);
    });
  }

  /* ---------- 会员数据（数据驱动，?id=编号） ---------- */
  const RAW_MEMBERS = [
    { id:1,  name:'林晓薇', gender:'女', img:47, age:28, city:'上海', district:'静安区', height:168, zodiac:'天蝎座', job:'外企市场', income:'20-30万', marriage:'未婚', education:'本科', housing:'有(无贷款)', car:'无', interests:'旅行、烘焙、看展、瑜伽、宠物', intro:'海归市场人，喜欢有规划、情绪稳定的人。工作之余爱旅行和烘焙，希望找一个能一起逛展、一起下厨的伴侣。真诚交友，非诚勿扰～' },
    { id:2,  name:'苏曼妮', gender:'女', img:45, age:29, city:'上海', district:'浦东新区', height:170, zodiac:'双子座', job:'留学顾问', income:'30万以上', marriage:'未婚', education:'硕士', housing:'有(无贷款)', car:'有', interests:'旅行、红酒、话剧、宠物', intro:'海归留学顾问，阅人无数但依然相信爱情。喜欢有品位的约会，也享受独处的安静。' },
    { id:3,  name:'陈嘉怡', gender:'女', img:44, age:26, city:'杭州', district:'西湖区', height:165, zodiac:'处女座', job:'UI设计师', income:'10-20万', marriage:'未婚', education:'大专', housing:'租房', car:'无', interests:'插画、看展、咖啡、露营', intro:'文艺系UI设计师，周末爱逛展和露营。期待一个能一起发现生活小美好的你。' },
    { id:4,  name:'李梦琪', gender:'女', img:20, age:29, city:'成都', district:'锦江区', height:163, zodiac:'巨蟹座', job:'护士', income:'10-20万', marriage:'未婚', education:'本科', housing:'租房', car:'无', interests:'美食、追剧、瑜伽', intro:'成都小护士，温柔顾家。希望找一个踏实靠谱、会疼人的另一半。' },
    { id:5,  name:'周雅婷', gender:'女', img:41, age:31, city:'广州', district:'天河区', height:166, zodiac:'摩羯座', job:'高中教师', income:'20-30万', marriage:'未婚', education:'本科', housing:'有(无贷款)', car:'无', interests:'读书、园艺、旅行', intro:'人民教师，理性温和。喜欢有共同话题、能一起成长的人。' },
    { id:6,  name:'白思琪', gender:'女', img:32, age:26, city:'杭州', district:'滨江区', height:167, zodiac:'水瓶座', job:'自由插画师', income:'10-20万', marriage:'未婚', education:'本科', housing:'租房', car:'无', interests:'绘画、动漫、猫、旅行', intro:'自由插画师，养猫一只。喜欢安静也喜欢远方，想找个能读懂我画的人。' },
    { id:7,  name:'赵欣怡', gender:'女', img:49, age:25, city:'深圳', district:'南山区', height:160, zodiac:'狮子座', job:'新媒体运营', income:'10-20万', marriage:'未婚', education:'本科', housing:'租房', car:'无', interests:'短视频、穿搭、美食', intro:'深圳新媒体女孩，热爱生活热爱分享。期待一个有趣灵魂来双向奔赴。' },
    { id:8,  name:'孙雨桐', gender:'女', img:33, age:27, city:'南京', district:'鼓楼区', height:164, zodiac:'双鱼座', job:'银行职员', income:'20-30万', marriage:'未婚', education:'硕士', housing:'有(无贷款)', car:'无', interests:'旅行、健身、电影', intro:'银行白领，自律爱运动。希望对方也热爱生活、积极向上。' },
    { id:9,  name:'王梓涵', gender:'男', img:15, age:32, city:'北京', district:'朝阳区', height:172, zodiac:'射手座', job:'企业主管', income:'30万以上', marriage:'未婚', education:'硕士', housing:'有(有贷款)', car:'有', interests:'高尔夫、旅行、投资', intro:'互联网企业中层，理性务实。希望找一个独立、聊得来的伴侣。' },
    { id:10, name:'顾辰',   gender:'男', img:12, age:30, city:'北京', district:'海淀区', height:178, zodiac:'天秤座', job:'软件工程师', income:'30万以上', marriage:'未婚', education:'本科', housing:'有(无贷款)', car:'有', interests:'编程、登山、摄影', intro:'程序员但不宅，周末爱登山拍照。想找个能一起看世界的人。' },
    { id:11, name:'张沐阳', gender:'男', img:13, age:33, city:'深圳', district:'福田区', height:180, zodiac:'金牛座', job:'投资人', income:'30万以上', marriage:'未婚', education:'硕士', housing:'有(无贷款)', car:'有', interests:'金融、滑雪、红酒', intro:'投资人，看人很准。希望遇到一个真诚、有自己热爱的人。' },
    { id:12, name:'刘宇航', gender:'男', img:14, age:31, city:'上海', district:'徐汇区', height:175, zodiac:'双子座', job:'医生', income:'30万以上', marriage:'未婚', education:'博士', housing:'有(无贷款)', car:'有', interests:'医学研究、跑步、阅读', intro:'外科医生，忙但靠谱。期待一个理解我的节奏、温柔以待的人。' },
    { id:13, name:'陈一鸣', gender:'男', img:3,  age:30, city:'北京', district:'东城区', height:176, zodiac:'狮子座', job:'律师', income:'30万以上' },
    { id:14, name:'赵思琪', gender:'女', img:4,  age:27, city:'上海', district:'黄浦区', height:165, zodiac:'天秤座', job:'设计师', income:'20-30万' },
    { id:15, name:'孙浩',   gender:'男', img:5,  age:29, city:'广州', district:'越秀区', height:178, zodiac:'白羊座', job:'创业者', income:'30万以上' },
    { id:16, name:'周雨彤', gender:'女', img:6,  age:28, city:'深圳', district:'宝安区', height:168, zodiac:'双鱼座', job:'主持人', income:'20-30万' },
    { id:17, name:'吴磊',   gender:'男', img:7,  age:31, city:'杭州', district:'上城区', height:180, zodiac:'处女座', job:'建筑师', income:'30万以上' },
    { id:18, name:'黄子轩', gender:'男', img:8,  age:28, city:'成都', district:'武侯区', height:177, zodiac:'天蝎座', job:'产品经理', income:'20-30万' },
    { id:19, name:'徐若晗', gender:'女', img:9,  age:26, city:'南京', district:'建邺区', height:162, zodiac:'巨蟹座', job:'翻译', income:'10-20万' },
    { id:20, name:'马俊',   gender:'男', img:10, age:32, city:'武汉', district:'洪山区', height:179, zodiac:'摩羯座', job:'销售总监', income:'30万以上' },
    { id:21, name:'朱琳',   gender:'女', img:11, age:29, city:'苏州', district:'工业园区', height:166, zodiac:'双子座', job:'人力资源', income:'20-30万' },
    { id:22, name:'何雨泽', gender:'男', img:16, age:30, city:'重庆', district:'渝中区', height:175, zodiac:'射手座', job:'摄影师', income:'20-30万' },
    { id:23, name:'高欣怡', gender:'女', img:17, age:27, city:'西安', district:'雁塔区', height:163, zodiac:'水瓶座', job:'医生', income:'20-30万' },
    { id:24, name:'罗晨',   gender:'男', img:18, age:33, city:'天津', district:'和平区', height:178, zodiac:'金牛座', job:'工程师', income:'30万以上' },
    { id:25, name:'郑爽',   gender:'女', img:19, age:25, city:'长沙', district:'岳麓区', height:160, zodiac:'狮子座', job:'模特', income:'10-20万' },
    { id:26, name:'梁博',   gender:'男', img:21, age:31, city:'青岛', district:'市南区', height:181, zodiac:'天秤座', job:'金融分析师', income:'30万以上' },
    { id:27, name:'谢霆',   gender:'男', img:22, age:29, city:'厦门', district:'思明区', height:177, zodiac:'双子座', job:'金融分析师', income:'30万以上' },
    { id:28, name:'唐艺',   gender:'女', img:23, age:28, city:'合肥', district:'蜀山区', height:164, zodiac:'天蝎座', job:'钢琴老师', income:'20-30万' },
    { id:29, name:'韩雪',   gender:'女', img:24, age:26, city:'郑州', district:'金水区', height:161, zodiac:'处女座', job:'编辑', income:'10-20万' },
    { id:30, name:'冯宇',   gender:'男', img:25, age:32, city:'大连', district:'中山区', height:179, zodiac:'摩羯座', job:'海员', income:'20-30万' },
    { id:31, name:'董洁',   gender:'女', img:26, age:30, city:'昆明', district:'五华区', height:165, zodiac:'双鱼座', job:'花艺师', income:'20-30万' }
  ];

  function buildMember(r) {
    const interests = r.interests || '旅行、美食、电影、运动';
    return {
      id: String(r.id),
      name: r.name,
      gender: r.gender,
      img: r.img,
      age: r.age,
      city: r.city,
      district: r.district || '',
      height: r.height,
      zodiac: r.zodiac,
      job: r.job,
      income: r.income,
      marriage: r.marriage || '未婚',
      education: r.education || '本科',
      housing: r.housing || '有(无贷款)',
      car: r.car || '无',
      interests: interests,
      intro: r.intro || ('我是' + r.name + '，来自' + r.city + '，从事' + r.job + '。平时喜欢' + interests + '。希望在这里遇到合拍的你，真诚交友，非诚勿扰～'),
      uid: r.uid || ('100' + String(247 + r.id * 13))
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
    { type: 'gradient', bg: 'linear-gradient(135deg,#ff5a6e,#ff8a3d)' },
    { type: 'gradient', bg: 'linear-gradient(135deg,#722ed1,#b37feb)' },
    { type: 'gradient', bg: 'linear-gradient(135deg,#11998e,#38ef7d)' }
  ];

  function buildSlide(b) {
    const slide = document.createElement('div');
    slide.className = 'banner-slide';
    if (b.type === 'image') {
      slide.style.background = '#000';
      const img = document.createElement('img');
      img.src = b.src; img.alt = 'banner'; img.className = 'banner-img';
      slide.appendChild(img);
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
      title: '周末单身派对 · 外滩源', cover: 0,
      time: '07-20 14:00 - 18:00', loc: '上海 · 外滩源美术馆', joined: 128, price: '免费', priceNum: 0, status: '报名中',
      intro: '一场属于单身青年的轻松派对。在外滩源的落地玻璃空间里，用游戏和音乐打破陌生感，认识同频的人。现场提供精酿、甜点与互动小游戏，拒绝尴尬的相亲式对坐，让相遇自然发生。',
      schedule: [
        { t: '14:00', x: '签到 · 自由交流，领取名牌与破冰卡' },
        { t: '14:30', x: '破冰游戏：名字接龙 & 兴趣盲盒' },
        { t: '15:30', x: '主题桌游 / 自由组队聊天' },
        { t: '17:00', x: '心动互选 & 合影留念' }
      ],
      tips: ['请携带本人身份证签到', '活动费用含饮品与小食，不含交通', '现场禁止强迫加微信，尊重彼此边界', '报名后如需取消请提前 24 小时联系客服'],
      participants: [['王','王梓涵'],['顾','顾辰'],['张','张沐阳'],['刘','刘宇航'],['李','李梦琪']]
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
    if (cover) cover.src = coverURI(a.cover || 0);

    const intro = document.getElementById('actIntro');
    if (intro) intro.textContent = a.intro;

    const sch = document.getElementById('actSchedule');
    if (sch) {
      sch.innerHTML = '';
      a.schedule.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = '<span class="t">' + s.t + '</span>' + s.x;
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
        item.href = 'member.html?id=' + (MEMBER_BY_NAME[p[1]] || '');
        item.innerHTML = '<div class="psug-avatar"><img src="' + avatarURI(p[0]) + '" onerror="avatarFallback(this,\'' + p[0] + '\')"></div>' +
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

    // 头像（本地生成，不依赖外网）
    box.onerror = null;
    box.src = avatarURI(m.name);

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
      [m.age + '岁', m.height + 'cm', m.zodiac, m.job, m.income].forEach(function (t) {
        const s = document.createElement('span');
        s.className = 'pdp-tag';
        s.textContent = t;
        tags.appendChild(s);
      });
    }

    // 基本资料网格
    const grid = document.getElementById('pdsGrid');
    if (grid) {
      grid.innerHTML = '';
      const fields = [
        ['性别', m.gender],
        ['年龄', m.age + '岁'],
        ['身高', m.height + 'cm'],
        ['婚姻状况', m.marriage],
        ['学历', m.education],
        ['所在地', m.city],
        ['房产信息', m.housing],
        ['车辆信息', m.car]
      ];
      fields.forEach(function (f) {
        const d = document.createElement('div');
        d.className = 'pds-field';
        d.innerHTML = '<span class="label">' + f[0] + '</span><span class="value">' + f[1] + '</span>';
        grid.appendChild(d);
      });
      const full = document.createElement('div');
      full.className = 'pds-field pds-full';
      full.innerHTML = '<span class="label">兴趣爱好</span><span class="value">' + m.interests + '</span>';
      grid.appendChild(full);
    }

    // 自我介绍
    const intro = document.getElementById('pdpIntro');
    if (intro) intro.textContent = m.intro;

    // 猜你喜欢（其他会员，最多 5 位）
    const sug = document.getElementById('psugList');
    if (sug) {
      sug.innerHTML = '';
      MEMBER_LIST.filter(function (x) { return x.id !== m.id; }).slice(0, 5).forEach(function (o) {
        const a = document.createElement('a');
        a.className = 'psug-item';
        a.href = 'member.html?id=' + o.id;
        const av = document.createElement('div');
        av.className = 'psug-avatar';
        const im = document.createElement('img');
        im.onerror = null;
        im.src = avatarURI(o.name);
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
    initImages();
    initMatchFilter();
    initActivityFilter();
    initDragScroll();
    initServiceModal();
    initActivityDetail();
    initMemberDetail();
  });
})();
