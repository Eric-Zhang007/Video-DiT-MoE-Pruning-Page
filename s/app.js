/* ------------------------------------------------------------------
   Collection endpoint.
   Leave ENDPOINT empty to run in local mode: answers are kept in the
   browser and offered as a CSV/JSON download (useful for testing).

   To collect answers centrally, deploy the Google Apps Script in
   COLLECT.md (5 minutes) and paste its /exec URL below.
   ------------------------------------------------------------------ */
const ENDPOINT = "https://formsubmit.co/ajax/zjc010100000@gmail.com";
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

function download(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `study-${data.session}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function submit() {
  const status = document.getElementById("status");
  const data = payload();

  if (!ENDPOINT) {
    const all = JSON.parse(localStorage.getItem(STUDY_ID) || "[]");
    all.push(data);
    localStorage.setItem(STUDY_ID, JSON.stringify(all));
    download(data);
    status.className = "status ok";
    status.textContent =
      "Answers saved locally and downloaded as JSON. (Collection endpoint not configured yet.)";
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  status.className = "status";
  status.textContent = "Submitting…";
  try {
    const isFormSubmit = ENDPOINT.indexOf("formsubmit.co") !== -1;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: isFormSubmit
        ? { "Content-Type": "application/json", "Accept": "application/json" }
        : { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json().catch(() => null);
    if (isFormSubmit && body && String(body.success).toLowerCase() === "false") {
      throw new Error(body.message || "the form is not activated yet");
    }
    document.body.innerHTML = `
      <div class="thanks">
        <h2>Thank you!</h2>
        <p>Your answers have been recorded.</p>
        <p class="hint">You can close this tab.</p>
      </div>`;
  } catch (err) {
    btn.disabled = false;
    status.className = "status err";
    status.textContent =
      `Submission failed (${err.message}). Your answers are downloaded as JSON as a backup; please send that file to the organiser.`;
    download(data);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  updateProgress();
  document.getElementById("submitBtn").addEventListener("click", submit);
});
