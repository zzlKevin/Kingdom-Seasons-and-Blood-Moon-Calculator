// pages/index/index.js
const { listModes, listIslands, query, nextWinterLastBloodMoon } = require('../../utils/calculator.js');

const TODAY_HINTS = {
  blood_moon: '血月之夜, 怪物将大举进攻, 务必做好防御!',
  peace_day: '平安日, 敌人不会进攻, 安心发展经济。',
  season_change: '今日换季, 季节更替。',
  normal: '常规日, 正常发展即可。'
};
const SHORT_NAMES = { blood_moon: '血月', peace_day: '平安', season_change: '换季', normal: '常规' };

// 游戏时间流速: 1游戏日 = 4现实分钟
const MS_PER_DAY = 4 * 60 * 1000;
// 刷新频率(越低越丝滑, 250ms 性能与流畅平衡)
const TICK_MS = 200;

// ---- 日月轨道高度(屏幕高度百分比, 可自行微调) ----
const ARC_TOP = 8;      // 轨道最高点(数字越小越靠顶)
const ARC_BOTTOM = 84;  // 地平线(数字越大越靠下)
const ARC_AMP = ARC_BOTTOM - ARC_TOP;

const SKY_KEYS = [
  { t: 0.00, top: '#1b1b3a', bot: '#3a2a52' },
  { t: 0.06, top: '#3d3a6e', bot: '#c97a5a' },
  { t: 0.14, top: '#5a8fd0', bot: '#ffd9a0' },
  { t: 0.30, top: '#4f9be0', bot: '#a9d3f5' },
  { t: 0.46, top: '#5aa2e8', bot: '#bfe0f8' },
  { t: 0.56, top: '#6f7ac0', bot: '#f2b26a' },
  { t: 0.63, top: '#4a3470', bot: '#e06a4a' },
  { t: 0.70, top: '#232045', bot: '#5a3460' },
  { t: 0.80, top: '#10102a', bot: '#1e1e3e' },
  { t: 1.00, top: '#0d0d22', bot: '#191934' }
];
const BM_NIGHT = [
  { t: 0.62, top: '#4a2030', bot: '#a03040' },
  { t: 0.70, top: '#2a1020', bot: '#5a1a2a' },
  { t: 0.80, top: '#180a14', bot: '#2e0e1e' },
  { t: 1.00, top: '#12080f', bot: '#220a16' }
];
const BM_SKY_KEYS = SKY_KEYS.filter(k => k.t < 0.60).concat(BM_NIGHT);

const STARS = [];
for (let i = 0; i < 18; i++) {
  const l = Math.round(Math.random() * 96);
  const tp = Math.round(Math.random() * 55);
  const s = 3 + Math.round(Math.random() * 3);
  const d = (Math.random() * 3).toFixed(1);
  STARS.push({
    idx: i,
    style: 'left:' + l + '%;top:' + tp + '%;width:' + s + 'rpx;height:' + s + 'rpx;animation-delay:' + d + 's'
  });
}

const PARTICLES = [];
for (let i = 0; i < 14; i++) {
  const l = Math.round(Math.random() * 94);
  const dur = (9 + Math.random() * 6).toFixed(1);
  const delay = (Math.random() * 12).toFixed(1);
  PARTICLES.push({
    idx: i,
    style: 'left:' + l + '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's'
  });
}
const RAIN_PARTICLES = [];
for (let i = 0; i < 10; i++) {
  const l = Math.round(Math.random() * 94);
  const dur = (1.3 + Math.random() * 0.8).toFixed(2);
  const delay = (Math.random() * 5).toFixed(2);
  RAIN_PARTICLES.push({
    idx: i,
    style: 'left:' + l + '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's'
  });
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmtHMS(ms) {
  ms = Math.max(0, ms);
  const total = Math.floor(ms / 1000);
  return pad(Math.floor(total / 3600)) + ':' + pad(Math.floor((total % 3600) / 60)) + ':' + pad(total % 60);
}
function fmtMS(ms) {
  ms = Math.max(0, ms);
  const s = Math.floor(ms / 1000);
  return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
}
function hexLerp(a, b, f) {
  const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
  return '#' + pa.map((v, i) => {
    const c = Math.round(v + (pb[i] - v) * f);
    return ('0' + c.toString(16)).slice(-2);
  }).join('');
}
function skyAt(keys, t) {
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) {
      const f = (t - keys[i].t) / ((keys[i + 1].t - keys[i].t) || 1);
      return [hexLerp(keys[i].top, keys[i + 1].top, f), hexLerp(keys[i].bot, keys[i + 1].bot, f)];
    }
  }
  const last = keys[keys.length - 1];
  return [last.top, last.bot];
}

Page({
  data: {
    dayKnobStyle: 'left:0%',
    statusBarHeight: 20,
    modes: [], modeNames: [], modeIndex: 0,
    islands: [], islandNames: [], islandIndex: 0,
    needIsland: false,
    dayInput: '',
    result: null, target: null, upcoming: [],
    liveDay: null, countdown: '00:00:00',
    skyStyle: 'background: linear-gradient(180deg, #0d0d22 0%, #191934 100%)',
    sunStyle: 'left:6%;top:84%;opacity:0',
    moonStyle: 'left:6%;top:84%;opacity:0',
    moonClass: '',
    riverGlintStyle: 'opacity:0',
    starsStyle: 'opacity:0',
    cloudsStyle: 'opacity:0',
    dayProgressStyle: 'width:0%',
    isBloodNight: false,
    dayPhaseName: '—', dayRemaining: '04:00',
    seasonClass: '',
    stars: STARS, particles: PARTICLES, rainParticles: RAIN_PARTICLES,
    error: ''
  },

  onLoad() {
    // 自定义导航: 取状态栏高度做顶部留白
    try {
      const wi = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.setData({ statusBarHeight: wi.statusBarHeight || 20 });
    } catch (e) { /* 用默认值 */ }

    const modes = listModes();
    const patch = { modes, modeNames: modes.map(m => m.name) };
    try {
      const saved = wx.getStorageSync('bmc_last');
      if (saved) {
        const modeIndex = Math.min(saved.modeIndex || 0, modes.length - 1);
        const mode = modes[modeIndex];
        const islands = listIslands(mode.id);
        patch.modeIndex = modeIndex;
        patch.islands = islands;
        patch.islandNames = islands.map(i => i.name);
        patch.islandIndex = Math.min(saved.islandIndex || 0, Math.max(islands.length - 1, 0));
        patch.needIsland = mode.requiresIsland;
        if (saved.dayInput) patch.dayInput = String(saved.dayInput);
      }
    } catch (e) { /* 忽略 */ }
    this.setData(patch, () => this.refresh(true));
  },

  onShow() { if (this._timer) this.tick(); },
  onUnload() { this.stopTimer(); },

  stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  onModeChange(e) {
    const modeIndex = Number(e.detail.value);
    const mode = this.data.modes[modeIndex];
    const islands = listIslands(mode.id);
    this.setData({
      modeIndex, islands,
      islandNames: islands.map(i => i.name),
      islandIndex: 0, needIsland: mode.requiresIsland
    }, () => this.refresh(true));
  },

  onIslandChange(e) { this.setData({ islandIndex: Number(e.detail.value) }, () => this.refresh(true)); },
  onDayInput(e) { this.setData({ dayInput: e.detail.value }, () => this.refresh(true)); },
  onStepDown() { this.stepDay(-1); },
  onStepUp() { this.stepDay(1); },

  stepDay(delta) {
    let day = parseInt(this.data.dayInput, 10) || 0;
    day = Math.max(1, day + delta);
    this.setData({ dayInput: String(day) }, () => this.refresh(true));
  },

  refresh(resetBase) {
    const day = parseInt(this.data.dayInput, 10);
    if (!Number.isInteger(day) || day < 1) {
      this.stopTimer();
      this._baseDay = null; this._lastLiveDay = null;
      this.setData({ result: null, target: null, upcoming: [], liveDay: null, countdown: '00:00:00', error: '' });
      return;
    }
    if (resetBase || !this._baseDay) { this._baseDay = day; this._baseTime = Date.now(); }
    this._dirty = true;
    if (!this._timer) this._timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  },

  tick() {
    const { modes, modeIndex, islands, islandIndex, needIsland } = this.data;
    const parsed = parseInt(this.data.dayInput, 10);
    if (!Number.isInteger(parsed)) return;
    if (!this._baseDay) { this._baseDay = parsed; this._baseTime = Date.now(); }

    const now = Date.now() + (this._scrubOffset || 0);
    const liveDay = this._baseDay + Math.floor((now - this._baseTime) / MS_PER_DAY);
    const mode = modes[modeIndex];
    const island = needIsland ? islands[islandIndex] : null;

    const t = nextWinterLastBloodMoon(mode.id, liveDay, island ? island.id : null);
    let countdown = '00:00:00';
    if (t) {
      // endOfDay: 商路目标为血月当天结束时刻(= 次日开始)
      const endOffset = t.endOfDay ? 1 : 0;
      const targetStart = this._baseTime + (t.day + endOffset - this._baseDay) * MS_PER_DAY;
      countdown = fmtHMS(targetStart - now);
    }

    const patch = { countdown };
    let freshResult = null;

    if (this._dirty || liveDay !== this._lastLiveDay) {
      this._dirty = false;
      this._lastLiveDay = liveDay;
      try {
        const result = query(mode.id, island ? island.id : null, liveDay);
        result.todayHint = TODAY_HINTS[result.todayType] || '';
        if (t) { t.daysUntil = t.day - liveDay; t.isTonight = t.daysUntil === 0; }
        const upcoming = [];
        for (let i = 1; i <= 7; i++) {
          const u = query(mode.id, island ? island.id : null, liveDay + i);
          upcoming.push({ day: u.day, short: SHORT_NAMES[u.todayType], type: u.todayType });
        }
        freshResult = result;
        patch.result = result; patch.target = t; patch.upcoming = upcoming;
        patch.liveDay = liveDay; patch.error = '';
        patch.seasonClass = result.seasonKey ? ('p-' + result.seasonKey) : '';
        if (String(liveDay) !== this.data.dayInput) patch.dayInput = String(liveDay);
        try { wx.setStorageSync('bmc_last', { modeIndex, islandIndex, dayInput: String(liveDay) }); } catch (e) { /* 忽略 */ }
      } catch (err) {
        patch.result = null; patch.target = null; patch.upcoming = [];
        patch.error = err.message || '计算出错';
      }
    }
    this.setData(patch);
    this.updateSky(now, liveDay, freshResult);
  },

  /* ---- 进度条触摸调节时间 ---- */
  onProgressTouch(e) {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    if (this._progRect) { this._applyScrub(touch.clientX, this._progRect); return; }
    wx.createSelectorQuery().in(this)
      .select('.day-progress')
      .boundingClientRect(rect => {
        if (!rect || !rect.width) return;
        this._progRect = rect;
        this._applyScrub(touch.clientX, rect);
      }).exec();
  },

  onProgressEnd() { this._progRect = null; },

  _applyScrub(clientX, rect) {
    const parsed = parseInt(this.data.dayInput, 10);
    if (!Number.isInteger(parsed) || !this._baseDay) return;
    const f = Math.min(0.999, Math.max(0, (clientX - rect.left) / rect.width));
    const off0 = this._scrubOffset || 0;
    const dayStart = this._baseTime + (this._lastLiveDay - this._baseDay) * MS_PER_DAY;
    const tNow = (Date.now() - dayStart) / MS_PER_DAY + off0 / MS_PER_DAY;
    this._scrubOffset = off0 + (f - tNow) * MS_PER_DAY;
    this.tick();
  },

  updateSky(now, liveDay, fresh) {
    const r = fresh || this.data.result;
    const isBM = r ? r.isBloodMoonToday : false;
    const isPeace = r ? r.isPeaceDayToday : false;
    const dayStart = this._baseTime + (liveDay - this._baseDay) * MS_PER_DAY;
    const t = Math.min(1, Math.max(0, (now - dayStart) / MS_PER_DAY));

    const [top, bot] = skyAt(isBM ? BM_SKY_KEYS : SKY_KEYS, t);

    // 太阳: t 0~0.64 完整弧线, t=0 从地平线下升起
    let sunOp = 0, sx = 6, sy = ARC_BOTTOM;
    if (t <= 0.64) {
      const ps = t / 0.64;
      sunOp = Math.min(1, Math.min(ps / 0.07, (1 - ps) / 0.07));
      sx = 6 + ps * 88;
      sy = ARC_BOTTOM - Math.sin(Math.PI * ps) * ARC_AMP;
    }
    // 月亮: t 0.66~1.00, 归零瞬间正好完全落下
    let moonOp = 0, mx = 6, my = ARC_BOTTOM;
    if (t >= 0.66) {
      const pt = (t - 0.66) / 0.34;
      moonOp = Math.min(1, Math.min(pt / 0.07, (1 - pt) / 0.07));
      mx = 6 + pt * 88;
      my = ARC_BOTTOM - Math.sin(Math.PI * pt) * ARC_AMP;
    }
    let moonClass = '';
    if (t >= 0.62) {
      if (isBM) moonClass = 'blood';
      else if (isPeace) moonClass = 'peace';
    }
    let nf = 0;
    if (t >= 0.70) nf = Math.min(1, (t - 0.70) / 0.08);
    else if (t < 0.06) nf = Math.max(0, 1 - t / 0.06);
    if (isBM) nf *= 0.45;

    const phaseName = t < 0.08 ? '黎明' : t < 0.55 ? '白天' : t < 0.66 ? '黄昏' : '夜晚';

    // 河面倒影光带: 白天跟太阳(金色), 夜晚跟月亮(按月色)
    let riverGlintStyle = 'opacity:0';
    const so = Math.max(0, sunOp), mo = Math.max(0, moonOp);
    if (so > 0.03) {
      riverGlintStyle = 'left:' + sx.toFixed(1) + '%;opacity:' + so.toFixed(2) +
        ';background:linear-gradient(180deg, rgba(255,210,120,.8), rgba(255,210,120,0))';
    } else if (mo > 0.03) {
      const c = moonClass === 'blood' ? 'rgba(255,80,95,.75)'
        : moonClass === 'peace' ? 'rgba(110,185,255,.75)'
        : 'rgba(185,195,255,.6)';
      riverGlintStyle = 'left:' + mx.toFixed(1) + '%;opacity:' + mo.toFixed(2) +
        ';background:linear-gradient(180deg,' + c + ', rgba(0,0,0,0))';
    }

    this.setData({
      dayKnobStyle: 'left:' + (t * 100).toFixed(1) + '%',
      skyStyle: 'background: linear-gradient(180deg, ' + top + ' 0%, ' + bot + ' 100%)',
      sunStyle: 'left:' + sx.toFixed(1) + '%;top:' + sy.toFixed(1) + '%;opacity:' + so.toFixed(2),
      moonStyle: 'left:' + mx.toFixed(1) + '%;top:' + my.toFixed(1) + '%;opacity:' + mo.toFixed(2),
      moonClass,
      riverGlintStyle,
      starsStyle: 'opacity:' + nf.toFixed(2),
      cloudsStyle: 'opacity:' + (so * 0.35).toFixed(2),
      dayProgressStyle: 'width:' + Math.floor(t * 100) + '%',
      isBloodNight: !!(isBM && t >= 0.62),
      dayPhaseName: phaseName,
      dayRemaining: fmtMS(MS_PER_DAY - (now - dayStart))
    });
  }
});
