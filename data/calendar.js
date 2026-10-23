// 血月日历数据 v2.1.0
// 数据来源: https://tieba.baidu.com/p/11082735902
// 已确认规则:
//   规则1: 商路两岛为循环制(夏岛107天/冬岛96天一周期, 无限循环)
//   规则2: 战役类超过639天后, 按第10年节奏外推(锚点576, 64天/年)
module.exports = {
  season_names: { spring: "春", summer: "夏", autumn: "秋", winter: "冬" },
  day_types: { blood_moon: "血月", peace_day: "平安日", season_change: "换季", normal: "常规日" },
  modes: [
    {
      id: "campaign_standard",
      name: "标准战役",
      requires_island_selection: false,
      calendar_type: "finite_with_extrapolation",
      known_range: [1, 639],
      season_lookup: {
        type: "boundaries",
        days: [1, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272, 288, 304, 320, 336, 352, 368, 384, 400, 416, 432, 448, 464, 480, 496, 512, 528, 544, 560, 576, 592, 608, 624],
        seasons: ["spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter"],
        years: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10]
      },
      blood_moons: [14, 30, 46, 62, 78, 94, 110, 126, 142, 158, 174, 190, 206, 222, 238, 254, 262, 270, 278, 286, 294, 302, 310, 318, 327, 335, 343, 351, 359, 367, 375, 383, 391, 399, 407, 415, 423, 431, 439, 447, 455, 463, 471, 479, 487, 495, 503, 511, 516, 521, 527, 532, 537, 543, 548, 553, 559, 564, 569, 575, 579, 583, 587, 591, 595, 599, 603, 607, 611, 615, 619, 623, 627, 631, 635, 639],
      peace_days: [15, 31, 47, 63, 79, 95, 111, 127, 143, 159, 175, 191, 207, 223, 239, 255, 263, 271, 279, 287, 295, 303, 311, 319],
      extrapolation: {
        anchor_day: 576,
        cycle_days: 64,
        blood_moon_offsets: [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63],
        season_offsets: [
          { offset: 0, season: "spring" },
          { offset: 16, season: "summer" },
          { offset: 32, season: "autumn" },
          { offset: 48, season: "winter" }
        ]
      }
    },
    {
      id: "dlc_norse_lands",
      name: "北欧之地 DLC",
      requires_island_selection: false,
      calendar_type: "finite_with_extrapolation",
      known_range: [1, 639],
      season_lookup: {
        type: "boundaries",
        days: [1, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272, 288, 304, 320, 336, 352, 368, 384, 400, 416, 432, 448, 464, 480, 496, 512, 528, 544, 560, 576, 592, 608, 624],
        seasons: ["spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter"],
        years: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10]
      },
      blood_moons: [14, 30, 46, 62, 78, 94, 110, 126, 134, 142, 150, 158, 166, 174, 182, 190, 198, 206, 214, 222, 230, 238, 246, 254, 263, 271, 279, 287, 295, 303, 311, 319, 327, 335, 343, 351, 359, 367, 375, 383, 390, 391, 398, 399, 407, 415, 423, 431, 439, 447, 455, 463, 471, 479, 487, 495, 503, 511, 516, 521, 527, 532, 537, 543, 548, 553, 559, 564, 569, 575, 579, 583, 587, 591, 595, 599, 603, 607, 611, 615, 619, 623, 627, 631, 635, 639],
      peace_days: [15, 31, 47, 63, 79, 95, 111, 127, 135, 143, 151, 159, 167, 175, 183, 191, 199, 207, 215, 223, 231, 239, 247, 255],
      extrapolation: {
        anchor_day: 576,
        cycle_days: 64,
        blood_moon_offsets: [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63],
        season_offsets: [
          { offset: 0, season: "spring" },
          { offset: 16, season: "summer" },
          { offset: 32, season: "autumn" },
          { offset: 48, season: "winter" }
        ]
      }
    },
    {
      id: "dlc_dead_lands",
      name: "Dead Lands DLC",
      requires_island_selection: false,
      calendar_type: "finite_with_extrapolation",
      known_range: [1, 639],
      season_lookup: {
        type: "boundaries",
        days: [1, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272, 288, 304, 320, 336, 352, 368, 384, 400, 416, 432, 448, 464, 480, 496, 512, 528, 544, 560, 576, 592, 608, 624],
        seasons: ["spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter"],
        years: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10]
      },
      blood_moons: [14, 30, 46, 62, 70, 78, 86, 94, 102, 110, 118, 126, 134, 142, 150, 158, 166, 174, 182, 190, 199, 207, 215, 223, 231, 239, 247, 255, 263, 271, 279, 287, 295, 303, 311, 319, 327, 335, 343, 351, 359, 367, 375, 383, 391, 399, 407, 415, 423, 431, 439, 447, 455, 463, 471, 479, 487, 495, 503, 511, 516, 521, 527, 532, 537, 543, 548, 553, 559, 564, 569, 575, 579, 583, 587, 591, 595, 599, 603, 607, 611, 615, 619, 623, 627, 631, 635, 639],
      peace_days: [15, 31, 47, 63, 71, 79, 87, 95, 103, 111, 119, 127, 135, 143, 151, 159, 167, 175, 183, 191],
      extrapolation: {
        anchor_day: 576,
        cycle_days: 64,
        blood_moon_offsets: [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63],
        season_offsets: [
          { offset: 0, season: "spring" },
          { offset: 16, season: "summer" },
          { offset: 32, season: "autumn" },
          { offset: 48, season: "winter" }
        ]
      }
    },
    {
      id: "dlc_call_of_olympus",
      name: "奥林匹斯的召唤 DLC",
      requires_island_selection: false,
      calendar_type: "finite_with_extrapolation",
      known_range: [1, 639],
      season_lookup: {
        type: "boundaries",
        days: [1, 16, 38, 54, 64, 80, 102, 118, 128, 144, 166, 182, 192, 208, 230, 246, 256, 272, 294, 310, 320, 336, 358, 374, 384, 400, 422, 438, 448, 464, 486, 502, 512, 528, 550, 566, 576, 592, 614, 630],
        seasons: ["spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter", "spring", "summer", "autumn", "winter"],
        years: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10],
        note: "本模式每季天数不固定(春16/夏22/秋16/冬10), 必须用边界表查询"
      },
      blood_moons: [14, 36, 52, 62, 78, 100, 116, 126, 142, 164, 180, 190, 206, 228, 244, 254, 262, 270, 281, 292, 300, 308, 318, 327, 335, 346, 357, 365, 373, 383, 391, 399, 410, 421, 429, 437, 447, 455, 463, 474, 485, 493, 501, 511, 516, 521, 527, 532, 534, 542, 549, 554, 559, 565, 570, 575, 579, 583, 587, 591, 596, 602, 608, 613, 617, 621, 625, 629, 634, 639],
      peace_days: [15, 37, 53, 63, 79, 101, 117, 127, 143, 165, 181, 191, 207, 229, 245, 255, 263, 271, 282, 293, 301, 309, 319],
      extrapolation: {
        anchor_day: 576,
        cycle_days: 64,
        blood_moon_offsets: [3, 7, 11, 15, 20, 26, 32, 37, 41, 45, 49, 53, 58, 63],
        season_offsets: [
          { offset: 0, season: "spring" },
          { offset: 16, season: "summer" },
          { offset: 38, season: "autumn" },
          { offset: 54, season: "winter" }
        ]
      }
    },
    {
      id: "challenge_trade_routes",
      name: "挑战岛·商路",
      requires_island_selection: true,
      calendar_type: "cyclic",
      islands: [
        {
          id: "eternal_summer",
          name: "永恒夏季岛",
          cycle_days: 107,
          season_lookup: { type: "fixed", season: "summer" },
          blood_moons: [10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106],
          peace_days: [11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107]
        },
        {
          id: "eternal_winter",
          name: "永恒冬季岛",
          cycle_days: 96,
          season_lookup: { type: "fixed", season: "winter" },
          blood_moons: [10, 18, 26, 34, 42, 50, 58, 66, 74, 81, 88, 95],
          peace_days: [11, 19, 27, 35, 43, 51, 59, 67, 75, 82, 89, 96]
        }
      ]
    },
    {
      id: "challenge_islands",
      name: "挑战岛(骷髅/瘟疫/恐怖/失落)",
      requires_island_selection: false,
      calendar_type: "cyclic",
      cycle_days: 64,
      season_lookup: {
        type: "cycle_boundaries",
        days: [1, 16, 32, 48],
        seasons: ["spring", "summer", "autumn", "winter"]
      },
      blood_moons: [6, 14, 22, 30, 38, 46, 54, 62],
      peace_days: [7, 15, 23, 31, 39, 47, 55, 63]
    }
  ]
};
