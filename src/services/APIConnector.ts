class APIConnector {
  private cacheTTL = 1000 * 60 * 60 * 24; // 1 day

  // optional. Called when a result has been clicked
  onResultClick() {
    console.log("onResultClicked");
  }

  // optional. Called when an autocomplete result has been clicked
  onAutocompleteResultClick() {}

  private getCacheKey(requestState: any, queryConfig: any) {
    // Only use requestState + queryConfig.index
    return JSON.stringify({ requestState, index: queryConfig.index });
  }

  private getFromCache(key: string) {
    const cachedStr = localStorage.getItem(key);
    if (!cachedStr) return null;

    try {
      const cached = JSON.parse(cachedStr);
      if (cached.expiry > Date.now()) {
        return cached.data;
      } else {
        localStorage.removeItem(key); // expired
        return null;
      }
    } catch {
      return null;
    }
  }

  private saveToCache(key: string, data: any) {
    const cached = { data, expiry: Date.now() + this.cacheTTL };
    localStorage.setItem(key, JSON.stringify(cached));
  }

  private cleanupCache() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const cachedStr = localStorage.getItem(key);
      if (!cachedStr) continue;

      try {
        const cached = JSON.parse(cachedStr);
        if (cached.expiry <= Date.now()) localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    }
  }

  async onSearch(requestState: any, queryConfig: any) {
    // Promise.resolve().then(() => this.cleanupCache());

    // const key = this.getCacheKey(requestState, queryConfig);

    // const cachedData = this.getFromCache(key);
    // if (cachedData) {
    //   console.log('Returning cached data');
    //   return cachedData;
    // }

    console.log("Fetching fresh data");
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestState, queryConfig }),
    });
    const data = await response.json();

    // this.saveToCache(key, data);
    return data;
  }

  async onAutocomplete(requestState: any, queryConfig: any) {
    queryConfig.index = queryConfig.results.index;
    const response = await fetch("/api/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestState, queryConfig }),
    });
    return response.json();
  }
}

export default APIConnector;
