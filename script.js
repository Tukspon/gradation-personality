// ===== 質問データ =====
// axis: どの指標の質問か
// key : +1 = 左側の文字（I / N / T / P）寄りの質問、-1 = 逆転項目
// 各指標5問（通常3問＋逆転2問）、指標が偏らないよう順番に並べている
const QUESTIONS = [
  { text: "休日は一人で過ごすほうが落ち着く。", axis: "IE", key: 1 },
  { text: "ニュースを見ると、起きたことよりも「この先どうなるんだろう」と考えることが多い。", axis: "NS", key: 1 },
  { text: "何かを決めるときは、気持ちより筋が通っているかを重視する。", axis: "TF", key: 1 },
  { text: "予定は直前まで決めず、その場の流れで動きたい。", axis: "PJ", key: 1 },

  { text: "初対面の人にも自分から話しかけるほうだ。", axis: "IE", key: -1 },
  { text: "新しいやり方より、実績のある確実な方法を選ぶ。", axis: "NS", key: -1 },
  { text: "正しいことでも、相手が傷つくなら言うのをためらう。", axis: "TF", key: -1 },
  { text: "旅行では事前に細かく計画を立てる。", axis: "PJ", key: -1 },

  { text: "大人数の集まりのあとは、一人の時間で回復したくなる。", axis: "IE", key: 1 },
  { text: "「もし〜だったら」と想像をふくらませるのが好きだ。", axis: "NS", key: 1 },
  { text: "友人に相談されたら、共感より解決策を伝えたくなる。", axis: "TF", key: 1 },
  { text: "予定をきっちり決めすぎると、窮屈に感じる。", axis: "PJ", key: 1 },

  { text: "人と話しているうちに、考えがまとまっていくほうだ。", axis: "IE", key: -1 },
  { text: "抽象的な話より、具体例を聞くほうが分かりやすい。", axis: "NS", key: -1 },
  { text: "決断するときは、関わる人がどう感じるかを一番に考える。", axis: "TF", key: -1 },
  { text: "物事は早めに終わらせておかないと落ち着かない。", axis: "PJ", key: -1 },

  { text: "話す前に、頭の中で考えを整理してから話したい。", axis: "IE", key: 1 },
  { text: "ひらめきや直感でアイデアを思いつくことが多い。", axis: "NS", key: 1 },
  { text: "議論では、相手と意見が違ってもはっきり伝える。", axis: "TF", key: 1 },
  { text: "途中で予定が変わっても、むしろ楽しめるほうだ。", axis: "PJ", key: 1 },
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

// 解説用：各文字の傾向（後ろに「かなり強い」などの程度がつく）
const TENDENCY = {
  I: "一人の時間でエネルギーを回復する傾向が",
  E: "人との関わりからエネルギーを得る傾向が",
  N: "物事の意味や将来の可能性に目を向ける傾向が",
  S: "具体的な事実や経験を大切にする傾向が",
  T: "筋道や論理を重視して判断する傾向が",
  F: "人の気持ちを重視して判断する傾向が",
  P: "予定より、その場の流れに合わせて動く傾向が",
  J: "計画を立てて、決めた通りに進める傾向が",
};

// 解説用：上位タイプで分かれた指標の説明
const BLEND = {
  IE: { label: "エネルギーの向き", text: "一人で過ごす時間も、人と過ごす時間も、同じくらい大切にします。" },
  NS: { label: "ものの見方", text: "目の前の事実と、その先の可能性の両方に目を向けます。" },
  TF: { label: "判断の仕方", text: "筋道を大事にしながらも、相手の気持ちも同じくらい気にかけます。" },
  PJ: { label: "物事の進め方", text: "計画を立てることも、その場で柔軟に動くことも、どちらもできます。" },
};

// 割合（0.5〜1）から程度の言葉を決める
function degree(r) {
  if (r >= 0.85) return "かなり強い";
  if (r >= 0.7) return "強い";
  if (r >= 0.6) return "やや強い";
  return "少しある";
}

const SCALE_LABELS = ["全くそう思わない", "あまりそう思わない", "どちらでもない", "ややそう思う", "とてもそう思う"];

// ===== 計算 =====
// 回答（1〜5）→ −2〜+2 に変換し、逆転項目は符号を反転
// 指標ごとに合計（5問なら−10〜+10）→ 左側の文字の割合 = (合計 + 10) / 20
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
const PER_PAGE = 5;
const PAGES = Math.ceil(QUESTIONS.length / PER_PAGE);
let page = 0;

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildQuiz() {
  const form = $("quizForm");
  form.innerHTML = QUESTIONS.map((q, i) => `
    <div class="q" data-page="${Math.floor(i / PER_PAGE)}">
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
    updateQuiz();

    // ページ内の次の未回答へ自動スクロール。全部答えたらボタンへ
    const { start, end } = pageRange();
    const nextIdx = answers.slice(start, end).findIndex((a) => a === null);
    if (nextIdx >= 0) {
      form.querySelectorAll(".q")[start + nextIdx].scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      $("nextBtn").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

// ===== ページ分け（5問ずつ） =====
function pageRange() {
  const start = page * PER_PAGE;
  return { start, end: Math.min(start + PER_PAGE, QUESTIONS.length) };
}

function updateQuiz() {
  document.querySelectorAll(".q").forEach((el) => { el.hidden = Number(el.dataset.page) !== page; });

  const done = answers.filter((a) => a !== null).length;
  $("progressBar").style.width = `${(done / QUESTIONS.length) * 100}%`;
  $("progressText").textContent = `${page + 1} / ${PAGES} ページ`;

  const { start, end } = pageRange();
  const left = answers.slice(start, end).filter((a) => a === null).length;
  const isLast = page === PAGES - 1;
  $("nextBtn").disabled = left > 0;
  $("nextBtn").textContent = left > 0 ? `あと${left}問` : isLast ? "結果を見る" : "次へ";
  $("prevBtn").style.visibility = page === 0 ? "hidden" : "visible";
}

function goPage(p) {
  page = p;
  updateQuiz();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderResult() {
  const axisRatio = calcAxes(answers);
  const types = calcTypes(axisRatio);
  // 上位タイプを合計70%以上になるまで表示（最低2つ・最大5つ、同率は途中で切らない）
  const EPS = 1e-9;
  const top = [];
  let cum = 0;
  for (const t of types) {
    const last = top[top.length - 1];
    const tiedWithLast = last && Math.abs(last.p - t.p) < EPS;
    if (top.length >= 2 && (cum >= 0.7 || top.length >= 5) && !tiedWithLast) break;
    if (t.p < EPS || top.length >= 6) break;
    top.push(t);
    cum += t.p;
  }
  const otherP = Math.max(0, 1 - cum);

  // 1位が同率かどうかで文章を変える
  const lead = top.filter((t) => Math.abs(t.p - top[0].p) < EPS);
  const rest = top.slice(lead.length);
  const strong = (t) => `<strong>${t.code}</strong>`;
  const leadText = lead.length >= 4
    ? `特定のタイプに偏らない、バランスの取れた結果です`
    : lead.length === 1
    ? `あなたは ${strong(lead[0])} の傾向が最も強く（${pct(lead[0].p)}%）`
    : `あなたは ${lead.map(strong).join(" と ")} の傾向が同じくらい強く（各${pct(lead[0].p)}%）`;
  const restText = rest.length && lead.length < 4
    ? `、次いで ${rest.map((t) => `${strong(t)}（${pct(t.p)}%）`).join("、")} の要素も持っています。`
    : "。";

  // ① 割合表示（本研究で提案する表示）
  $("view-mix").innerHTML = `
    <div class="card">
      ${top.map((t) => `
        <div class="mix-row">
          <div class="mix-head"><span class="code">${t.code}</span><span>${pct(t.p)}%</span></div>
          <div class="bar"><div style="width:${pct(t.p)}%"></div></div>
        </div>`).join("")}
      ${otherP >= 0.005 ? `
      <div class="mix-row other">
        <div class="mix-head"><span>その他</span><span>${pct(otherP)}%</span></div>
        <div class="bar"><div style="width:${pct(otherP)}%"></div></div>
      </div>` : ""}
      <p class="summary">${leadText}${restText}</p>
      <details>
        <summary>16タイプすべての割合を見る</summary>
        <table>${types.map((t) => `<tr><td>${t.code}</td><td>${(t.p * 100).toFixed(1)}%</td></tr>`).join("")}</table>
      </details>
    </div>
    ${lead.length >= 4 ? "" : renderExplain(types[0].code, types[1].code, axisRatio)}`;

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

// 上位2タイプを比べて解説を作る
// 共通する文字＝その人の軸になっている特徴、分かれた文字＝揺れている部分
function renderExplain(a, b, axisRatio) {
  const common = [];
  const split = [];
  AXES.forEach((axis, k) => {
    const leftR = axisRatio[axis.id];
    if (a[k] === b[k]) {
      const letter = a[k];
      const r = letter === axis.left ? leftR : 1 - leftR;
      const name = letter === axis.left ? axis.leftName : axis.rightName;
      common.push({ letter, r, name });
    } else {
      split.push({ axis, leftR });
    }
  });

  const commonRows = common.map((c) => `
    <div class="trait">
      <span class="letter">${c.letter}</span>
      <div>
        <p>${TENDENCY[c.letter]}<b>${degree(c.r)}</b></p>
        <p class="trait-num">${c.name} ${pct(c.r)}%</p>
      </div>
    </div>`).join("");

  const splitRows = split.map(({ axis, leftR }) => {
    const l = pct(leftR);
    return `
    <div class="blend">
      <div class="blend-labels">
        <span class="c-left">${axis.leftName}（${axis.left}）${l}%</span>
        <span class="c-right">${100 - l}% ${axis.rightName}（${axis.right}）</span>
      </div>
      <div class="axis-bar"><div class="l" style="width:${l}%"></div><div class="r" style="width:${100 - l}%"></div></div>
      <p>${BLEND[axis.id].text}場面によって、${a}らしさが出ることも、${b}らしさが出ることもあるタイプです。</p>
    </div>`;
  }).join("");

  const splitTitle = split.map(({ axis }) => BLEND[axis.id].label).join("と");

  return `
    <div class="card explain">
      <div class="explain-head"><span class="badge">解説</span><span>${a} と ${b} から見たあなた</span></div>
      ${common.length ? `
      <p class="explain-lead">あなたの中心にあるのは、2つのタイプに共通する <span class="c-left">${common.map((c) => c.letter).join("・")}</span> の特徴です。</p>
      ${commonRows}` : ""}
      ${split.length ? `
      <p class="explain-lead">一方で、${splitTitle}は <span class="c-left">${a}</span> と <span class="c-right">${b}</span> の間で揺れています。</p>
      ${splitRows}` : ""}
      <p class="explain-note">※ この解説は、あなたの回答から計算した数値をもとに作成しています。</p>
    </div>`;
}

function setView(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
}

// ===== イベント =====
$("startBtn").addEventListener("click", () => { goPage(0); show("quiz"); });
$("nextBtn").addEventListener("click", () => {
  if (page < PAGES - 1) goPage(page + 1);
  else renderResult();
});
$("prevBtn").addEventListener("click", () => { if (page > 0) goPage(page - 1); });
$("retryBtn").addEventListener("click", () => {
  answers.fill(null);
  $("quizForm").reset();
  goPage(0);
  show("quiz");
});
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setView(t.dataset.view)));

buildQuiz();
updateQuiz();
