import { describe, expect, it, vi } from "vitest";

describe("Pagefind search bootstrap", () => {
  it("mounts the browser-global PagefindUI constructor into the search container", async () => {
    const { mountPagefind } = await import("../../src/lib/search-bootstrap.ts");
    const PagefindUI = vi.fn();
    const container = { innerHTML: "正在加载", classList: { add: vi.fn() } };

    const mounted = mountPagefind({ PagefindUI, container });

    expect(mounted).toBe(true);
    expect(container.innerHTML).toBe("");
    expect(PagefindUI).toHaveBeenCalledOnce();
    expect(PagefindUI).toHaveBeenCalledWith(
      expect.objectContaining({ element: "#search", showSubResults: true })
    );
  });
});
