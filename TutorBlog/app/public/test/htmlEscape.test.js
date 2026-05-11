import { htmlEscape } from "../js/htmlEscape.js";
import assert from "assert";

describe("htmlEscape tests", function () {
  it("should escape special characters in a string", () => {
    const input = '<script>alert("XSS")</script>';
    const expected = "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;";
    const result = htmlEscape(input);
    assert.strictEqual(result, expected);
  });
  it("should return the same string if there are no special characters", () => {
    const input = "Hello, World!";
    const expected = "Hello, World!";
    const result = htmlEscape(input);
    assert.strictEqual(result, expected);
  });
});
