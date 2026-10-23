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

// ---- 昼夜天空关键帧(t: 一天内进度0~1) ----
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
// 血月夜: 替换傍晚之后的颜色为血红
const BM_NIGHT = [
  { t: 0.62, top: '#4a2030', bot: '#a03040' },
  { t: 0.70, top: '#2a1020', bot: '#5a1a2a' },
  { t: 0.80, top: '#180a14', bot: '#2e0e1e' },
  { t: 1.00, top: '#12080f', bot: '#220a16' }
];
const BM_SKY_KEYS = SKY_KEYS.filter(k => k.t < 0.60).concat(BM_NIGHT);

// ---- 星星(随机生成一次) ----
const STARS = [];
for (let i = 0; i < 18; i++) {
  STARS.push({
    idx: i,
    l: Math.round(Math.random() * 96),
    tp: Math.round(Math.random() * 58),
    s: 3 + Math.round(Math.random() * 3),
    d: (Math.random() * 3).toFixed(1)
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
    modes: [], modeNames: [], modeIndex: 0,
    islands: [], islandNames: [], islandIndex: 0,
    needIsland: false,
    dayInput: '',
    result: null, target: null, upcoming: [],
    liveDay: null, countdown: '00:00:00',
    skyGradient: 'linear-gradient(180deg, #0d0d22 0%, #191934 100%)',
    sunStyle: 'left:8%;top:66%;opacity:0',
    moonStyle: 'left:8%;top:66%;opacity:0',
    starsOpacity: '0', cloudsOpacity: '0',
    isBloodNight: false,
    dayPhaseName: '—', dayRemaining: '04:00', dayProgressPct: 0,
    stars: STARS,
    error: ''
  },

  onLoad() {
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
    if (!this._timer) this._timer = setInterval(() => this.tick(), 1000);
    this.tick();
  },

  tick() {
    const { modes, modeIndex, islands, islandIndex, needIsland } = this.data;
    const parsed = parseInt(this.data.dayInput, 10);
    if (!Number.isInteger(parsed)) return;
    if (!this._baseDay) { this._baseDay = parsed; this._baseTime = Date.now(); }

    const now = Date.now();
    const liveDay = this._baseDay + Math.floor((now - this._baseTime) / MS_PER_DAY);
    const mode = modes[modeIndex];
    const island = needIsland ? islands[islandIndex] : null;

    // 迁岛窗口实时倒计时
    const t = nextWinterLastBloodMoon(mode.id, liveDay);
    let countdown = '00:00:00';
    if (t) {
      const targetStart = this._baseTime + (t.day - this._baseDay) * MS_PER_DAY;
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

  // ---- 昼夜天空/时钟(每秒) ----
  updateSky(now, liveDay, fresh) {
    const isBM = fresh ? fresh.isBloodMoonToday
      : (this.data.result ? this.data.result.isBloodMoonToday : false);
    const dayStart = this._baseTime + (liveDay - this._baseDay) * MS_PER_DAY;
    const t = Math.min(1, Math.max(0, (now - dayStart) / MS_PER_DAY));

    const [top, bot] = skyAt(isBM ? BM_SKY_KEYS : SKY_KEYS, t);

    // 太阳: 0.03~0.68 沿弧线
    let sunOp = 0, sx = 8, sy = 66;
    if (t >= 0.03 && t <= 0.68) {
      const ps = (t - 0.03) / 0.65;
      sunOp = Math.min(1, Math.min(ps / 0.06, (1 - ps) / 0.06));
      sx = 8 + ps * 84;
      sy = 66 - Math.sin(Math.PI * ps) * 52;
    }
    // 月亮: 0.68~1.06(跨零点)
    let moonOp = 0, mx = 8, my = 66;
    if (t >= 0.68 || t < 0.06) {
      const pt = t >= 0.68 ? (t - 0.68) / 0.38 : (t + 0.32) / 0.38;
      moonOp = Math.min(1, Math.min(pt / 0.06, (1 - pt) / 0.06));
      mx = 8 + pt * 84;
      my = 66 - Math.sin(Math.PI * pt) * 52;
    }
    // 星星亮度
    let nf = 0;
    if (t >= 0.70) nf = Math.min(1, (t - 0.70) / 0.08);
    else if (t < 0.06) nf = Math.max(0, 1 - t / 0.06);
    if (isBM) nf *= 0.45;

    const phaseName = t < 0.08 ? '黎明' : t < 0.55 ? '白天' : t < 0.70 ? '黄昏' : '夜晚';

    this.setData({
      skyGradient: 'linear-gradient(180deg, ' + top + ' 0%, ' + bot + ' 100%)',
      sunStyle: 'left:' + sx.toFixed(1) + '%;top:' + sy.toFixed(1) + '%;opacity:' + Math.max(0, sunOp).toFixed(2),
      moonStyle: 'left:' + mx.toFixed(1) + '%;top:' + my.toFixed(1) + '%;opacity:' + Math.max(0, moonOp).toFixed(2),
      starsOpacity: nf.toFixed(2),
      cloudsOpacity: (Math.max(0, sunOp) * 0.35).toFixed(2),
      isBloodNight: !!(isBM && t >= 0.62),
      dayPhaseName: phaseName,
      dayRemaining: fmtMS(MS_PER_DAY - (now - dayStart)),
      dayProgressPct: Math.floor(t * 100)
    });
  }
});
