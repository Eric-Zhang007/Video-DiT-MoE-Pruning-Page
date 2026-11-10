/* ------------------------------------------------------------------
   Collection: on submit the page opens a pre-filled GitHub issue on
   Eric-Zhang007/Video-DiT-MoE-Pruning-Page (label: study-vote).
   The participant only has to press "Submit new issue".
   A static page cannot open issues by itself: doing that would require
   a personal access token shipped inside a public page, which GitHub
   scans for and revokes.
   ------------------------------------------------------------------ */
const STUDY_ID = "diet-study-v1";

const state = {};           // caseNum -> [labels]

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function render() {
  const root = document.getElementById("cases");
  CASES.forEach((c, idx) => {
    state[c.num] = [];

    const card = el("section", "case");
    card.id = "case-" + c.num;

    const head = el("div", "case-head");
    head.appendChild(el("span", "case-num", `Group ${idx + 1}`));
    head.appendChild(el("span", "case-dim", c.dim));
    card.appendChild(head);

    const prompt = el("p", "prompt");
    prompt.innerHTML = "<b>Prompt:</b> ";
    prompt.appendChild(document.createTextNode(c.prompt || "(prompt unavailable)"));
    card.appendChild(prompt);

    const grid = el("div", "grid");
    c.labels.forEach((lab) => {
      const clip = el("div", "clip");
      clip.dataset.label = lab;

      const v = document.createElement("video");
      v.src = `videos/${c.dir}/${lab}.mp4`;
      v.controls = true;
      v.preload = "metadata";
      v.playsInline = true;
      v.loop = true;
      clip.appendChild(v);

      const bar = el("div", "clip-bar");
      bar.appendChild(el("span", "clip-label", lab));

      const wrap = el("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = lab;
      cb.addEventListener("change", () => toggle(c.num, lab, cb, clip));
      wrap.appendChild(cb);
      wrap.appendChild(document.createTextNode("Best"));
      bar.appendChild(wrap);

      clip.appendChild(bar);
      grid.appendChild(clip);
    });
    card.appendChild(grid);
    root.appendChild(card);
  });
}

function toggle(caseNum, lab, cb, clip) {
  const picked = state[caseNum];
  const i = picked.indexOf(lab);
  if (i >= 0) {
    picked.splice(i, 1);
    cb.checked = false;
    clip.classList.remove("picked");
  } else {
    if (picked.length >= 2) {
      // replace the earliest pick so a third click is not silently ignored
      const drop = picked.shift();
      const old = document.querySelector(
        `#case-${caseNum} .clip[data-label="${drop}"]`
      );
      if (old) {
        old.classList.remove("picked");
        old.querySelector('input[type="checkbox"]').checked = false;
      }
    }
    picked.push(lab);
    cb.checked = true;
    clip.classList.add("picked");
  }
  updateProgress();
}

function completed() {
  return CASES.filter((c) => state[c.num].length === 2).length;
}

function updateProgress() {
  const done = completed();
  const total = CASES.length;
  document.getElementById("progressfill").style.width = `${(done / total) * 100}%`;
  document.getElementById("progressText").textContent =
    `${done} / ${total} groups completed`;
  const btn = document.getElementById("submitBtn");
  btn.disabled = done !== total;
  document.getElementById("hint").textContent =
    done === total
      ? "All groups answered. You can still change your choices before submitting."
      : "Select exactly two clips in every group to enable submission.";
}

function payload() {
  const answers = {};
  CASES.forEach((c) => { answers[c.num] = state[c.num].slice(); });
  return {
    study: STUDY_ID,
    submitted_at: new Date().toISOString(),
    session: Math.random().toString(36).slice(2, 12),
    answers,
    background: {
      familiarity: document.getElementById("bg1").value,
      age: document.getElementById("bg2").value,
    },
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

const REPO = "Eric-Zhang007/Video-DiT-MoE-Pruning-Page";
const ISSUE_LABEL = "study-vote";

function issueUrl(data) {
  const title = `vote-${data.session}`;
  const body = "```json\n" + JSON.stringify(data, null, 2) + "\n```";
  const q = new URLSearchParams({
    labels: ISSUE_LABEL,
    title: title,
    body: body,
  });
  return `https://github.com/${REPO}/issues/new?${q.toString()}`;
}

function showPanel(html) {
  let box = document.getElementById("panel");
  if (!box) {
    // survives a stale cached index.html that predates the panel element
    box = document.createElement("div");
    box.id = "panel";
    box.className = "panel";
    const area = document.querySelector(".submit-area") || document.body;
    area.appendChild(box);
  }
  box.innerHTML = html;
  box.classList.remove("hidden");
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

function submit() {
  const data = payload();
  const url = issueUrl(data);
  const win = window.open(url, "_blank");

  showPanel(`
    <h3>Almost done</h3>
    <p>A GitHub tab should have opened. There, click <strong>Submit new issue</strong> — that is what records your answers.</p>
    <p><a class="btn" href="${url}" target="_blank" rel="noopener">Open the submission page</a></p>
    <p class="hint">No GitHub account? Use the backup below and send the file to the organiser.</p>
    <p><button class="btn ghost" id="copyBtn">Copy answers as JSON</button></p>
    <p class="hint" id="copyMsg"></p>
  `);

  if (!win) {
    document.getElementById("status").className = "status err";
    document.getElementById("status").textContent =
      "Your browser blocked the pop-up. Use the button above.";
  }

  document.getElementById("copyBtn").addEventListener("click", async () => {
    const text = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById("copyMsg").textContent = "Copied. Paste it into an email to the organiser.";
    } catch (e) {
      const blob = new Blob([text], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `study-${data.session}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      document.getElementById("copyMsg").textContent = "Downloaded as a JSON file.";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  updateProgress();
  document.getElementById("submitBtn").addEventListener("click", submit);
});
