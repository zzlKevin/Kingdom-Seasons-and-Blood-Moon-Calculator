<div align="center">

# Kingdom: Two Crowns · Seasons & Blood Moon Calculator

**[简体中文](./README.md) | [English](./README.en.md)**

WeChat Mini Program · Enter your current day, get Blood Moons, Peace Days, season changes and island-switching windows

</div>

---

## Introduction

A companion tool for *Kingdom: Two Crowns* players. Enter the day you are on and it will tell you:

- When the next **Blood Moon** hits (defend early!)
- Which days are **Peace Days** (safe to grow your economy)
- **Season change** rhythm (stockpile in winter, expand in spring)
- **Island-switching windows** (Trade Routes challenge: summer/winter island cycles)

The page background syncs with the in-game day/night cycle in real time: 1 in-game day = 4 real minutes. The sun and moon travel along an arc, the sky shifts with the time of day, and seasonal particles fall. Drag the progress bar to preview the sky at any moment of the day. The day number is rendered in a pixel-gothic Roman numeral style, just like the game (`ccclxix`).

## Features

| Feature | Description |
|---|---|
| Blood Moon / Peace Day / Season Change / Normal | Data compiled from in-game research (community findings + game code) |
| 5 modes supported | Campaign, Norse Lands DLC, Dead Lands DLC, Call of Olympus DLC, Challenge Islands (Trade Routes / Skull / Plague / Dire / Lost) |
| Live day/night clock | Synced to the game's 1:4 time ratio, sun & moon on an arc, gradient sky |
| Touch-drag progress bar | Drag the day-progress bar to preview the sky at any time of the day |
| Roman numeral day | Pixel-gothic day display matching the game |
| Next 7 days preview | Plan ahead with the types of the upcoming 7 days |
| Countdown | Real-time countdown to the next Blood Moon and to the next dawn |
| State memory | Restores your last mode and day on relaunch |

## Supported Modes

| Mode | Day range | Rule |
|---|---|---|
| Standard Campaign | Day 1 – 639 | Fixed Blood Moon table, extrapolated beyond day 639 |
| Norse Lands DLC | Day 1 – 639 | Fixed Blood Moon table |
| Dead Lands DLC | Day 1 – 639 | Fixed Blood Moon table |
| Call of Olympus DLC | Day 1 – 639 | Fixed Blood Moon table |
| Challenge · Trade Routes | Unlimited | Cyclic: summer island every 107 days / winter island every 96 days |
| Challenge Islands (Skull/Plague/Dire/Lost) | Unlimited | Cyclic |

## Usage

1. Open the mini program in WeChat (scan the QR code or search)
2. Pick your game mode (DLC / Challenge islands may require picking an island)
3. Enter the current day, or step with +1 / −1
4. The clock card advances the day/night scene in real time; drag the progress bar to scrub back and forth

## Data Rules (Research Notes)

- Blood Moon dates are community research: [Tieba thread (Chinese)](https://tieba.baidu.com/p/11082735902)
- Trade Routes islands are confirmed cyclic: Eternal Summer island runs a 107-day cycle, Eternal Winter island a 96-day cycle, indefinitely
- Campaign modes beyond day 639 are extrapolated using the year-10 rhythm (anchor at day 576, 64 days per year)

## Project Structure

```
├── app.js / app.json / app.wxss   # Mini program entry & global config
├── pages/index/                   # Main page (calculator + day/night scene)
│   ├── index.js                   # Scheduling, clock, touch scrubbing, Roman numerals
│   ├── index.wxml                 # Page structure
│   ├── index.wxss                 # Styles (sky / castle / progress bar / numerals)
│   ├── fonts.wxss                 # Stgotic pixel-gothic font (base64 embedded)
│   └── index.json                 # Page config
├── data/calendar.js               # Blood Moon calendar data v2.1.0 (per-mode tables)
└── utils/calculator.js            # Engine (seasons / blood moon / peace day / islands)
```

## Disclaimer

All data is compiled from community research and the game's code, for reference only. The game itself is the final authority.

## Contact

- Email: 1696853278@qq.com
- Issues and PRs with data corrections are welcome!
