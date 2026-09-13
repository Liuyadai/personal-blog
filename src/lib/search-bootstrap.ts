interface SearchContainer {
  innerHTML: string;
  classList: { add(name: string): void };
}

interface PagefindOptions {
  element: string;
  showSubResults: boolean;
  translations: Record<string, string>;
}

type PagefindConstructor = new (options: PagefindOptions) => unknown;

const translations = {
  placeholder: "输入关键词",
  clear_search: "清除",
  load_more: "加载更多",
  search_label: "搜索本站",
  filters_label: "筛选",
  zero_results: "没有找到 [SEARCH_TERM] 的相关内容",
  many_results: "找到 [COUNT] 条关于 [SEARCH_TERM] 的结果",
  one_result: "找到 1 条关于 [SEARCH_TERM] 的结果",
  alt_search: "没有找到 [SEARCH_TERM]，显示 [DIFFERENT_TERM] 的结果",
  search_suggestion: "没有找到 [SEARCH_TERM]，可以尝试：",
  searching: "正在搜索 [SEARCH_TERM]…"
};

export function mountPagefind({
  PagefindUI,
  container
}: {
  PagefindUI?: PagefindConstructor;
  container: SearchContainer;
}) {
  if (!PagefindUI) {
    container.innerHTML =
      '<p class="search-error">搜索暂时不可用，请稍后刷新页面重试。</p>';
    container.classList.add("search-unavailable");
    return false;
  }

  container.innerHTML = "";
  new PagefindUI({
    element: "#search",
    showSubResults: true,
    translations
  });
  return true;
}
