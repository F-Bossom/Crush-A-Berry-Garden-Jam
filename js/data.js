/*-------------- Constants -------------*/
// Berry types
const berries = ["🫐", "🍇", "🍓", "🍒"];

// Growth stages
const stages = {
  EMPTY: 0,
  GROWING: 1,
  RIPE: 2,
  ROTTEN: 3,
  SPECIAL: 4,
};

// Game settings
const GAME_SETTINGS = {
  rows: 3,
  cols: 4,
  timeLimit: 60,
  jamPerBerry: 10,
  caterpillarPenalty: 5, // 5 seconds lost if clicked
  bunnyBonus: 5, // 5 seconds gained if clicked
};
