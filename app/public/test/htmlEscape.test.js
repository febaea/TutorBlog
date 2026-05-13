import { htmlEscape } from "../js/htmlEscape.js";
import assert from "assert";
//to run put in terminal: npx mocha app/public/test/htmlEscape.test.js 

//Tests for htmlEscape function
// Starts by setting the variables then runs them by the function and checks that the output is correct
describe("htmlEscape tests", function () {
  it("should return the same string if there are no special characters", () => {
    const input = "Hello, World!";
    const expected = "Hello, World!";
    const result = htmlEscape(input);
    assert.strictEqual(result, expected);
  });
  it("input containing special characters should be changed by the function", () => {
    const input = '<script>alert("XSS")</script>';
    const result = htmlEscape(input);
    assert.notEqual(result, input);
  });
  it("should escape special characters in a string to their ascii code", () => {
    const input = '<script>alert("XSS")</script>';
    const expected = "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;";
    const result = htmlEscape(input);
    assert.strictEqual(result, expected);
  });
});
