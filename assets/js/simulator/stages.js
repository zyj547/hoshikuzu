// ==========================================================================
// Company stage progression.
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

function stageSlotCap() {
    return currentStage().slotCap;
}

function stageEfficiencyBonus() {
    return currentStage().efficiencyBonus;
}

function stageMoraleBonus() {
    return currentStage().moraleBonus;
}

function stageParallelCap() {
    const caps = [0, 0, 1, 2];
    const base = caps[currentStageIndex()] || 0;
    const talentBonus = typeof founderParallelBonus === "function" ? founderParallelBonus() : 0;
    return base > 0 ? base + talentBonus : 0;
}

function getStageUpEligibility() {
    const next = nextStage();
    if (!next) return { next: null, conditions: [], allMet: false, isMax: true };
    const req = next.require;
    const conditions = [
        { label: "累计发布游戏", current: gameState.releases.length, need: req.releases, unit: "款", met: gameState.releases.length >= req.releases },
        { label: "总粉丝数", current: gameState.fans, need: req.fans, unit: "人", met: gameState.fans >= req.fans },
        { label: "工作室资金", current: Math.round(gameState.funds), need: req.funds, unit: "¥", met: gameState.funds >= req.funds }
    ].filter(c => c.need > 0);
    return { next, conditions, allMet: conditions.every(c => c.met), isMax: false };
}

function formatStageValue(value, unit) {
    if (unit === "¥") return `¥${Number(value || 0).toLocaleString()}`;
    return `${Number(value || 0).toLocaleString()}${unit}`;
}

function openStageUpModal() {
    if (typeof playSFX === "function") playSFX("click");
    const elig = getStageUpEligibility();
    const modal = document.getElementById("stageup-modal");
    const titleEl = document.getElementById("stageup-modal-title");
    const bodyEl = document.getElementById("stageup-modal-body");
    const btn = document.getElementById("stageup-confirm-btn");
    const cur = currentStage();
    if (!modal || !titleEl || !bodyEl || !btn) return;

    if (elig.isMax) {
        titleEl.innerHTML = `<i class="fa-solid fa-crown"></i> 已达最高阶段`;
        bodyEl.innerHTML = `<p style="text-align:center; color:var(--accent-pink); padding:1rem 0;">《${cur.name}》已经是行业顶点，暂无更高阶段可晋级。</p>`;
        btn.style.display = "none";
        modal.classList.add("active");
        return;
    }

    const next = elig.next;
    titleEl.innerHTML = `<i class="${next.icon}"></i> 申请晋级：${next.name}`;
    const rows = elig.conditions.map(c => {
        const icon = c.met
            ? `<i class="fa-solid fa-circle-check" style="color:var(--accent-neon);"></i>`
            : `<i class="fa-solid fa-circle-xmark" style="color:var(--accent-pink);"></i>`;
        return `
            <div class="stageup-cond ${c.met ? "met" : "unmet"}">
                <span class="stageup-cond-icon">${icon}</span>
                <span class="stageup-cond-label">${c.label}</span>
                <span class="stageup-cond-val">${formatStageValue(c.current, c.unit)} / ${formatStageValue(c.need, c.unit)}</span>
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
    document.getElementById("stageup-modal")?.classList.remove("active");
}

function confirmStageUp() {
    const elig = getStageUpEligibility();
    if (!elig.allMet || !elig.next) return;

    gameState.companyStage = currentStageIndex() + 1;
    const stage = currentStage();
    applyStageBodyClass();
    addChronicleEntry(`🏢 公司晋级成功！《${stage.name}》阶段开启，${stage.desc}`);
    saveGame();
    updateStatsUI();
    loadOfficeDesks();

    const hero = document.getElementById("stage-hero");
    if (hero) {
        hero.classList.remove("upgraded");
        void hero.offsetWidth;
        hero.classList.add("upgraded");
    }

    document.getElementById("stageup-modal")?.classList.remove("active");
    playStageUpEffect(stage);
}

function playStageUpEffect(stage) {
    if (typeof playSFX === "function") playSFX("upgrade");
    const fx = document.getElementById("stageup-fx");
    if (!fx) return;

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
    alert(msg, "公司发展里程碑");
}

function renderStageBrief() {
    const stage = currentStage();
    const idx = currentStageIndex();
    const topChip = document.getElementById("top-stage-chip");
    if (topChip) {
        topChip.className = `top-stage-chip stage-chip-${idx}`;
        topChip.innerHTML = `<i class="${stage.icon}"></i> ${stage.name}`;
        topChip.style.color = stage.color;
    }

    const hero = document.getElementById("stage-hero");
    if (hero) {
        hero.className = `stage-hero stage-hero-${idx}`;
        hero.style.setProperty("--stage-color", stage.color);
        const heroIcon = document.getElementById("stage-hero-icon");
        const heroName = document.getElementById("stage-hero-name");
        const heroDesc = document.getElementById("stage-hero-desc");
        const heroSlots = document.getElementById("stage-hero-slots");
        const heroMorale = document.getElementById("stage-hero-morale");
        const heroEff = document.getElementById("stage-hero-eff");
        if (heroIcon) {
            heroIcon.innerHTML = `<i class="${stage.icon}"></i>`;
            heroIcon.style.color = stage.color;
        }
        if (heroName) {
            heroName.innerText = stage.name;
            heroName.style.color = stage.color;
        }
        if (heroDesc) heroDesc.innerText = stage.desc;
        if (heroSlots) heroSlots.innerText = `工位 ${stage.slotCap}`;
        if (heroMorale) heroMorale.innerText = `士气 +${stage.moraleBonus}`;
        if (heroEff) heroEff.innerText = `效率 +${Math.round(stage.efficiencyBonus * 100)}%`;
    }

    const stageNameEl = document.getElementById("aside-stage-name");
    if (stageNameEl) {
        stageNameEl.className = `list-val stage-badge stage-badge-${idx}`;
        stageNameEl.innerHTML = `<i class="${stage.icon}"></i><span>${stage.name}</span>`;
        stageNameEl.style.color = stage.color;
    }

    const btn = document.getElementById("aside-stageup-btn");
    const progEl = document.getElementById("aside-stage-next");
    if (!progEl) return;
    const next = nextStage();
    if (!next) {
        progEl.innerHTML = `
            <span class="stage-progress-line max"><i class="fa-solid fa-crown"></i> 已达最高阶段</span>
            <span class="stage-bonus-row">工位 ${stage.slotCap} · 士气 +${stage.moraleBonus} · 效率 +${Math.round(stage.efficiencyBonus * 100)}%</span>`;
        progEl.style.color = "var(--accent-pink)";
        if (btn) btn.style.display = "none";
        return;
    }

    if (btn) {
        btn.style.display = "";
        const ready = getStageUpEligibility().allMet;
        btn.classList.toggle("ready", ready);
        btn.innerHTML = ready
            ? `<i class="fa-solid fa-arrow-trend-up"></i> 可晋级《${next.name}》！`
            : `<i class="fa-solid fa-arrow-trend-up"></i> 申请晋级公司阶段`;
    }

    const req = next.require;
    const parts = [];
    if (gameState.releases.length < req.releases) parts.push(`作品 ${gameState.releases.length}/${req.releases}`);
    if (gameState.fans < req.fans) parts.push(`粉丝 ${Math.round(gameState.fans / 1000)}k/${Math.round(req.fans / 1000)}k`);
    if (gameState.funds < req.funds) parts.push(`资金 ${Math.round(gameState.funds / 1000)}k/${Math.round(req.funds / 1000)}k`);
    progEl.innerHTML = parts.length
        ? `<span class="stage-progress-line">距《${next.name}》：${parts.join("，")}</span>
           <span class="stage-bonus-row">当前加成：工位 ${stage.slotCap} · 士气 +${stage.moraleBonus} · 效率 +${Math.round(stage.efficiencyBonus * 100)}%</span>`
        : `<span class="stage-progress-line ready"><i class="fa-solid fa-circle-up"></i> 可晋级《${next.name}》</span>
           <span class="stage-bonus-row">晋级后：工位 ${next.slotCap} · 士气 +${next.moraleBonus} · 效率 +${Math.round(next.efficiencyBonus * 100)}%</span>`;
    progEl.style.color = parts.length ? "" : "var(--accent-neon)";
}
