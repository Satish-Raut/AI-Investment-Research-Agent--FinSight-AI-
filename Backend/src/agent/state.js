export const graphState = {
  query: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => ""
  },
  ticker: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => ""
  },
  companyName: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => ""
  },
  financials: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => null
  },
  sentiment: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => null
  },
  swot: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => null
  },
  verdict: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => ""
  },
  confidence: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => 0
  },
  targetRange: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => ""
  },
  rationale: {
    value: (x, y) => y !== undefined ? y : x,
    default: () => ""
  },
  progress: {
    value: (x, y) => x.concat(y),
    default: () => []
  }
};
