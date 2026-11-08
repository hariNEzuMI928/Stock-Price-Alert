const WATCH_LIST = [
  // 為替
  // { symbol: 'EURJPY=X', target: 170, isUpperTarget: false, type: 'exchange', unit: '円' },
  // { symbol: 'EURJPY=X', target: 175, isUpperTarget: false, type: 'exchange', unit: '円' },
  { symbol: 'EURPLN=X', target: 4.4, isUpperTarget: true, type: 'exchange', unit: '円' },
  
  // 株
  // { symbol: 'TECL', target: 135, isUpperTarget: true, type: 'stock', unit: '$' },
  { symbol: 'INTC', target: 120, isUpperTarget: true, type: 'stock', unit: '$' },
  // { symbol: 'VOO', target: 625, isUpperTarget: true, type: 'stock', unit: '$' },
  // { symbol: 'TECL', target: 135, isUpperTarget: true, type: 'stock', unit: '$' },
  { symbol: 'TSLA', target: 300, isUpperTarget: false, type: 'stock', unit: '$' },
  // { symbol: 'PYPL', target: 55, isUpperTarget: false, type: 'stock', unit: '$' },
  { symbol: 'VUAA.L', target: 143, isUpperTarget: false, type: 'stock', unit: '$' }, // Vanguard S&P 500 UCITS ETF (Acc) LSE USD建て
  
  // 暗号資産
  { symbol: "ETH-USD", target: 3800, isUpperTarget: true, type: "crypto", unit: "USD"},
  // { symbol: "ETH-USD", target: 4000, isUpperTarget: true, type: "crypto", unit: "USD"},

  // Index
  { symbol: "^VIX", target: 30, isUpperTarget: true, type: "index", unit: "" },
];