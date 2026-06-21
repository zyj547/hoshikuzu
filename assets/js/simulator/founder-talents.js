// ==========================================================================
// 创始人专长树 (Founder Talent Tree)
// 创始人发行主项目获得经验升级，每级 1 专长点，可投入四条分支（被动 + 主动）。
// ==========================================================================

function founderXpForNext() {
    return (gameState.founderLevel || 1) * 100;
}

// 主导项目发行后获得经验（在 releaseGame 主项目路径调用）
function gainFounderXp(amount) {
    const titleBefore = founderTitle().name;
    gameState.founderXp = (gameState.founderXp || 0) + Math.max(0, Math.round(amount));
    let leveled = 0;
    while (gameState.founderXp >= founderXpForNext()) {
        gameState.founderXp -= founderXpForNext();
        gameState.founderLevel++;
        gameState.talentPoints = (gameState.talentPoints || 0) + 1;
        leveled++;
    }
    if (leveled > 0) {
        addChronicleEntry(`🌟 创始人成长至 Lv.${gameState.founderLevel}，获得 ${leveled} 点专长点！`);
        if (typeof playSFX === "function") playSFX("upgrade");
        const titleAfter = founderTitle().name;
        if (titleAfter !== titleBefore) {
            addChronicleEntry(`🎖️ 创始人晋升为【${titleAfter}】！`);
        }
    }
}

function talentLevel(key) {
    return (gameState.talents && gameState.talents[key]) || 0;
}

function upgradeTalent(key) {
    if (!FOUNDER_TALENTS[key]) return;
    if ((gameState.talentPoints || 0) < 1) { alert("专长点不足！发行更多作品提升创始人等级可获得专长点。"); return; }
    if (talentLevel(key) >= FOUNDER_TALENT_MAX) { alert("该专长已达满级。"); return; }
    gameState.talentPoints--;
    gameState.talents[key] = talentLevel(key) + 1;
    if (typeof playSFX === "function") playSFX("success");
    addChronicleEntry(`📈 创始人专长【${FOUNDER_TALENTS[key].name}】提升至 Lv.${gameState.talents[key]}。`);
    saveGame();
    updateStatsUI();
    renderFounderPanel();
}

// ── 效果接口（供各系统调用）──
function founderDevBonus() { return 1 + talentLevel("management") * 0.08; }
function founderParallelBonus() { return talentLevel("management") >= FOUNDER_TALENT_MAX ? 1 : 0; }
function founderHiringMult() { return Math.max(0.4, 1 - talentLevel("leadership") * 0.10); }
function founderSsrBonus() { return talentLevel("leadership") * 0.03; }
function founderPublisherBonus() { return talentLevel("business") * 0.05; }
function founderTrendPredictUnlocked() { return talentLevel("business") >= 1; }

// 创意激发：消耗在下次发行的评分加成（armed 时返回乘数，否则 1）
function founderCreativeMultiplier() {
    if (!gameState.creativeArmed) return 1;
    return 1 + 0.05 + talentLevel("creative") * 0.03;
}
function consumeCreativeSpark() {
    if (gameState.creativeArmed) gameState.creativeArmed = false;
}

// 创意激发冷却递减（weeklyStep 调用）
function tickCreativeCooldown() {
    if (gameState.creativeCooldown > 0) gameState.creativeCooldown = Math.max(0, gameState.creativeCooldown - 1);
}

function creativeCooldownWeeks() {
    return Math.max(4, 16 - talentLevel("creative") * 3);
}

function activateCreativeSpark() {
    if (talentLevel("creative") < 1) { alert("尚未学习【创意激发】专长。"); return; }
    if (gameState.creativeCooldown > 0) { alert(`【创意激发】冷却中，还需 ${gameState.creativeCooldown} 周。`); return; }
    if (gameState.creativeArmed) { alert("【创意激发】已激活，将在下次发行时生效。"); return; }
    gameState.creativeArmed = true;
    gameState.creativeCooldown = creativeCooldownWeeks();
    if (typeof playSFX === "function") playSFX("success");
    addChronicleEntry(`✨ 创始人施展【创意激发】，下一款作品将迸发灵感火花！`);
    saveGame();
    renderFounderPanel();
    alert("✨ 创意激发已就绪！下一款发行作品评分将获得加成。");
}

// ── 专长面板渲染 ──
function renderFounderPanel() {
    const container = document.getElementById("founder-talents");
    if (!container) return;

    // 头部：等级 / 经验 / 专长点
    const lvEl = document.getElementById("founder-level");
    const xpBar = document.getElementById("founder-xp-bar");
    const xpText = document.getElementById("founder-xp-text");
    const tpEl = document.getElementById("founder-tp");
    const bg = gameState.founderBackground ? FOUNDER_BACKGROUNDS[gameState.founderBackground] : null;
    const ft = founderTitle();
    if (lvEl) lvEl.innerHTML = `${bg ? `<i class="${bg.icon}" style="color:${bg.color};"></i> ${bg.name} · ` : ""}<i class="${ft.icon}" style="color:${ft.color};"></i> ${ft.name} · Lv.${gameState.founderLevel}`;
    if (xpBar) xpBar.style.width = `${Math.min(100, (gameState.founderXp / founderXpForNext()) * 100)}%`;
    if (xpText) xpText.innerText = `${gameState.founderXp} / ${founderXpForNext()} XP`;
    if (tpEl) tpEl.innerText = gameState.talentPoints || 0;

    container.innerHTML = "";
    Object.keys(FOUNDER_TALENTS).forEach(key => {
        const t = FOUNDER_TALENTS[key];
        const lv = talentLevel(key);
        const maxed = lv >= FOUNDER_TALENT_MAX;
        const canUp = (gameState.talentPoints || 0) >= 1 && !maxed;

        // 创意激发额外的主动技能按钮
        let activeBtn = "";
        if (key === "creative" && lv >= 1) {
            if (gameState.creativeArmed) {
                activeBtn = `<button class="talent-active-btn armed" disabled><i class="fa-solid fa-bolt"></i> 已激活·待发行</button>`;
            } else if (gameState.creativeCooldown > 0) {
                activeBtn = `<button class="talent-active-btn" disabled><i class="fa-solid fa-hourglass-half"></i> 冷却 ${gameState.creativeCooldown} 周</button>`;
            } else {
                activeBtn = `<button class="talent-active-btn ready" onclick="activateCreativeSpark()"><i class="fa-solid fa-wand-magic-sparkles"></i> 施展技能</button>`;
            }
        }

        const pips = Array.from({ length: FOUNDER_TALENT_MAX }, (_, i) =>
            `<span class="talent-pip ${i < lv ? 'on' : ''}" style="--pip:${t.color};"></span>`).join("");

        const card = document.createElement("div");
        card.className = "talent-card";
        card.innerHTML = `
            <div class="talent-head">
                <span class="talent-icon" style="color:${t.color};"><i class="${t.icon}"></i></span>
                <div class="talent-titles">
                    <span class="talent-name">${t.name} <span class="talent-type">${t.type}</span></span>
                    <span class="talent-pips">${pips}</span>
                </div>
            </div>
            <p class="talent-desc">${t.desc}</p>
            <p class="talent-level-desc">${lv > 0 ? `当前：${t.levelDesc(lv)}` : `未学习`}${!maxed ? `<br><span style="opacity:0.7;">下一级：${t.levelDesc(lv + 1)}</span>` : ` · 已满级`}</p>
            <div class="talent-actions">
                <button class="talent-up-btn" ${canUp ? "" : "disabled"} onclick="upgradeTalent('${key}')">${maxed ? "已满级" : "投入 1 专长点"}</button>
                ${activeBtn}
            </div>`;
        container.appendChild(card);
    });
}
