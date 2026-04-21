// This function can be used to escape special characters in a string to prevent XSS attacks when
// rendering user input in HTML. It replaces characters like &, <, >, ", and ' with their
// corresponding HTML entities. It can only be used in SafeContexts which means only
// when the output is rendered as HTML. So not in attributes, URLs, or JavaScript contexts.

//Encodes Outputs
function htmlEscape(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
