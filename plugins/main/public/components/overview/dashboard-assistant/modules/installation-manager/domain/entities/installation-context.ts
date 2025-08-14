export class InstallationContext {
  private context: Map<string, any> = new Map();

  public set(key: string, value: any): void {
    this.context.set(key, value);
  }

  public get<T>(key: string): T {
    if (!this.context.has(key)) {
      throw new Error(`Key "${key}" not found in installation context`);
    }
    return this.context.get(key);
  }

  public has(key: string): boolean {
    return this.context.has(key);
  }

  public clear(): void {
    this.context.clear();
  }

  public toObject(): Record<string, any> {
    return Object.fromEntries(this.context);
  }
}
