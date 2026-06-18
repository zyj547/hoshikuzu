// ==========================================================================
// 面试与谈薪状态机（依赖 interview-calc.js 的纯函数 + 全局 gameState/DOM）
// ==========================================================================
let activeInterview = null; // { cand, idx, impression, moraleAdj, expectedSalary, round, scenarioIdx }

function imOpen() { document.getElementById("interview-modal").classList.add("active"); }
function imClose() { document.getElementById("interview-modal").classList.remove("active"); }
function imRender(title, desc, choices) {
    document.getElementById("interview-title").innerHTML = `<i class="fa-solid fa-user-tie"></i> ${title}`;
    document.getElementById("interview-desc").innerHTML = desc;
    const box = document.getElementById("interview-choices");
    box.innerHTML = "";
    choices.forEach(ch => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerHTML = ch.text;
        btn.onclick = ch.action;
        box.appendChild(btn);
    });
}
function imPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function imRefillPool() {
    while (hiringPool.length < 4) {
        const roles = ["designer", "programmer", "artist"];
        hiringPool.push(generateCandidate(roles[Math.floor(Math.random() * 3)], rollHiringRarity()));
    }
}

// 阶段 0：约面，扣渠道费，可能放鸽子
function startInterview(idx) {
    const cand = hiringPool[idx];
    if (!cand) return;
    const fee = getInterviewFee(cand, gameState.date.year);
    if (gameState.funds < fee) { alert(`资金不足！邀约面试需要渠道费 ¥${fee.toLocaleString()}。`); return; }
    if (gameState.employees.length >= (gameState.officeSlots || 5)) { alert("办公室卡座已满，无法再招人。"); return; }

    gameState.funds -= fee;
    const arch = EMPLOYEE_ARCHETYPES[cand.archetype];
    updateStatsUI();

    // 放鸽子
    if (Math.random() < (arch.noShowChance || 0)) {
        addChronicleEntry(`📵 ${cand.name} 放了你鸽子，渠道费 ¥${fee.toLocaleString()} 打了水漂。`);
        hiringPool.splice(idx, 1);
        imRefillPool();
        saveGame();
        loadStaffRecruits();
        alert(`${cand.name} 临时放了鸽子，没来面试……（渠道费已扣）`);
        return;
    }

    activeInterview = { cand, idx, impression: 0, moraleAdj: 0, expectedSalary: cand.expectedSalary, round: 0, scenarioIdx: 0 };
    imOpen();
    imRender(`面试 · ${arch.name}`, imPick(arch.lines.intro), [
        { text: "开始面试 →", action: imScenario }
    ]);
}

// 阶段 1：情境题（逐题）
function imScenario() {
    const { cand, scenarioIdx } = activeInterview;
    const arch = EMPLOYEE_ARCHETYPES[cand.archetype];
    const sc = arch.lines.scenarios[scenarioIdx];
    if (!sc) { imHaggleStart(); return; }
    imRender(`情境题 ${scenarioIdx + 1}`, sc.q, sc.choices.map(ch => ({
        text: ch.text,
        action: () => {
            activeInterview.impression += ch.impression;
            activeInterview.expectedSalary = Math.max(cand.salaryFloor, activeInterview.expectedSalary + ch.expectAdj);
            activeInterview.moraleAdj += ch.moraleAdj;
            activeInterview.scenarioIdx++;
            imScenario();
        }
    })));
}

// 阶段 2：谈薪首轮
function imHaggleStart() {
    const arch = EMPLOYEE_ARCHETYPES[activeInterview.cand.archetype];
    imHaggleRound(imPick(arch.lines.haggleFirst));
}

function imHaggleRound(speech) {
    const ai = activeInterview;
    const exp = ai.expectedSalary;
    const lowOffer = Math.round(exp * 0.85);
    const highOffer = Math.round(exp * 1.10);
    const note = `<div class="haggle-note">候选人当前期望月薪：¥${exp.toLocaleString()}（已谈 ${ai.round}/3 轮）</div>`;
    imRender("谈薪", `${speech}${note}`, [
        { text: `压价 ¥${lowOffer.toLocaleString()}`, action: () => imRespond(lowOffer) },
        { text: `照付 ¥${exp.toLocaleString()}`, action: () => imRespond(exp) },
        { text: `加价 ¥${highOffer.toLocaleString()}（提升士气）`, action: () => imRespond(highOffer, true) },
        { text: "放弃这位候选人", action: imGiveUp }
    ]);
}

// 谈薪响应
function imRespond(offer, isRaise) {
    const ai = activeInterview;
    const cand = ai.cand;
    const arch = EMPLOYEE_ARCHETYPES[cand.archetype];
    ai.round++;

    if (offer >= ai.expectedSalary) {
        const bonusMorale = isRaise ? 8 : 0;
        return imAccept(offer, ai.moraleAdj + bonusMorale, imPick(arch.lines.haggleAccept));
    }

    const res = evaluateOffer({
        expectedSalary: ai.expectedSalary, salaryFloor: cand.salaryFloor,
        impression: ai.impression, concession: arch.concession, walkChance: arch.walkChance
    }, offer);

    if (res.result === "accept") return imAccept(offer, ai.moraleAdj, imPick(arch.lines.haggleAccept));
    if (res.result === "walk")  return imWalk(imPick(arch.lines.haggleReject));

    // counter
    ai.expectedSalary = res.counterOffer;
    if (ai.round >= 3) return imWalk("「谈了这么多轮还谈不拢，那就算了吧。」");
    imHaggleRound(imPick(arch.lines.haggleCounter));
}

// 阶段 3a：录用
function imAccept(salary, moraleAdj, speech) {
    const ai = activeInterview;
    const arch = EMPLOYEE_ARCHETYPES[ai.cand.archetype];
    commitHire(ai.cand, ai.idx, salary, Math.max(20, Math.min(100, arch.moraleSeed + moraleAdj)));
    imRender("录用成功", `${speech}<div class="haggle-note">${imPick(arch.lines.onboard)}</div>`, [
        { text: "完成", action: () => { imClose(); activeInterview = null; } }
    ]);
    playSFX("success");
}

// 阶段 3b：谈崩 / 放弃 → 候选人消失
function imWalk(speech) { imLeave(speech, "谈崩了"); }
function imGiveUp() { const arch = EMPLOYEE_ARCHETYPES[activeInterview.cand.archetype]; imLeave(imPick(arch.lines.haggleReject), "你放弃了"); }
function imLeave(speech, reason) {
    const ai = activeInterview;
    addChronicleEntry(`🚪 ${reason}，${ai.cand.name} 离开了人才市场。`);
    hiringPool.splice(ai.idx, 1);
    imRefillPool();
    imRender("面试结束", speech, [
        { text: "关闭", action: () => { imClose(); activeInterview = null; saveGame(); loadStaffRecruits(); } }
    ]);
    playSFX("click");
}
