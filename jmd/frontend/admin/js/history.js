/* ─── History (undo/redo) for editor ─── */
const History = (() => {
  let stack = [];
  let index = -1;

  function push(html) {
    stack = stack.slice(0, index + 1);
    stack.push(html);
    if (stack.length > 100) stack.shift();
    else index++;
    update();
  }
  function undo() {
    if (index > 0) { index--; update(); return stack[index]; }
    return null;
  }
  function redo() {
    if (index < stack.length - 1) { index++; update(); return stack[index]; }
    return null;
  }
  function current() { return stack[index] || null; }
  function update() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = index <= 0;
    if (redoBtn) redoBtn.disabled = index >= stack.length - 1;
  }
  function reset() { stack = []; index = -1; update(); }
  return { push, undo, redo, current, reset };
})();
