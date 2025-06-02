const testService = {
  requestCount: 0,
  async getTrendingStocks() {
    return { topGainers: [], topLosers: [] };
  },
};

module.exports = testService;
