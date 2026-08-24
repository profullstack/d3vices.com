/**
 * hono/jsx renders a fragment, not a document — it emits no doctype. A page
 * served without one renders in quirks mode, which looks fine until a layout
 * bug appears that nothing in the CSS explains. Every HTML response goes
 * through here.
 */
export function render(c, node, init) {
  return c.html(`<!doctype html>${node.toString()}`, init);
}
