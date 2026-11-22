// ===== 質問データ =====
// axis: どの指標の質問か
// key : +1 = 左側の文字（I / N / T / P）寄りの質問、-1 = 逆転項目
const QUESTIONS = [
  { text: "休日は一人で過ごすほうが落ち着く。", axis: "IE", key: 1 },
  { text: "大人数の集まりのあとは、一人の時間で回復したくなる。", axis: "IE", key: 1 },
  { text: "初対面の人にも自分から話しかけるほうだ。", axis: "IE", key: -1 },
  { text: "細かい事実より、その裏にある意味や可能性が気になる。", axis: "NS", key: 1 },
  { text: "「もし〜だったら」と想像をふくらませるのが好きだ。", axis: "NS", key: 1 },
  { text: "新しいやり方より、実績のある確実な方法を選ぶ。", axis: "NS", key: -1 },
  { text: "何かを決めるときは、気持ちより筋が通っているかを重視する。", axis: "TF", key: 1 },
  { text: "友人に相談されたら、共感より解決策を伝えたくなる。", axis: "TF", key: 1 },
  { text: "正しいことでも、相手が傷つくなら言うのをためらう。", axis: "TF", key: -1 },
  { text: "予定は直前まで決めず、その場の流れで動きたい。", axis: "PJ", key: 1 },
  { text: "課題は締め切り間際にまとめて取りかかることが多い。", axis: "PJ", key: 1 },
  { text: "旅行では事前に細かく計画を立てる。", axis: "PJ", key: -1 },
];

// 各指標の名前と説明
const AXES = [
  { id: "IE", left: "I", right: "E", leftName: "内向", rightName: "外向" },
  { id: "NS", left: "N", right: "S", leftName: "直観", rightName: "感覚" },
  { id: "TF", left: "T", right: "F", leftName: "思考", rightName: "感情" },
  { id: "PJ", left: "P", right: "J", leftName: "知覚", rightName: "判断" },
];

const TRAITS = {
  I: "一人の時間でエネルギーを回復しやすい",
  E: "人との関わりからエネルギーを得やすい",
  N: "物事の意味や将来の可能性に目が向きやすい",
  S: "具体的な事実や経験を大切にしやすい",
  T: "筋道や論理を重視して判断しやすい",
  F: "人の気持ちや関係を重視して判断しやすい",
  P: "柔軟に、その場の流れに合わせて動きやすい",
  J: "計画を立てて、決めた通りに進めやすい",
};

const SCALE_LABELS = ["全くそう思わない", "あまりそう思わない", "どちらでもない", "ややそう思う", "とてもそう思う"];

// ===== 計算 =====
// 回答（1〜5）→ −2〜+2 に変換し、逆転項目は符号を反転
// 指標ごとに合計（−6〜+6）→ 左側の文字の割合 = (合計 + 6) / 12
function calcAxes(answers) {
  const result = {};
  for (const axis of AXES) {
    const items = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.axis === axis.id);
    const max = items.length * 2;
    const sum = items.reduce((acc, { q, i }) => acc + (answers[i] - 3) * q.key, 0);
    result[axis.id] = (sum + max) / (2 * max); // 0〜1（左側の文字の割合）
  }
  return result;
}

// 4指標の割合を掛け合わせて、16タイプそれぞれの割合を出す（合計は必ず100%）
function calcTypes(axisRatio) {
  const types = [];
  for (const a of ["I", "E"]) for (const b of ["N", "S"]) for (const c of ["T", "F"]) for (const d of ["P", "J"]) {
    const code = a + b + c + d;
    let p = 1;
    [a, b, c, d].forEach((letter, k) => {
      const axis = AXES[k];
      const left = axisRatio[axis.id];
      p *= letter === axis.left ? left : 1 - left;
    });
    types.push({ code, p });
  }
  return types.sort((x, y) => y.p - x.p);
}

const pct = (x) => Math.round(x * 100);

// ===== 画面操作 =====
const $ = (id) => document.getElementById(id);
const answers = new Array(QUESTIONS.length).fill(null);

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildQuiz() {
  const form = $("quizForm");
  form.innerHTML = QUESTIONS.map((q, i) => `
    <div class="q">
      <p>Q${i + 1}. ${q.text}</p>
      <div class="scale">
        ${[1, 2, 3, 4, 5].map((v) => `
          <label title="${SCALE_LABELS[v - 1]}">
            <input type="radio" name="q${i}" value="${v}" aria-label="${SCALE_LABELS[v - 1]}">
            <span class="dot"></span>
          </label>`).join("")}
      </div>
      <div class="scale-labels"><span>そう思わない</span><span>そう思う</span></div>
    </div>`).join("");

  form.addEventListener("change", (e) => {
    const i = Number(e.target.name.slice(1));
    answers[i] = Number(e.target.value);
    const done = answers.filter((a) => a !== null).length;
    $("progressBar").style.width = `${(done / QUESTIONS.length) * 100}%`;
    $("progressText").textContent = `${done} / ${QUESTIONS.length}`;
    $("resultBtn").disabled = done < QUESTIONS.length;

    // 次の質問へ自動スクロール
    const next = form.querySelectorAll(".q")[i + 1];
    if (next && answers[i + 1] === null) next.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function renderResult() {
  const axisRatio = calcAxes(answers);
  const types = calcTypes(axisRatio);
  const top = types.slice(0, 3);
  const otherP = 1 - top.reduce((s, t) => s + t.p, 0);

  // ① 割合表示（本研究で提案する表示）
  $("view-mix").innerHTML = `
    <div class="card">
      ${top.map((t) => `
        <div class="mix-row">
          <div class="mix-head"><span class="code">${t.code}</span><span>${pct(t.p)}%</span></div>
          <div class="bar"><div style="width:${pct(t.p)}%"></div></div>
        </div>`).join("")}
      <div class="mix-row other">
        <div class="mix-head"><span>その他</span><span>${pct(otherP)}%</span></div>
        <div class="bar"><div style="width:${pct(otherP)}%"></div></div>
      </div>
      <p class="summary">
        あなたは <strong>${top[0].code}</strong> の傾向が最も強く（${pct(top[0].p)}%）、
        次いで <strong>${top[1].code}</strong>（${pct(top[1].p)}%）、
        <strong>${top[2].code}</strong>（${pct(top[2].p)}%）の要素も持っています。
      </p>
      <details>
        <summary>16タイプすべての割合を見る</summary>
        <table>${types.map((t) => `<tr><td>${t.code}</td><td>${(t.p * 100).toFixed(1)}%</td></tr>`).join("")}</table>
      </details>
    </div>`;

  // ② 1タイプ表示（従来型）
  const main = top[0].code;
  $("view-single").innerHTML = `
    <div class="card">
      <p style="text-align:center;margin:0">あなたのタイプは</p>
      <div class="big-code">${main}</div>
      <ul class="traits">${main.split("").map((l) => `<li>${TRAITS[l]}</li>`).join("")}</ul>
    </div>`;

  // ③ 指標の%表示（16Personalities型）
  $("view-axis").innerHTML = `
    <div class="card">
      ${AXES.map((a) => {
        const l = pct(axisRatio[a.id]);
        return `
        <div class="axis">
          <div class="axis-labels">
            <span>${a.leftName}（${a.left}）${l}%</span>
            <span>${100 - l}% ${a.rightName}（${a.right}）</span>
          </div>
          <div class="axis-bar"><div class="l" style="width:${l}%"></div><div class="r" style="width:${100 - l}%"></div></div>
        </div>`;
      }).join("")}
    </div>`;

  setView("mix");
  show("result");
}

function setView(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
}

// ===== イベント =====
$("startBtn").addEventListener("click", () => show("quiz"));
$("resultBtn").addEventListener("click", renderResult);
$("retryBtn").addEventListener("click", () => {
  answers.fill(null);
  $("quizForm").reset();
  $("progressBar").style.width = "0";
  $("progressText").textContent = `0 / ${QUESTIONS.length}`;
  $("resultBtn").disabled = true;
  show("quiz");
});
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setView(t.dataset.view)));

buildQuiz();
