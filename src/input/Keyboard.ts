/**
 * Keyboard input via the DOM, replacing LWJGL's `Keyboard`. Tracks which keys are currently held
 * (for continuous controls like steering) and dispatches one-shot `onPress` callbacks on the
 * initial keydown edge (for toggles like switching modes or restarting).
 *
 * Keys are identified by KeyboardEvent.code (e.g. "ArrowLeft", "KeyA").
 */
export class Keyboard {
  private readonly pressed = new Set<string>();
  private readonly pressHandlers = new Map<string, () => void>();

  constructor(target: Window | HTMLElement = window) {
    target.addEventListener("keydown", (e) => {
      const code = (e as KeyboardEvent).code;
      if (!this.pressed.has(code)) {
        this.pressed.add(code);
        const handler = this.pressHandlers.get(code);
        if (handler) {
          handler();
        }
      }
      // Prevent arrow keys from scrolling the page while playing.
      if (code.startsWith("Arrow")) {
        e.preventDefault();
      }
    });
    target.addEventListener("keyup", (e) => {
      this.pressed.delete((e as KeyboardEvent).code);
    });
  }

  /** Whether a key is currently held down. */
  isDown(code: string): boolean {
    return this.pressed.has(code);
  }

  /** Registers a callback fired once on each fresh keydown of `code`. */
  onPress(code: string, callback: () => void): void {
    this.pressHandlers.set(code, callback);
  }
}
