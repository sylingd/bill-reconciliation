export class Idle {
  private last: number = 0;

  constructor() {
    this.last = performance.now();
  }

  shouldIdle() {
    return performance.now() - this.last > 16;
  }

  sleep(): Promise<void> {
    return new Promise(resolve => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          resolve();
          this.last = performance.now();
        });
      } else {
        setTimeout(() => {
          resolve();
          this.last = performance.now();
        }, 1);
      }
    });
  }
}
