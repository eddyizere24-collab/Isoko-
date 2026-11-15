const MAX_SCROLL_ENTRIES = 40;

export class ScrollPositionStore {
  private positions = new Map<string, number>();

  save(routeKey: string, scrollY: number): void {
    const clean = Math.max(0, Math.round(Number.isFinite(scrollY) ? scrollY : 0));
    if (this.positions.has(routeKey)) {
      this.positions.delete(routeKey);
    }
    this.positions.set(routeKey, clean);
    if (this.positions.size > MAX_SCROLL_ENTRIES) {
      const oldest = this.positions.keys().next().value;
      if (oldest !== undefined) this.positions.delete(oldest);
    }
  }

  get(routeKey: string): number {
    return this.positions.get(routeKey) ?? 0;
  }

  clear(routeKey: string): void {
    this.positions.delete(routeKey);
  }
}
