import { describe, it, expect } from "vitest";
import { Keyboard } from "./Keyboard";

/** Builds a keydown/keyup-like event carrying a `code`, usable with a plain EventTarget. */
function keyEvent(type: "keydown" | "keyup", code: string): Event {
  const e = new Event(type, { cancelable: true });
  Object.defineProperty(e, "code", { value: code });
  return e;
}

describe("Keyboard", () => {
  it("tracks held keys via keydown/keyup", () => {
    const target = new EventTarget();
    const kb = new Keyboard(target as unknown as Window);

    expect(kb.isDown("ArrowLeft")).toBe(false);
    target.dispatchEvent(keyEvent("keydown", "ArrowLeft"));
    expect(kb.isDown("ArrowLeft")).toBe(true);
    target.dispatchEvent(keyEvent("keyup", "ArrowLeft"));
    expect(kb.isDown("ArrowLeft")).toBe(false);
  });

  it("fires onPress once per fresh keydown, not on auto-repeat", () => {
    const target = new EventTarget();
    const kb = new Keyboard(target as unknown as Window);
    let count = 0;
    kb.onPress("KeyA", () => count++);

    target.dispatchEvent(keyEvent("keydown", "KeyA"));
    target.dispatchEvent(keyEvent("keydown", "KeyA")); // repeat while held
    expect(count).toBe(1);

    target.dispatchEvent(keyEvent("keyup", "KeyA"));
    target.dispatchEvent(keyEvent("keydown", "KeyA")); // pressed again
    expect(count).toBe(2);
  });
});
