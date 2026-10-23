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

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmtHMS(ms) {
  ms = Math.max(0, ms);
  const total = Math.floor(ms / 1000);
  return pad(Math.floor(total / 3600)) + ':' + pad(Math.floor((total % 3600) / 60)) + ':' + pad(total % 60);
}

Page({
  data: {
    modes: [], modeNames: [], modeIndex: 0,
    islands: [], islandNames: [], islandIndex: 0,
    needIsland: false,
    dayInput: '',
    result: null, target: null, upcoming: [],
    liveDay: null, countdown: '00:00:00',
    error: ''
  },

  onLoad() {
    const modes = listModes();
    const patch = { modes, modeNames: modes.map(m => m.name) };

    // 恢复上次输入
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
    } catch (e) { /* 忽略存储异常 */ }

    this.setData(patch, () => this.refresh(true));
  },

  // 从后台切回时立即校准一次(基于绝对时间, 自动补偿后台流逝)
  onShow() { if (this._timer) this.tick(); },
  onUnload() { this.stopTimer(); },
  onHide() { /* 系统会暂停定时器, onShow 会校准 */ },

  stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  // ---------- 事件(全部视为用户操作: 重置计时基准) ----------
  onModeChange(e) {
    const modeIndex = Number(e.detail.value);
    const mode = this.data.modes[modeIndex];
    const islands = listIslands(mode.id);
    this.setData({
      modeIndex,
      islands,
      islandNames: islands.map(i => i.name),
      islandIndex: 0,
      needIsland: mode.requiresIsland
    }, () => this.refresh(true));
  },

  onIslandChange(e) {
    this.setData({ islandIndex: Number(e.detail.value) }, () => this.refresh(true));
  },

  onDayInput(e) {
    this.setData({ dayInput: e.detail.value }, () => this.refresh(true));
  },

  onStepDown() { this.stepDay(-1); },
  onStepUp() { this.stepDay(1); },

  stepDay(delta) {
    let day = parseInt(this.data.dayInput, 10) || 0;
    day = Math.max(1, day + delta);
    this.setData({ dayInput: String(day) }, () => this.refresh(true));
  },

  // ---------- 用户操作后: 重置锚点并重算 ----------
  refresh(resetBase) {
    const day = parseInt(this.data.dayInput, 10);
    if (!Number.isInteger(day) || day < 1) {
      this.stopTimer();
      this._baseDay = null;
      this._lastLiveDay = null;
      this.setData({ result: null, target: null, upcoming: [], liveDay: null, countdown: '00:00:00', error: '' });
      return;
    }
    if (resetBase || !this._baseDay) {
      this._baseDay = day;
      this._baseTime = Date.now();
    }
    this._dirty = true;
    if (!this._timer) this._timer = setInterval(() => this.tick(), 1000);
    this.tick();
  },

  // ---------- 每秒: 推进游戏天数 + 刷新倒计时; 跨天时重算全部卡片 ----------
  tick() {
    const { modes, modeIndex, islands, islandIndex, needIsland } = this.data;
    if (!Number.isInteger(parseInt(this.data.dayInput, 10))) return;

    if (!this._baseDay) { this._baseDay = parseInt(this.data.dayInput, 10); this._baseTime = Date.now(); }

    const now = Date.now();
    const liveDay = this._baseDay + Math.floor((now - this._baseTime) / MS_PER_DAY);

    const mode = modes[modeIndex];
    const island = needIsland ? islands[islandIndex] : null;

    // 迁岛窗口实时倒计时(目标日固定, 现实时间流逝 → 剩余时间减少)
    const t = nextWinterLastBloodMoon(mode.id, liveDay);
    let countdown = '00:00:00';
    if (t) {
      // 目标日的"当天开始时刻" = 锚点 + (目标日 - 锚点日) × 4分钟
      const targetStart = this._baseTime + (t.day - this._baseDay) * MS_PER_DAY;
      countdown = fmtHMS(targetStart - now);
    }

    const patch = { countdown };

    // 跨天(每4分钟)或用户刚操作过 → 重算所有卡片
    if (this._dirty || liveDay !== this._lastLiveDay) {
      this._dirty = false;
      this._lastLiveDay = liveDay;
      try {
        const result = query(mode.id, island ? island.id : null, liveDay);
        result.todayHint = TODAY_HINTS[result.todayType] || '';

        const target = t;
        if (target) {
          target.daysUntil = target.day - liveDay;
          target.isTonight = target.daysUntil === 0;
        }

        const upcoming = [];
        for (let i = 1; i <= 7; i++) {
          const u = query(mode.id, island ? island.id : null, liveDay + i);
          upcoming.push({ day: u.day, short: SHORT_NAMES[u.todayType], type: u.todayType });
        }

        patch.result = result;
        patch.target = target;
        patch.upcoming = upcoming;
        patch.liveDay = liveDay;
        patch.error = '';
        // 天数自动+1: 同步回输入框与存储
        if (String(liveDay) !== this.data.dayInput) patch.dayInput = String(liveDay);
        try { wx.setStorageSync('bmc_last', { modeIndex, islandIndex, dayInput: String(liveDay) }); } catch (e) { /* 忽略 */ }
      } catch (err) {
        patch.result = null; patch.target = null; patch.upcoming = [];
        patch.error = err.message || '计算出错';
      }
    }
    this.setData(patch);
  }
});
