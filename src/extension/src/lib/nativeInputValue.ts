/**
 * Sets `value` on an input using the prototype setter so React/Vue controlled
 * components observe updates (not only `el.value = …`).
 */
export function setNativeInputValue(el: HTMLInputElement, value: string): void {
  const desc = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );
  if (desc?.set) {
    desc.set.call(el, value);
  } else {
    el.value = value;
  }
}

/**
 * After setting the value, dispatches `input` (prefer `InputEvent`), `change`,
 * and `blur` so SPAs with controlled inputs sync (React/Vue).
 */
export function syncNativeInputAfterValueChange(
  el: HTMLInputElement,
  value: string
): void {
  setNativeInputValue(el, value);
  try {
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertReplacementText",
        data: value,
      })
    );
  } catch {
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}
