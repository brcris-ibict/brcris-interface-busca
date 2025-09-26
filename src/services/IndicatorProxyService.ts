class IndicatorProxyService {
  private readonly ONE_DAY_MS = 1000 * 60 * 60 * 24;

  private getCacheKey(queries: string[], index: string): string {
    return JSON.stringify({ queries, index });
  }

  private getFromCache(key: string): any | null {
    const cachedStr = localStorage.getItem(key);
    console.log('Getting from cache', key, cachedStr);
    if (!cachedStr) return null;

    try {
      const cached = JSON.parse(cachedStr);
      return cached.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  private saveToCache(key: string, data: any): void {
    const cached = { data, expiry: Date.now() + this.ONE_DAY_MS };
    localStorage.setItem(key, JSON.stringify(cached));
  }

  private cleanupCache(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;

      const cachedStr = localStorage.getItem(key);
      if (!cachedStr) continue;

      try {
        const cached = JSON.parse(cachedStr);
        if (cached.expiry <= Date.now()) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Perform a search with caching
   */
  public async search(queries: string[], index: string): Promise<any> {
    // Promise.resolve().then(() => this.cleanupCache());

    // const key = this.getCacheKey(queries, index);

    // const cachedData = this.getFromCache(key);
    // if (cachedData) {
    //   console.log('Returning cached data');
    //   return cachedData;
    // }

    console.log('Fetching fresh data');
    const body = JSON.stringify({ queries, index });
    const response = await fetch('/api/indicators', {
      method: 'POST',
      body,
    });
    const data = await response.json();

    // this.saveToCache(key, data);
    return data;
  }

  /**
   * Get data directly from cache (returns null if missing/expired)
   */
  public searchFromCacheOnly(queries: string[], index: string): any | null {
    const key = this.getCacheKey(queries, index);
    return this.getFromCache(key);
  }
}

const indicatorProxyService = new IndicatorProxyService();

export default indicatorProxyService;
