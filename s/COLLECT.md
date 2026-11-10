# 收集投票：两种方案（二选一）

页面是纯静态的，提交时会 POST 一段 JSON 到 `app.js` 顶部的 `ENDPOINT`。
`ENDPOINT` 为空时，答案只存在浏览器本地并自动下载 JSON（只适合自己测试）。

下面两种都能用，推荐 A。

---

## A. Google Apps Script + Google Sheet（推荐）

免费、结构化、不依赖第三方表单服务，结果直接进表格。

1. 新建一个 Google Sheet，命名随意（例如 `diet-study`）。
2. 菜单 `扩展程序 → Apps Script`，把下面的代码整个贴进去：

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['submitted_at','session','answers_json','familiarity','age','viewport']);
  }
  const d = JSON.parse(e.postData.contents);
  sheet.appendRow([
    d.submitted_at,
    d.session,
    JSON.stringify(d.answers),
    (d.background || {}).familiarity || '',
    (d.background || {}).age || '',
    d.viewport || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ok: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. 右上角 `部署 → 新建部署 → 类型选“Web 应用”`：
   - 执行身份：**我**
   - 谁可以访问：**任何人**
   然后复制生成的 `/exec` 链接。
4. 把链接填进 `s/app.js` 第一行：

```javascript
const ENDPOINT = "https://script.google.com/macros/s/AKfycb.../exec";
```

5. 重新提交/推送页面。用一个测试提交确认表里出现一行。

> 注意：Apps Script 的 web app 对跨域 POST 支持有限，所以页面用
> `Content-Type: text/plain` 发送 JSON（这样不会触发预检请求），
> 服务端用 `e.postData.contents` 解析。

## B. FormSubmit（不用 Google 账号，走邮箱）

1. 把 `app.js` 里的提交改成：

```javascript
const ENDPOINT = "https://formsubmit.co/ajax/你的邮箱@example.com";
```

2. 第一次提交后，FormSubmit 会往该邮箱发一封确认信，点确认后开始转发。
3. 每个被试的提交会作为一封邮件到达，正文是 JSON。

缺点：结果在邮箱里，后期要自己汇总；不建议超过几十人。

---

## 部署位置

页面在项目主页仓库的 `s/` 目录下，**没有从主页链接过去**，只靠 URL 分发：

```
https://zjc301.top/Video-DiT-MoE-Pruning-Page/s/
```

`<meta name="robots" content="noindex,nofollow">` 已加，搜索引擎不会索引。
```

## 结果长什么样

每次提交一条：

```json
{
  "study": "diet-study-v1",
  "submitted_at": "2026-11-12T09:31:02.114Z",
  "session": "k3f9a2b1c4",
  "answers": {"01": ["B","D"], "02": ["A","C"], "...": []},
  "background": {"familiarity": "tried", "age": "18-24"},
  "viewport": "1440x900"
}
```

`answers` 的键是组号，值是被选中的两个标签；标签到方法的映射只保存在
`CVPR27_DIET/user_study/key.csv`，**不要上传到网页目录**。
