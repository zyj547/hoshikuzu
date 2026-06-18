// ==========================================================================
// 公司发展阶段系统 (Company Stage Progression)
// 按累计发布数 / 粉丝 / 资金里程碑自动晋级，提升工位上限、基础士气与团队效率。
// ==========================================================================

function currentStageIndex() {
    return Math.min(COMPANY_STAGES.length - 1, Math.max(0, gameState.companyStage || 0));
}

function currentStage() {
    return COMPANY_STAGES[currentStageIndex()];
}

function nextStage() {
    const idx = currentStageIndex();
    return idx < COMPANY_STAGES.length - 1 ? COMPANY_STAGES[idx + 1] : null;
}

// 当前阶段的工位上限
function stageSlotCap() {
    return currentStage().slotCap;
}

// 当前阶段的团队效率加成（叠加在个人效率上）
function stageEfficiencyBonus() {
    return currentStage().efficiencyBonus;
}

// 当前阶段的基础士气加成（计入有效士气）
function stageMoraleBonus() {
    return currentStage().moraleBonus;
}

// 当前阶段可同时运行的「并行辅助项目」数量上限（主项目之外）
// 独立作坊/新生工作室：0；正规化企业：1；行业巨头：2
function stageParallelCap() {
    const caps = [0, 0, 1, 2];
    return caps[currentStageIndex()] || 0;
}

// 计算晋级到下一阶段的逐条资格（手动晋级用）
function getStageUpEligibility() {
    const next = nextStage();
    if (!next) return { next: null, conditions: [], allMet: false, isMax: true };
    const req = next.require;
    const conditions = [
        { label: "累计发布游戏", current: gameState.releases.length, need: req.releases, unit: "款", met: gameState.releases.length >= req.releases },
        { label: "总粉丝数", current: gameState.fans, need: req.fans, unit: "人", met: gameState.fans >= req.fans },
        { label: "工作室资金", current: Math.round(gameState.funds), need: req.funds, unit: "¥", met: gameState.funds >= req.funds }
    ].filter(c => c.need > 0); // 门槛为 0 的条件不展示
    const allMet = conditions.every(c => c.met);
    return { next, conditions, allMet, isMax: false };
}

// 打开晋级评估弹窗
function openStageUpModal() {
    if (typeof playSFX === "function") playSFX("click");
    const elig = getStageUpEligibility();
    const modal = document.getElementById("stageup-modal");
    const titleEl = document.getElementById("stageup-modal-title");
    const bodyEl = document.getElementById("stageup-modal-body");
    const btn = document.getElementById("stageup-confirm-btn");
    const cur = currentStage();

    if (elig.isMax) {
        titleEl.innerHTML = `<i class="fa-solid fa-crown"></i> 已达最高阶段`;
        bodyEl.innerHTML = `<p style="text-align:center; color:var(--accent-pink); padding:1rem 0;">「${cur.name}」已是行业之巅，无更高阶段可晋级。</p>`;
        btn.style.display = "none";
        modal.classList.add("active");
        return;
    }

    const next = elig.next;
    titleEl.innerHTML = `<i class="${next.icon}"></i> 申请晋级：${next.name}`;
    const rows = elig.conditions.map(c => {
        const curText = c.unit === "¥" ? `¥${c.current.toLocaleString()}` : `${c.current.toLocaleString()}${c.unit}`;
        const needText = c.unit === "¥" ? `¥${c.need.toLocaleString()}` : `${c.need.toLocaleString()}${c.unit}`;
        const icon = c.met
            ? `<i class="fa-solid fa-circle-check" style="color:var(--accent-neon);"></i>`
            : `<i class="fa-solid fa-circle-xmark" style="color:var(--accent-pink);"></i>`;
        return `
            <div class="stageup-cond ${c.met ? 'met' : 'unmet'}">
                <span class="stageup-cond-icon">${icon}</span>
                <span class="stageup-cond-label">${c.label}</span>
                <span class="stageup-cond-val">${curText} / ${needText}</span>
            </div>`;
    }).join("");

    bodyEl.innerHTML = `
        <p class="stageup-from-to">
            <span style="color:${cur.color};"><i class="${cur.icon}"></i> ${cur.name}</span>
            <i class="fa-solid fa-arrow-right-long" style="margin:0 0.6rem; color:var(--text-secondary);"></i>
            <span style="color:${next.color};"><i class="${next.icon}"></i> ${next.name}</span>
        </p>
        <p class="stageup-desc">${next.desc}</p>
        <div class="stageup-perks">
            <span>工位上限 <b>${cur.slotCap}→${next.slotCap}</b></span>
            <span>基础士气 <b style="color:var(--accent-neon);">+${next.moraleBonus}</b></span>
            <span>团队效率 <b style="color:var(--accent-yellow);">+${Math.round(next.efficiencyBonus * 100)}%</b></span>
        </div>
        <div class="stageup-conds">${rows}</div>
        ${elig.allMet
            ? `<p style="text-align:center; color:var(--accent-neon); font-size:0.85rem;">✦ 全部条件达标，可立即晋级！</p>`
            : `<p style="text-align:center; color:var(--accent-pink); font-size:0.85rem;">尚有条件未满足，继续经营后再来申请。</p>`}
    `;

    btn.style.display = "";
    btn.disabled = !elig.allMet;
    btn.classList.toggle("ready", elig.allMet);
    modal.classList.add("active");
}

function closeStageUpModal() {
    if (typeof playSFX === "function") playSFX("click");
    document.getElementById("stageup-modal").classList.remove("active");
}

// 确认晋级（仅在资格达标时生效）
function confirmStageUp() {
    const elig = getStageUpEligibility();
    if (!elig.allMet || !elig.next) return;

    gameState.companyStage = currentStageIndex() + 1;
    const stage = currentStage();
    applyStageBodyClass();
    addChronicleEntry(`🏛️ 公司晋级成功！「${stage.name}」阶段开启——${stage.desc}`);
    saveGame();
    updateStatsUI();
    loadOfficeDesks();

    document.getElementById("stageup-modal").classList.remove("active");
    playStageUpEffect(stage);
}

// 晋级成功特效：全屏光爆 + 阶段铭牌 + 礼花粒子
function playStageUpEffect(stage) {
    if (typeof playSFX === "function") playSFX("upgrade");
    const fx = document.getElementById("stageup-fx");
    if (!fx) return;

    // 礼花粒子
    const colors = ["#00f0ff", "#d946ef", "#fbbf24", "#10b981", "#ffffff"];
    let confetti = "";
    for (let i = 0; i < 36; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const dur = 1.2 + Math.random() * 0.9;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 8;
        const rot = Math.random() * 360;
        confetti += `<span class="stageup-confetti" style="left:${left}%; width:${size}px; height:${size}px; background:${color}; animation-delay:${delay}s; animation-duration:${dur}s; transform:rotate(${rot}deg);"></span>`;
    }

    fx.innerHTML = `
        <div class="stageup-burst"></div>
        <div class="stageup-plaque" style="--stage-color:${stage.color};">
            <i class="${stage.icon}"></i>
            <div class="stageup-plaque-sub">公司晋级</div>
            <div class="stageup-plaque-name">${stage.name}</div>
        </div>
        ${confetti}
    `;
    fx.classList.add("active");
    setTimeout(() => {
        fx.classList.remove("active");
        fx.innerHTML = "";
    }, 2600);
}

// 根据阶段切换页面背景氛围
function applyStageBodyClass() {
    const idx = currentStageIndex();
    document.body.classList.remove("stage-0", "stage-1", "stage-2", "stage-3");
    document.body.classList.add(`stage-${idx}`);
}

function showStageUpModal(stage) {
    if (typeof playSFX === "function") playSFX("upgrade");
    const msg = `
        <div style="text-align:center; display:flex; flex-direction:column; gap:0.6rem;">
            <div style="font-size:2.2rem; color:${stage.color};"><i class="${stage.icon}"></i></div>
            <div style="font-size:1.2rem; font-weight:800; color:${stage.color};">${stage.name}</div>
            <p style="font-size:0.88rem; color:var(--text-secondary); line-height:1.5; margin:0;">${stage.desc}</p>
            <div style="display:flex; justify-content:center; gap:1.2rem; font-size:0.8rem; margin-top:0.4rem;">
                <span>工位上限 <b style="color:#fff;">${stage.slotCap}</b></span>
                <span>基础士气 <b style="color:var(--accent-neon);">+${stage.moraleBonus}</b></span>
                <span>团队效率 <b style="color:var(--accent-yellow);">+${Math.round(stage.efficiencyBonus * 100)}%</b></span>
            </div>
        </div>`;
    alert(msg, "🎉 公司发展里程碑");
}

// 渲染运营简报里的阶段进度
function renderStageBrief() {
    const stage = currentStage();
    const stageNameEl = document.getElementById("aside-stage-name");
    if (stageNameEl) {
        stageNameEl.innerHTML = `<i class="${stage.icon}"></i> ${stage.name}`;
        stageNameEl.style.color = stage.color;
    }
    const btn = document.getElementById("aside-stageup-btn");
    const progEl = document.getElementById("aside-stage-next");
    if (!progEl) return;
    const next = nextStage();
    if (!next) {
        progEl.innerText = "已达最高阶段";
        progEl.style.color = "var(--accent-pink)";
        if (btn) btn.style.display = "none";
        return;
    }
    if (btn) {
        btn.style.display = "";
        const ready = getStageUpEligibility().allMet;
        btn.classList.toggle("ready", ready);
        btn.innerHTML = ready
            ? `<i class="fa-solid fa-arrow-trend-up"></i> 可晋级「${next.name}」！`
            : `<i class="fa-solid fa-arrow-trend-up"></i> 申请晋级公司阶段`;
    }
    const req = next.require;
    const parts = [];
    if (gameState.releases.length < req.releases) parts.push(`作品 ${gameState.releases.length}/${req.releases}`);
    if (gameState.fans < req.fans) parts.push(`粉丝 ${Math.round(gameState.fans / 1000)}k/${Math.round(req.fans / 1000)}k`);
    if (gameState.funds < req.funds) parts.push(`资金 ${Math.round(gameState.funds / 1000)}k/${Math.round(req.funds / 1000)}k`);
    progEl.innerText = parts.length ? `距「${next.name}」：${parts.join("，")}` : `可晋级「${next.name}」`;
    progEl.style.color = parts.length ? "var(--text-secondary)" : "var(--accent-neon)";
}
