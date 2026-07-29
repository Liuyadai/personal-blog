# 文章地址重定向

文章标题可以修改，但文章目录名（slug）默认不要修改，因为它决定文章 URL。

如果确实要将：

```text
src/content/blog/old-slug/
```

修改为：

```text
src/content/blog/new-slug/
```

请同时在 `public/_redirects` 末尾增加：

```text
/posts/old-slug/  /posts/new-slug/  301
```

`301` 表示永久重定向。发布后，访问旧地址会自动跳到新地址。
