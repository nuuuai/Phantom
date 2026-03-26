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
