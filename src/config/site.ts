export const SITE = {
  title: "所见所得",
  description: "记录技术、阅读，以及生活中值得被再次想起的事。",
  author: "孟浪",
  language: "zh-CN",
  locale: "zh-CN",
  timezone: "Asia/Shanghai",
  url: "https://personal-blog-4xd.pages.dev",
  homePostLimit: 20,
  nav: [
    { href: "/", label: "最近记录" },
    { href: "/archive/", label: "归档" },
    { href: "/categories/", label: "分类与标签" },
    { href: "/about/", label: "关于我" }
  ]
} as const;
