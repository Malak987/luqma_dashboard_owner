/**
 * Coordinates scope-bound async requests with abort cancellation, stale-result
 * suppression, and optional in-flight deduplication for retries.
 */
export class ScopedRequestRunner {
  private version = 0;
  private activeController: AbortController | null = null;
  private inFlight: Promise<void> | null = null;

  /** Cancels any active request and invalidates all earlier in-flight responses. */
  cancel(): void {
    this.version += 1;
    this.activeController?.abort();
    this.activeController = null;
    this.inFlight = null;
  }

  /**
   * Runs `task` with a fresh AbortSignal. When `dedupe` is true and a request
   * is already in flight for the current scope, returns the existing promise
   * instead of issuing a duplicate network call.
   */
  run<T>(
    task: (signal: AbortSignal) => Promise<T>,
    handlers: {
      onStart?: () => void;
      onSuccess: (value: T) => void;
      onError: (error: unknown) => void;
    },
    options: { dedupe?: boolean } = {},
  ): Promise<void> {
    if (options.dedupe && this.inFlight) {
      return this.inFlight;
    }

    this.activeController?.abort();
    const controller = new AbortController();
    this.activeController = controller;
    const currentVersion = ++this.version;

    handlers.onStart?.();

    let currentPromise: Promise<void> | null = null;
    currentPromise = (async () => {
      try {
        const result = await task(controller.signal);
        if (controller.signal.aborted || this.version !== currentVersion) {
          return;
        }
        handlers.onSuccess(result);
      } catch (error) {
        if (controller.signal.aborted || this.version !== currentVersion) {
          return;
        }
        handlers.onError(error);
      } finally {
        if (this.activeController === controller) {
          this.activeController = null;
        }
        if (this.inFlight === currentPromise) {
          this.inFlight = null;
        }
      }
    })();

    this.inFlight = currentPromise;
    return currentPromise;
  }
}
