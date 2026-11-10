# 投票收集：改用 Google Apps Script（FormSubmit 激活失败）

FormSubmit 的激活邮件没有生效（接口仍返回 `needs Activation`），不再依赖它。
改用 Google Apps Script 直接写入 Google Sheet：不需要邮箱激活，提交即入表。

## 5 步，约 3 分钟

1. 打开 https://sheets.new 新建一个空白表格，命名随意（例如 `diet-study`）。
2. 菜单 **扩展程序 → Apps Script**，删掉里面默认的 `function myFunction(){}`，
   把下面整段贴进去，保存（Ctrl+S）：

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

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok: true, msg: 'endpoint alive'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. 右上 **部署 → 新建部署**，齿轮选 **Web 应用**：
   - 说明：随便填
   - **执行身份：我**
   - **谁可以访问：任何人**  ← 必须是这个，否则页面收不到
   点“部署”，第一次会让你授权：选账号 → 高级 → 转到（不安全）→ 允许。
4. 复制生成的 **Web 应用网址**，形如
   `https://script.google.com/macros/s/AKfycb....../exec`
5. 把这个链接发给我，我填进 `app.js`、推上去，并用浏览器做一次真实提交，
   然后在表格里确认出现一行。

## 验证

部署完成后，浏览器直接打开那个 `/exec` 链接应该看到：

```json
{"ok": true, "msg": "endpoint alive"}
```

看到就说明部署成功、权限正确。

## 备注

- 页面用 `text/plain` 发 JSON，避免 CORS 预检；服务端从 `e.postData.contents` 解析。
- 表格里每行一次提交；`answers_json` 形如 `{"01":["B","D"],...}`。
- 标签到方法的映射只在 `CVPR27_DIET/user_study/key.csv`，不要上传到网页目录。

## 如果以后想换回 FormSubmit

激活成功后把 `ENDPOINT` 改回 `https://formsubmit.co/ajax/<别名>` 即可，代码里已有分支。
