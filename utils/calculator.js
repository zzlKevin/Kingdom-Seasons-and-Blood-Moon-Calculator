// 查询算法层: 输入 (模式, 岛屿, 天数) → 输出结构化结果
// 将来如需上云, 本文件可直接迁移为云函数
const calendar = require('../data/calendar.js');

const SEASON_NAMES = calendar.season_names;
const DAY_TYPE_NAMES = calendar.day_types;

// ---------- 对外接口 ----------

function listModes() {
  return calendar.modes.map(m => ({
    id: m.id,
    name: m.name,
    requiresIsland: !!m.requires_island_selection
  }));
}

function listIslands(modeId) {
  const mode = getMode(modeId);
  if (!mode || !mode.islands) return [];
  return mode.islands.map(i => ({ id: i.id, name: i.name }));
}

// 核心查询: 某天的完整日历信息
function query(modeId, islandId, day) {
  const mode = getMode(modeId);
  if (!mode) throw new Error('未找到该模式');

  const d = Number(day);
  if (!Number.isInteger(d) || d < 1) throw new Error('请输入 ≥ 1 的整数天数');
  if (d > 100000) throw new Error('天数过大, 请输入 ≤ 100000 的数值');

  if (mode.requires_island_selection) {
    const island = (mode.islands || []).find(i => i.id === islandId);
    if (!island) throw new Error('该模式需要先选择所在岛屿');
    return queryCyclic(mode, island, d);
  }
  if (mode.calendar_type === 'cyclic') return queryCyclic(mode, null, d);
  return queryFinite(mode, d);
}

// 迁岛窗口: 下一个冬季最后一个血月 (商路返回 null)
function nextWinterLastBloodMoon(modeId, day) {
  const mode = getMode(modeId);
  if (!mode || mode.requires_island_selection) return null;

  if (mode.calendar_type === 'cyclic') {
    // 挑战岛: 64天循环, 冬季 = 周期第48~63天
    const cycle = mode.cycle_days;
    const winterStart = mode.season_lookup.days[mode.season_lookup.days.length - 1];
    let lastCd = null;
    for (let i = 0; i < mode.blood_moons.length; i++) {
      if (mode.blood_moons[i] >= winterStart) lastCd = mode.blood_moons[i];
    }
    const cd = ((day - 1) % cycle) + 1;
    const diff = lastCd >= cd ? lastCd - cd : cycle - cd + lastCd;
    return { day: day + diff, year: null, cycleDay: lastCd, extrapolated: false };
  }

  // 战役类: 先查已知日历(1~639)
  if (day <= mode.known_range[1]) {
    const list = getWinterTargets(mode);
    for (let i = 0; i < list.length; i++) {
      if (list[i].day >= day) {
        return { day: list[i].day, year: list[i].year, cycleDay: null, extrapolated: false };
      }
    }
  }

  // 超出639天: 按第10年节奏外推
  const ex = mode.extrapolation;
  const cycle = ex.cycle_days;
  const winterStart = ex.season_offsets[ex.season_offsets.length - 1].offset;
  let lastOff = null;
  for (let i = 0; i < ex.blood_moon_offsets.length; i++) {
    const o = ex.blood_moon_offsets[i];
    if (o >= winterStart && o < cycle) lastOff = o;
  }
  const offset = (day - ex.anchor_day) % cycle;
  const diff = lastOff >= offset ? lastOff - offset : cycle - offset + lastOff;
  const target = day + diff;
  const year = 10 + Math.floor((target - ex.anchor_day) / cycle);
  return { day: target, year, cycleDay: null, extrapolated: true };
}

// ---------- 内部工具 ----------

function getMode(id) {
  return calendar.modes.find(m => m.id === id) || null;
}

// 有序数组中找第一个 >= from 的值
function findNextGE(arr, from) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] >= from) return arr[i];
  }
  return null;
}

// 边界表: 找最后一个 <= target 的下标
function lastBoundaryIndex(daysArr, target) {
  let idx = 0;
  for (let i = 0; i < daysArr.length; i++) {
    if (daysArr[i] <= target) idx = i;
    else break;
  }
  return idx;
}

function setTodayType(r) {
  if (r.isBloodMoonToday) r.todayType = 'blood_moon';
  else if (r.isPeaceDayToday) r.todayType = 'peace_day';
  else if (r.isSeasonChange) r.todayType = 'season_change';
  else r.todayType = 'normal';
  r.todayTypeName = DAY_TYPE_NAMES[r.todayType];
}

// 已知范围内各年冬季的最后一个血月(结果缓存到 mode 对象)
function getWinterTargets(mode) {
  if (mode._winterTargets) return mode._winterTargets;
  const sl = mode.season_lookup;
  const list = [];
  for (let i = 0; i < sl.seasons.length; i++) {
    if (sl.seasons[i] !== 'winter') continue;
    const start = sl.days[i];
    const end = (i + 1 < sl.days.length ? sl.days[i + 1] : mode.known_range[1] + 1) - 1;
    let last = null;
    for (let j = 0; j < mode.blood_moons.length; j++) {
      const b = mode.blood_moons[j];
      if (b > end) break;
      if (b >= start) last = b;
    }
    if (last !== null) list.push({ day: last, year: sl.years[i] });
  }
  mode._winterTargets = list;
  return list;
}

// ---------- 有限日历 + 第10年外推(战役类) ----------
function queryFinite(mode, day) {
  const r = {
    modeId: mode.id,
    modeName: mode.name,
    islandName: null,
    isEternal: false,
    day
  };

  if (day <= mode.known_range[1]) {
    r.isExtrapolated = false;
    const sl = mode.season_lookup;
    const idx = lastBoundaryIndex(sl.days, day);
    r.year = sl.years[idx];
    r.seasonKey = sl.seasons[idx];
    r.dayOfSeason = day - sl.days[idx] + 1;
    const nextB = idx + 1 < sl.days.length ? sl.days[idx + 1] : null;
    r.seasonLength = nextB ? nextB - sl.days[idx] : (mode.known_range[1] - sl.days[idx] + 1);
    r.isSeasonChange = sl.days[idx] === day;
    r.daysToNextSeason = nextB ? nextB - day : null;

    r.isBloodMoonToday = mode.blood_moons.indexOf(day) !== -1;
    const nb = findNextGE(mode.blood_moons, day);
    r.nextBloodMoonDay = nb;
    r.daysUntilBloodMoon = nb === null ? null : nb - day;

    r.isPeaceDayToday = mode.peace_days.indexOf(day) !== -1;
    const np = findNextGE(mode.peace_days, day);
    r.nextPeaceDay = np;
    r.daysUntilPeaceDay = np === null ? null : np - day;
    if (np === null) r.peaceNote = '已知日历内已无平安日(后期年份不再出现)';
  } else {
    r.isExtrapolated = true;
    r.note = '该天数已超出实测日历(第639天), 按第10年节奏外推, 仅供参考';
    const ex = mode.extrapolation;
    const cycle = ex.cycle_days;
    const passed = day - ex.anchor_day;
    const offset = passed % cycle;
    r.year = 10 + Math.floor(passed / cycle);

    let si = 0;
    for (let i = 0; i < ex.season_offsets.length; i++) {
      if (offset >= ex.season_offsets[i].offset) si = i;
      else break;
    }
    r.seasonKey = ex.season_offsets[si].season;
    r.dayOfSeason = offset - ex.season_offsets[si].offset + 1;
    const nextOff = si + 1 < ex.season_offsets.length
      ? ex.season_offsets[si + 1].offset
      : cycle;
    r.seasonLength = nextOff - ex.season_offsets[si].offset;
    r.isSeasonChange = offset === ex.season_offsets[si].offset;
    r.daysToNextSeason = nextOff - offset;

    const bmo = ex.blood_moon_offsets;
    r.isBloodMoonToday = bmo.indexOf(offset) !== -1;
    const nextBmOff = findNextGE(bmo, offset);
    const dUntil = nextBmOff === null ? cycle - offset + bmo[0] : nextBmOff - offset;
    r.daysUntilBloodMoon = dUntil;
    r.nextBloodMoonDay = day + dUntil;

    r.isPeaceDayToday = false;
    r.nextPeaceDay = null;
    r.daysUntilPeaceDay = null;
    r.peaceNote = '外推周期中无平安日';
  }

  r.seasonName = SEASON_NAMES[r.seasonKey];
  setTodayType(r);
  return r;
}

// ---------- 循环日历(挑战岛/商路) ----------
function queryCyclic(mode, island, day) {
  const hasIsland = !!island;
  const cycle = hasIsland ? island.cycle_days : mode.cycle_days;
  const cd = ((day - 1) % cycle) + 1;
  const bm = hasIsland ? island.blood_moons : mode.blood_moons;
  const pd = hasIsland ? island.peace_days : mode.peace_days;

  const r = {
    modeId: mode.id,
    modeName: mode.name,
    islandName: hasIsland ? island.name : null,
    isEternal: hasIsland,
    day,
    cycleDay: cd,
    cycleDays: cycle,
    year: null
  };

  if (hasIsland) {
    r.seasonKey = island.season_lookup.season;
    r.dayOfSeason = cd;
    r.seasonLength = cycle;
    r.isSeasonChange = cd === 1;
    r.daysToNextSeason = null;
  } else {
    const sl = mode.season_lookup;
    const idx = lastBoundaryIndex(sl.days, cd);
    r.seasonKey = sl.seasons[idx];
    r.dayOfSeason = cd - sl.days[idx] + 1;
    const nextB = idx + 1 < sl.days.length ? sl.days[idx + 1] : cycle + 1;
    r.seasonLength = nextB - sl.days[idx];
    r.isSeasonChange = sl.days[idx] === cd;
    r.daysToNextSeason = nextB - cd;
  }

  r.isBloodMoonToday = bm.indexOf(cd) !== -1;
  const nextBmCd = findNextGE(bm, cd);
  const dUntil = nextBmCd === null ? cycle - cd + bm[0] : nextBmCd - cd;
  r.daysUntilBloodMoon = dUntil;
  r.nextBloodMoonDay = day + dUntil;

  r.isPeaceDayToday = pd.indexOf(cd) !== -1;
  const npCd = findNextGE(pd, cd);
  const pUntil = npCd === null ? cycle - cd + pd[0] : npCd - cd;
  r.daysUntilPeaceDay = pUntil;
  r.nextPeaceDay = day + pUntil;

  r.seasonName = hasIsland && island.season_lookup.season === 'summer'
    ? '永恒之夏' : (hasIsland ? '永恒之冬' : SEASON_NAMES[r.seasonKey]);
  setTodayType(r);
  return r;
}

module.exports = { listModes, listIslands, query, nextWinterLastBloodMoon };
