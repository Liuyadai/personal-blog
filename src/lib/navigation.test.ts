import { describe, expect, it } from "vitest";
import { isNavActive } from "./navigation";

describe("navigation active state", () => {
  it("marks the homepage active only on the root URL", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/about/", "/")).toBe(false);
  });

  it("marks section links active for their nested routes", () => {
    expect(isNavActive("/categories/tech/", "/categories/")).toBe(true);
    expect(isNavActive("/about/", "/categories/")).toBe(false);
  });
});
