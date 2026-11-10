# 投票收集说明（当前：FormSubmit）

页面把每次提交 POST 到 `app.js` 顶部的 `ENDPOINT`，当前配置为：

```javascript
const ENDPOINT = "https://formsubmit.co/ajax/zjc010100000@gmail.com";
```

## 需要做一次的事：激活

FormSubmit 第一次收到请求时会往该邮箱发一封 **Activate Form** 的邮件。
在邮箱里点一次 “Activate Form”，之后所有提交就会转发到该邮箱。

激活前提交的请求会返回：

```
{"success":"false","message":"This form needs Activation..."}
```

页面此时会把答案下载成 JSON 作为兜底，不影响被试继续使用，但那条**不会**进邮箱。
所以请在发问卷之前先激活，并用一次测试提交确认能收到邮件。

## 提交长什么样

每封邮件正文是 JSON：

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

`answers` 的键是组号，值是被选中的两个标签（每组 7 段，标签 A–G）。
标签到方法的映射只在 `CVPR27_DIET/user_study/key.csv`，**不要上传到网页目录**。

## 可选：换成不回显邮箱的别名

FormSubmit 激活后会提供一个随机别名（形如 `https://formsubmit.co/ajax/xxxxxxxx`）。
把 `ENDPOINT` 换成别名再提交一次，可以避免邮箱地址直接出现在页面源码里。

## 备选：Google Apps Script + Sheet

如果想直接进表格而不是邮箱，把 `ENDPOINT` 换成 Apps Script 的 `/exec` 链接，代码：

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['submitted_at','session','answers_json','familiarity','age','viewport']);
  }
  const d = JSON.parse(e.postData.contents);
  sheet.appendRow([d.submitted_at, d.session, JSON.stringify(d.answers),
                   (d.background||{}).familiarity||'', (d.background||{}).age||'', d.viewport||'']);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

注意页面用 `text/plain` 发 JSON 以避开预检；`app.js` 会根据 endpoint 是否含
`formsubmit.co` 自动切换请求头。
