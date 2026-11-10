# 投票收集：提交即开 GitHub issue

页面不再依赖第三方表单服务。答完 10 组后点 **Submit my answers**，会新开一个 GitHub 标签页，
里面是**预填好的 issue**（标题 `vote-<session>`，正文是 JSON，标签 `study-vote`）。
被试只需要点一次 **Submit new issue**。

## 为什么不能全自动

静态页面没有任何 GitHub 凭证。要在浏览器里直接调 API 建 issue，必须把 personal access
token 写进 `app.js`；而这个文件在公开仓库里，GitHub 的 secret scanning 会发现并吊销 token。
所以采用“预填 issue + 被试点一次提交”的方式，这是不暴露凭证前提下最接近自动的方案。

## 结果在哪看

- 原始记录：仓库 Issues，筛选标签 `study-vote`，一条 issue = 一份问卷。
- 实时汇总页：https://zjc301.top/Video-DiT-MoE-Pruning-Page/s/results.html
  按组统计每个标签被选中的次数（只有标签，不含方法名）。
- 本地映射：`CVPR27_DIET/user_study/tally.py` 用 `key.csv` 把标签换成方法，
  算每组的平均名次、前二比例。

## 被试需要什么

一个 GitHub 账号（没有的话页面提供 JSON 备份按钮，让他把文件发给组织者）。
如果被试群体没有 GitHub 账号，改用 Google Apps Script 写 Google Sheet（见 git 历史里的版本）。

## 名额与限流

- 公开仓库的 issue 任何 GitHub 用户都能开，不需要邀请。
- results.html 用未认证 API 读 issue，每 IP 每小时 60 次，够用。
- 若想限制乱填，可以在事后按 issue 标题里的 session 去重。
