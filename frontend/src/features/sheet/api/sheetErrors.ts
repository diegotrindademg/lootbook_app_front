/** Another device saved the sheet since it was opened (sheet-document.md 3.1, 409). */
export class SheetConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super("The sheet changed on another device.");
    this.name = "SheetConflictError";
  }
}

/** A `set` whose expected value no longer matches what is stored (one-value-write.md 3, 409). */
export class ResourceChangedError extends Error {
  constructor(readonly currentValue: number) {
    super("The value changed on another device.");
    this.name = "ResourceChangedError";
  }
}
