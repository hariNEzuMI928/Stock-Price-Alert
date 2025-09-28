const WATCH_LIST = [
  {
    symbol: "USD/JPY",
    target: 140,
    isUpperTarget: false,
    type: "exchange",
    unit: "円",
  },
  {
    symbol: "USD/JPY",
    target: 148,
    isUpperTarget: true,
    type: "exchange",
    unit: "円",
  },
  {
    symbol: "EUR/JPY",
    target: 170,
    isUpperTarget: false,
    type: "exchange",
    unit: "円",
  },
  { symbol: "VOO", target: 600, isUpperTarget: true, type: "stock", unit: "$" },
  {
    symbol: "TECL",
    target: 105,
    isUpperTarget: true,
    type: "stock",
    unit: "$",
  },
  {
    symbol: "TSLA",
    target: 250,
    isUpperTarget: false,
    type: "stock",
    unit: "$",
  },
  {
    symbol: "PYPL",
    target: 55,
    isUpperTarget: false,
    type: "stock",
    unit: "$",
  },
  { symbol: "INTC", target: 40, isUpperTarget: true, type: "stock", unit: "$" },
];

// Google Apps ScriptではCommonJSやES Modulesのimport/exportが直接サポートされていないため、
// グローバルスコープで定義するか、または`appsscript.json`の`dependencies`で管理する必要があります。
// このファイルは`investment_alarm.js`と同じプロジェクトに含めることで、
// `WATCH_LIST`がグローバルに利用可能になることを想定しています。
