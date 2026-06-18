// ==========================================================================
// 立项与卡片化研发引擎 (Card-Driven R&D Engine)
// ==========================================================================
let selectedPlatform = "Mobile";
let selectedGenre = "Casual";
let selectedTopic = "Laborer";

function getSystemsDiscount() {
    let systemsDiscount = 0;
    gameState.employees.forEach(emp => {
        if (emp.specialty === "systems") systemsDiscount += 0.15;
    });
    return Math.min(systemsDiscount, 0.30);
}

// 破产老兵：所有资金消耗 -10%
function founderCostMultiplier() {
    return gameState.founderBackground === "veteran" ? 0.9 : 1.0;
}

function calculateProjectCost(platformKey = selectedPlatform, genreKey = selectedGenre, topicKey = selectedTopic) {
    const systemsDiscount = getSystemsDiscount();
    const costMult = founderCostMultiplier();
    const platformCost = Math.round(PLATFORMS_DATA[platformKey].cost * (1 - systemsDiscount) * costMult);
    const genreCost = Math.round(GENRES_DATA[genreKey].cost * costMult);
    const topicCost = Math.round(TOPICS_DATA[topicKey].cost * costMult);
    return {
        platformCost,
        genreCost,
        topicCost,
        totalCost: platformCost + genreCost + topicCost + Math.round(1000 * costMult),
        systemsDiscount
    };
}

function calculateTeamFit(genreKey = selectedGenre) {
    const ratio = GENRES_DATA[genreKey].ratio;
    const totals = gameState.employees.reduce((sum, emp) => {
        sum.code += emp.stats.code;
        sum.art += emp.stats.art;
        sum.design += emp.stats.design;
        return sum;
    }, { code: 0, art: 0, design: 0 });
    const totalPower = Math.max(1, totals.code + totals.art + totals.design);
    const actual = {
        code: totals.code / totalPower,
        art: totals.art / totalPower,
        design: totals.design / totalPower
    };
    const distance = Math.abs(actual.code - ratio.code)
        + Math.abs(actual.art - ratio.art)
        + Math.abs(actual.design - ratio.design);
    const fit = Math.max(0.35, 1 - distance * 0.85);
    return { fit, totalPower, actual, ratio };
}

function employeeEfficiency(emp) {
    // 公司阶段提供基础士气加成
    const stageMorale = typeof stageMoraleBonus === "function" ? stageMoraleBonus() : 0;
    const effMorale = Math.min(100, (emp.morale == null ? 75 : emp.morale) + stageMorale);
    const moraleFactor = 0.75 + (effMorale / 100) * 0.35;
    const fatiguePenalty = 1 - ((emp.fatigue || 0) / 100) * 0.45;
    const stageEff = typeof stageEfficiencyBonus === "function" ? stageEfficiencyBonus() : 0;
    return Math.max(0.35, moraleFactor * fatiguePenalty * (1 + stageEff));
}

function factorTone(value, goodAt = 1, warnAt = 0.75) {
    if (value >= goodAt) return "good";
    if (value >= warnAt) return "warn";
    return "risk";
}

// 市场疲劳度：最近连续发布同类游戏会让评分衰减
function marketFatiguePenalty(genreKey) {
    const recent = (gameState.recentGenres || []).slice(-BALANCE.marketFatigueWindow);
    const sameCount = recent.filter(g => g === genreKey).length;
    return 1 - sameCount * BALANCE.fatigueDecayPerMarketGame;
}

function estimateProjectPlan() {
    const cost = calculateProjectCost();
    const fit = calculateTeamFit();
    const platform = PLATFORMS_DATA[selectedPlatform];
    const topic = TOPICS_DATA[selectedTopic];
    const hasTopicMatch = topic.bestGenres.includes(selectedGenre);
    const trendHits = (gameState.activeTrend.genre === selectedGenre ? 1 : 0)
        + (gameState.activeTrend.topic === selectedTopic ? 1 : 0);
    const monthlyWages = gameState.employees.reduce((sum, emp) => sum + emp.salary, 0);
    const runwayWeeks = Math.max(0, Math.floor((gameState.funds - cost.totalCost) / Math.max(1, monthlyWages / 4 + BALANCE.weeklyRent)));
    const fatigueMul = marketFatiguePenalty(selectedGenre);
    const estimatedScore = Math.min(9.9, Math.max(3.0, (
        (fit.totalPower / (platform.scale * 130)) * 5.8 * fit.fit
        * (hasTopicMatch ? 1.12 : 0.96)
        * (1 + trendHits * 0.08)
        * fatigueMul
    )));
    return { cost, fit, hasTopicMatch, trendHits, runwayWeeks, estimatedScore, fatigueMul };
}

function renderProjectPreview() {
    const box = document.getElementById("project-preview");
    if (!box) return;
    const plan = estimateProjectPlan();
    const cashAfter = gameState.funds - plan.cost.totalCost;
    const fitPct = Math.round(plan.fit.fit * 100);
    const scoreText = plan.estimatedScore.toFixed(1);
    const runwayTone = cashAfter < 0 ? "risk" : plan.runwayWeeks < 8 ? "warn" : "good";
    const scoreTone = factorTone(plan.estimatedScore / 9.0, 0.82, 0.62);
    const fatigueWarn = plan.fatigueMul < 1 ? `市场疲劳！连续同类作品评分 -${Math.round((1 - plan.fatigueMul) * 100)}%。` : "";
    box.innerHTML = `
        <div class="preview-metric">
            <span class="preview-label">预算</span>
            <span class="preview-value ${cashAfter < 0 ? 'risk' : 'good'}">¥${plan.cost.totalCost.toLocaleString()}</span>
        </div>
        <div class="preview-metric">
            <span class="preview-label">团队适配</span>
            <span class="preview-value ${factorTone(plan.fit.fit, 0.82, 0.65)}">${fitPct}%</span>
        </div>
        <div class="preview-metric">
            <span class="preview-label">预估口碑</span>
            <span class="preview-value ${scoreTone}">${scoreText}</span>
        </div>
        <div class="preview-metric">
            <span class="preview-label">现金余量</span>
            <span class="preview-value ${runwayTone}">${cashAfter >= 0 ? `${plan.runwayWeeks} 周` : '不足'}</span>
        </div>
        <div class="preview-note">
            ${plan.hasTopicMatch ? '题材与类型契合。' : '题材契合度一般，可能拖累口碑。'}
            ${plan.trendHits > 0 ? `命中 ${plan.trendHits} 个当前趋势。` : '未命中当前趋势。'}
            ${plan.cost.systemsDiscount > 0 ? `系统策划已省 ${Math.round(plan.cost.systemsDiscount * 100)}% 平台成本。` : ''}
            ${fatigueWarn ? `<span style="color:var(--accent-pink);">${fatigueWarn}</span>` : ''}
        </div>
    `;
}

function setupDevelopForm() {
    const platContainer = document.getElementById("dev-platforms");
    platContainer.innerHTML = "";
    gameState.unlockedPlatforms.forEach(platKey => {
        const plat = PLATFORMS_DATA[platKey];
        const btn = document.createElement("button");
        btn.className = `select-btn ${selectedPlatform === platKey ? 'selected' : ''}`;
        btn.onclick = () => { selectedPlatform = platKey; setupDevelopForm(); };
        btn.innerHTML = `<span><i class="${plat.icon}"></i> ${plat.name}</span><span class="btn-cost">配额金 ¥${plat.cost}</span>`;
        platContainer.appendChild(btn);
    });

    const genreContainer = document.getElementById("dev-genres");
    genreContainer.innerHTML = "";
    gameState.unlockedGenres.forEach(genreKey => {
        const genre = GENRES_DATA[genreKey];
        const btn = document.createElement("button");
        btn.className = `select-btn ${selectedGenre === genreKey ? 'selected' : ''}`;
        btn.onclick = () => { selectedGenre = genreKey; setupDevelopForm(); };
        btn.innerHTML = `<span><i class="${genre.icon}"></i> ${genre.name}</span><span class="btn-cost">配额金 ¥${genre.cost}</span>`;
        genreContainer.appendChild(btn);
    });

    const topicContainer = document.getElementById("dev-topics");
    topicContainer.innerHTML = "";
    gameState.unlockedTopics.forEach(topicKey => {
        const topic = TOPICS_DATA[topicKey];
        const btn = document.createElement("button");
        btn.className = `select-btn ${selectedTopic === topicKey ? 'selected' : ''}`;
        btn.onclick = () => { selectedTopic = topicKey; setupDevelopForm(); };
        btn.innerHTML = `<span><i class="${topic.icon}"></i> ${topic.name}</span><span class="btn-cost">可选题材</span>`;
        topicContainer.appendChild(btn);
    });

    renderProjectPreview();

    // 并行辅助项目按钮：仅在公司阶段解锁并行产能时显示
    const auxBtn = document.getElementById("btn-start-aux");
    const auxHint = document.getElementById("aux-cap-hint");
    const cap = typeof stageParallelCap === "function" ? stageParallelCap() : 0;
    if (auxBtn && auxHint) {
        const used = (gameState.auxProjects || []).length;
        if (cap > 0) {
            auxBtn.style.display = "";
            auxHint.style.display = "";
            const full = used >= cap;
            auxBtn.disabled = full;
            auxBtn.style.opacity = full ? "0.45" : "";
            auxHint.innerText = `并行辅助项目槽位：${used}/${cap}（${currentStage().name} 阶段）`;
        } else {
            auxBtn.style.display = "none";
            auxHint.style.display = "block";
            auxHint.innerText = "晋级到「正规化企业」阶段后可解锁并行辅助项目。";
        }
    }
}

function startDevelopment() {
    if (gameState.currentProject) { showDevBoard(); return; }
    const nameInput = document.getElementById("dev-name").value.trim();
    const gameName = nameInput || `桔子秘境 ${Math.floor(Math.random() * 100)}`;
    const { totalCost } = calculateProjectCost();

    if (gameState.funds < totalCost) {
        alert("资金不足以启动该规模的项目开发！");
        return;
    }
    gameState.funds -= totalCost;

    const scale = PLATFORMS_DATA[selectedPlatform].scale;
    const cardsNeeded = Math.max(5, Math.round(4 + scale * 1.6)); // 6 ~ 9 张卡

    gameState.currentProject = {
        name: gameName,
        platform: selectedPlatform,
        genre: selectedGenre,
        topic: selectedTopic,
        progress: 0,
        code: 0, art: 0, design: 0, bugs: 0,
        cardsResolved: 0,
        cardsNeeded,
        polishWeeksLeft: 0,
        rushPenalty: false,
        state: "developing"
    };

    addChronicleEntry(`🚀 新项目《${gameName}》立项启动！平台【${PLATFORMS_DATA[selectedPlatform].name}】，类型【${GENRES_DATA[selectedGenre].name}】，预算 ¥${totalCost.toLocaleString()}。`);
    saveGame();
    updateStatsUI();
    showDevBoard();
}

// ==========================================================================
// 研发期：员工自动产出研发点数（每周由 weeklyStep 调用，不增长进度）
// ==========================================================================
// 向某个项目注入一周的研发点数（rate 为团队产能占比，辅助项目额外打折）
function addProjectPoints(proj, rate) {
    gameState.employees.forEach(emp => {
        const eff = employeeEfficiency(emp);
        const isFounder = emp.id === "player";
        let codeGen = 0, artGen = 0, desGen = 0;

        if (emp.role === "programmer") {
            codeGen = ((emp.stats.code * 0.4) + Math.random() * 4) * eff;
            desGen = (emp.stats.design * 0.1) * eff;
            if (emp.specialty === "engine") codeGen *= 1.40;
            if (emp.specialty === "fullstack") { codeGen *= 1.30; desGen += codeGen * 0.30; }
        } else if (emp.role === "artist") {
            artGen = ((emp.stats.art * 0.45) + Math.random() * 4) * eff;
            if (emp.specialty === "concept") artGen *= 1.50;
        } else if (emp.role === "designer") {
            desGen = ((emp.stats.design * 0.45) + Math.random() * 4) * eff;
            codeGen = (emp.stats.code * 0.1) * eff;
            if (emp.specialty === "writer") desGen *= 1.40;
        }
        if (isFounder && gameState.founderBackground === "coder") codeGen *= 1.30;
        if (isFounder && gameState.founderBackground === "artist") artGen *= 1.30;

        proj.code += codeGen * rate;
        proj.art += artGen * rate;
        proj.design += desGen * rate;
    });
}

// 一周的团队疲劳/士气结算（与项目数量无关，只在有研发活动时调用一次）
function applyWeeklyDevFatigue() {
    const fatigueGain = gameState.researchPerks && gameState.researchPerks.workflow ? 2 : 3;
    gameState.employees.forEach(emp => {
        emp.fatigue = Math.min(100, (emp.fatigue || 0) + fatigueGain);
        if (emp.fatigue > 70) emp.morale = Math.max(0, (emp.morale == null ? 75 : emp.morale) - 1);
    });
}

// 主项目（交互式卡片研发）的每周点数累积
function accumulateDevPoints(rate = 1) {
    const proj = gameState.currentProject;
    if (!proj || (proj.state !== "developing" && proj.state !== "polishing")) return;

    if (proj.state === "polishing") {
        proj.polishWeeksLeft = Math.max(0, (proj.polishWeeksLeft || 0) - 1);
        proj.code *= 1.075; proj.art *= 1.075; proj.design *= 1.075;
        if (proj.polishWeeksLeft <= 0) proj.state = "finished";
        return;
    }
    addProjectPoints(proj, rate);
}

// ==========================================================================
// 并行辅助项目（B 组后台自动推进，无需逐卡决策）
// ==========================================================================
function startAuxProject() {
    const cap = typeof stageParallelCap === "function" ? stageParallelCap() : 0;
    if (!gameState.auxProjects) gameState.auxProjects = [];
    if (gameState.auxProjects.length >= cap) {
        alert(`当前阶段最多并行 ${cap} 个辅助项目，已达上限。`);
        return;
    }
    const nameInput = document.getElementById("dev-name").value.trim();
    const gameName = nameInput || `并行企划 ${Math.floor(Math.random() * 100)}`;
    const { totalCost } = calculateProjectCost();
    if (gameState.funds < totalCost) { alert("资金不足以启动该辅助项目！"); return; }
    gameState.funds -= totalCost;

    const scale = PLATFORMS_DATA[selectedPlatform].scale;
    gameState.auxProjects.push({
        name: gameName, platform: selectedPlatform, genre: selectedGenre, topic: selectedTopic,
        progress: 0, code: 0, art: 0, design: 0, bugs: 0,
        cardsResolved: 0, cardsNeeded: Math.max(5, Math.round(4 + scale * 1.6)),
        polishWeeksLeft: 0, rushPenalty: false, isAux: true, state: "developing"
    });
    addChronicleEntry(`🧩 B 组启动并行辅助项目《${gameName}》，将在后台自动推进研发。`);
    saveGame();
    updateStatsUI();
    alert(`辅助项目《${gameName}》已立项！它会在你推进时间时由 B 组自动开发，完成后自动以「自主发行」上线。`);
}

// 每周推进所有辅助项目（rate 为分配到的团队产能）
function tickAuxProjects(rate) {
    const list = gameState.auxProjects || [];
    if (list.length === 0) return;
    const finished = [];

    list.forEach(aux => {
        if (aux.state !== "developing") return;
        // B 组效率折扣
        addProjectPoints(aux, rate * 0.8);
        // 进度自动推进（按团队规模与阶段效率）
        const teamPower = gameState.employees.reduce((s, e) => s + e.stats.code + e.stats.art + e.stats.design, 0);
        aux.progress = Math.min(100, aux.progress + (6 + teamPower * 0.025) * rate);
        // 偶发后台 Bug
        if (Math.random() < 0.12) aux.bugs += 1;
        if (aux.progress >= 100) { aux.progress = 100; aux.state = "finished"; finished.push(aux); }
    });

    // 完成的辅助项目自动以自主发行上线
    finished.forEach(aux => autoReleaseAux(aux));
    if (finished.length > 0) {
        gameState.auxProjects = gameState.auxProjects.filter(a => a.state !== "finished");
    }
}

function autoReleaseAux(aux) {
    const evaluation = buildReleaseEvaluation(aux);
    const finalScore = evaluation.finalScore;
    let writerBonus = 1.0;
    gameState.employees.forEach(emp => { if (emp.specialty === "writer") writerBonus += 0.20; });
    if (gameState.founderBackground === "influencer") writerBonus += 0.20;

    const release = {
        name: aux.name, platform: aux.platform, genre: aux.genre, topic: aux.topic,
        rating: finalScore, weeksSinceRelease: 0, revenueGenerated: 0, publisher: "self",
        fansGained: Math.round(finalScore * finalScore * 25 * evaluation.bonus * writerBonus)
    };
    gameState.releases.unshift(release);
    gameState.fans += release.fansGained;
    gameState.recentGenres = (gameState.recentGenres || []).concat(aux.genre).slice(-5);
    addChronicleEntry(`🧩 并行辅助项目《${aux.name}》后台开发完成，自动自主发行上线！评分 ${finalScore}，新增 ${release.fansGained.toLocaleString()} 粉丝。`);
    if (typeof playSFX === "function") playSFX("success");
}

// ==========================================================================
// 研发看板 (Dev Board) —— 取代旧的进度条小游戏
// ==========================================================================
let currentHandCards = [];
let pendingCard = null;

function projectPhase(proj) {
    const p = proj.cardsResolved / proj.cardsNeeded;
    if (p < 0.34) return "early";
    if (p < 0.7) return "mid";
    return "late";
}

function showDevBoard() {
    const overlay = document.getElementById("development-overlay");
    overlay.classList.add("active");
    const proj = gameState.currentProject;
    document.getElementById("board-game-name").innerText = proj.name;
    document.getElementById("board-game-meta").innerHTML = `
        <i class="${GENRES_DATA[proj.genre].icon}"></i> ${GENRES_DATA[proj.genre].name} |
        <i class="${PLATFORMS_DATA[proj.platform].icon}"></i> ${PLATFORMS_DATA[proj.platform].name}`;
    renderBoardStats();

    if (proj.state === "finished") {
        renderFinishedBoard();
    } else if (proj.state === "polishing") {
        renderPolishingBoard();
    } else {
        // developing：抽 3 张卡（若已有手牌则沿用）
        if (currentHandCards.length === 0) drawHandCards();
        renderHandCards();
    }
}

function renderBoardStats() {
    const proj = gameState.currentProject;
    document.getElementById("board-progress").innerText = `${Math.floor(proj.progress)}%`;
    document.getElementById("board-progress-bar").style.width = `${proj.progress}%`;
    document.getElementById("board-code").innerText = Math.floor(proj.code);
    document.getElementById("board-art").innerText = Math.floor(proj.art);
    document.getElementById("board-design").innerText = Math.floor(proj.design);
    document.getElementById("board-bugs").innerText = Math.floor(proj.bugs);
    const phaseEl = document.getElementById("board-phase");
    const phase = projectPhase(proj);
    const map = { early: ["📐 概念设计阶段", "var(--accent-purple)"], mid: ["⚙️ 核心开发阶段", "var(--accent-neon)"], late: ["✨ 品质打磨阶段", "var(--accent-yellow)"] };
    phaseEl.innerText = map[phase][0];
    phaseEl.style.color = map[phase][1];
}

function drawHandCards() {
    const proj = gameState.currentProject;
    const phase = projectPhase(proj);
    const pool = DEV_CARDS.filter(c =>
        (c.genre === "any" || c.genre === proj.genre) &&
        (c.phase === "any" || c.phase === phase)
    );
    // 退路：阶段卡不足时放宽到全类型同阶段
    let candidates = pool.length >= 3 ? pool : DEV_CARDS.filter(c => c.genre === "any" || c.genre === proj.genre);
    // 随机抽 3 张不重复
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const picked = [];
    const seen = new Set();
    for (const c of shuffled) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        picked.push(c);
        if (picked.length === 3) break;
    }
    currentHandCards = picked;
}

function renderHandCards() {
    document.getElementById("dev-board-cards").style.display = "grid";
    document.getElementById("dev-board-finish").style.display = "none";
    const container = document.getElementById("dev-board-cards");
    container.innerHTML = "";
    document.getElementById("board-hint").innerText = "从下列 3 张开发卡中选择 1 张作为团队接下来的核心任务：";

    currentHandCards.forEach(card => {
        const el = document.createElement("div");
        el.className = "dev-card";
        const genreTag = card.genre === "any" ? "通用" : GENRES_DATA[card.genre].name;
        el.innerHTML = `
            <div class="dev-card-head">
                <span class="dev-card-title">${card.title}</span>
                <span class="dev-card-tag">${genreTag} · ${card.weeks}周</span>
            </div>
            <p class="dev-card-story">${card.story}</p>
            <button class="dev-card-btn">推进至此事件完成 →</button>
        `;
        el.querySelector(".dev-card-btn").onclick = () => commitCard(card);
        container.appendChild(el);
    });
}

// 选定卡片：时间流动 card.weeks 周，员工自动工作，到点弹出结果
function commitCard(card) {
    if (isAdvancing()) return;
    pendingCard = card;
    document.getElementById("board-hint").innerText = `团队正在攻坚《${card.title}》…`;
    document.getElementById("dev-board-cards").style.display = "none";
    startAdvance(card.weeks, "card", () => showCardResult(card));
}

function showCardResult(card) {
    const proj = gameState.currentProject;
    if (!proj) return;
    renderBoardStats();

    const modal = document.getElementById("card-result-modal");
    modal.classList.add("active");
    document.getElementById("card-result-title").innerHTML = `<i class="fa-solid fa-book-open"></i> ${card.title}`;
    document.getElementById("card-result-desc").innerText = card.story;
    const box = document.getElementById("card-result-choices");
    box.innerHTML = "";
    card.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = choice.text;
        btn.onclick = () => resolveCardChoice(card, choice);
        box.appendChild(btn);
    });
}

function resolveCardChoice(card, choice) {
    const proj = gameState.currentProject;
    const bugsBefore = proj.bugs;
    choice.effect(proj);

    // 创始人「重构热情」：代码天才修复 Bug 时回补少量代码点数
    if (gameState.founderBackground === "coder" && proj.bugs < bugsBefore) {
        proj.code += (bugsBefore - proj.bugs) * 2;
    }

    proj.bugs = Math.max(0, Math.round(proj.bugs));
    proj.cardsResolved++;
    proj.progress = Math.min(100, Math.round((proj.cardsResolved / proj.cardsNeeded) * 100));

    document.getElementById("card-result-modal").classList.remove("active");
    addChronicleEntry(`📖 《${proj.name}》：${card.title} —— ${choice.text}`);
    saveGame();
    renderBoardStats();

    if (proj.cardsResolved >= proj.cardsNeeded) {
        proj.progress = 100;
        proj.state = "finished";
        playSFX("success");
        renderFinishedBoard();
    } else {
        // 抽下一组卡
        drawHandCards();
        // 结果旁白
        if (choice.result) {
            alert(choice.result, card.title).then(() => { showDevBoard(); });
        } else {
            showDevBoard();
        }
    }
}

function renderPolishingBoard() {
    document.getElementById("dev-board-cards").style.display = "none";
    const finish = document.getElementById("dev-board-finish");
    finish.style.display = "flex";
    document.getElementById("board-hint").innerText = "品质打磨进行中，时间推进后将自动完成。";
    finish.innerHTML = `
        <p style="color:var(--accent-yellow);">🔧 延期打磨中… 剩余 ${gameState.currentProject.polishWeeksLeft} 周</p>
        <button class="btn-start-dev advance-btn" onclick="startAdvance(${gameState.currentProject.polishWeeksLeft}, 'card', showDevBoard)">推进至打磨完成</button>
    `;
}

function renderFinishedBoard() {
    const proj = gameState.currentProject;
    document.getElementById("dev-board-cards").style.display = "none";
    const finish = document.getElementById("dev-board-finish");
    finish.style.display = "flex";
    document.getElementById("board-hint").innerText = "开发完成！请决定上线策略。";
    const bugsLeft = proj.bugs || 0;
    const rushWarn = bugsLeft > 0 ? `<p style="color:var(--accent-pink);">⚠️ 残留 ${bugsLeft} 个 Bug，强行上线将扣减评分！</p>` : "";
    finish.innerHTML = `
        <p style="color:var(--accent-neon); font-weight:700;">🎉 《${proj.name}》研发完成！</p>
        ${rushWarn}
        <div style="display:flex; gap:0.8rem; flex-wrap:wrap; justify-content:center;">
            <button class="btn-start-dev advance-btn" style="background:linear-gradient(135deg,#fbbf24,#f97316);" onclick="choosePolish()">🔧 延期打磨（+2周，全属性+15%）</button>
            <button class="btn-start-dev" onclick="chooseRelease()">🚀 立即上线${bugsLeft > 0 ? '（有Bug惩罚）' : ''}</button>
        </div>
    `;
    updateAdvanceUI();
}

function choosePolish() {
    const proj = gameState.currentProject;
    proj.state = "polishing";
    proj.polishWeeksLeft = 2;
    saveGame();
    renderPolishingBoard();
}

function chooseRelease() {
    showPublisherModal();
}

// ==========================================================================
// 发行与评测
// ==========================================================================
function releaseGame(publisherType) {
    const proj = gameState.currentProject;
    if (!proj) return;

    let fansMultiplier = 1.0;
    if (publisherType === "tiktok") { gameState.funds += 5000; fansMultiplier = 1.5; }
    else if (publisherType === "steam") { gameState.funds -= 5000; fansMultiplier = 2.5; }

    const evaluation = buildReleaseEvaluation(proj);
    const bonus = evaluation.bonus;
    const finalScore = evaluation.finalScore;
    const reviews = generateReviewComments(proj, finalScore);

    let writerBonusMultiplier = 1.0;
    gameState.employees.forEach(emp => { if (emp.specialty === "writer") writerBonusMultiplier += 0.20; });
    // 网红制作人：发行粉丝 +20%
    if (gameState.founderBackground === "influencer") writerBonusMultiplier += 0.20;

    const release = {
        name: proj.name,
        platform: proj.platform,
        genre: proj.genre,
        topic: proj.topic,
        rating: finalScore,
        weeksSinceRelease: 0,
        revenueGenerated: 0,
        publisher: publisherType,
        fansGained: Math.round(finalScore * finalScore * 25 * bonus * fansMultiplier * writerBonusMultiplier)
    };

    gameState.releases.unshift(release);
    gameState.fans += release.fansGained;
    // 市场疲劳记录
    gameState.recentGenres = (gameState.recentGenres || []).concat(proj.genre).slice(-5);
    gameState.currentProject = null;
    currentHandCards = [];

    const pubNames = { self: "自主发行", tiktok: "抖音独占推广", steam: "Steam签约发行" };
    addChronicleEntry(`🎮 由【${pubNames[publisherType]}】承销的《${release.name}》成功发布，综合评分 ${release.rating}，吸引 ${release.fansGained.toLocaleString()} 名新粉丝！`);

    document.getElementById("development-overlay").classList.remove("active");
    document.getElementById("publisher-modal").classList.remove("active");
    showReviewModal(release, reviews, evaluation);
}

function buildReleaseEvaluation(proj) {
    const totalPoints = proj.code + proj.art + proj.design;
    const platformTarget = PLATFORMS_DATA[proj.platform].scale * 150;
    const topic = TOPICS_DATA[proj.topic];
    const hasTopicMatch = topic.bestGenres.includes(proj.genre);
    const trendGenreHit = gameState.activeTrend.genre === proj.genre;
    const trendTopicHit = gameState.activeTrend.topic === proj.topic;
    const hasAnimator = gameState.employees.some(emp => emp.specialty === "animator");

    let bonus = 1.0;
    if (hasTopicMatch) bonus += 0.2;
    if (trendGenreHit) bonus += 0.15;
    if (trendTopicHit) bonus += 0.15;

    const completionRatio = totalPoints / platformTarget;
    let baseScore = completionRatio * 6 * bonus;

    let animatorMultiplier = 1.0;
    if (hasAnimator && (proj.genre === "Casual" || proj.genre === "Roguelike")) {
        animatorMultiplier = 1.05;
        baseScore *= animatorMultiplier;
    }
    // 艺术大师：所有项目基础评分 +5%
    let founderArtBonus = 1.0;
    if (gameState.founderBackground === "artist") { founderArtBonus = 1.05; baseScore *= founderArtBonus; }

    // 市场疲劳衰减
    const fatigueMul = marketFatiguePenalty(proj.genre);
    baseScore *= fatigueMul;

    if (proj.rushPenalty) baseScore *= 0.92;
    if (proj.bugs > 0) baseScore *= Math.max(0.7, 1 - proj.bugs * 0.03);

    const unclampedScore = baseScore;
    if (baseScore > 9.9) baseScore = 9.9;
    if (baseScore < 3.0) baseScore = 3.0 + Math.random() * 2;
    const finalScore = parseFloat(baseScore.toFixed(1));

    return {
        finalScore,
        bonus,
        factors: [
            { label: "完成度", value: `${Math.round(completionRatio * 100)}%`, tone: factorTone(completionRatio, 0.95, 0.65), desc: `${Math.round(totalPoints)} 点产出 / ${Math.round(platformTarget)} 平台目标` },
            { label: "题材契合", value: hasTopicMatch ? "+20%" : "一般", tone: hasTopicMatch ? "good" : "warn", desc: `${TOPICS_DATA[proj.topic].name} ${hasTopicMatch ? "适合" : "不太适合"} ${GENRES_DATA[proj.genre].name}` },
            { label: "趋势加成", value: `+${(trendGenreHit ? 15 : 0) + (trendTopicHit ? 15 : 0)}%`, tone: trendGenreHit || trendTopicHit ? "good" : "warn", desc: trendGenreHit || trendTopicHit ? "命中当前市场风向" : "没有吃到本期热门红利" },
            { label: "市场疲劳", value: fatigueMul < 1 ? `-${Math.round((1 - fatigueMul) * 100)}%` : "无", tone: fatigueMul < 1 ? "risk" : "good", desc: fatigueMul < 1 ? "近期连续发布同类，玩家审美疲劳" : "题材新鲜，无疲劳惩罚" },
            { label: "最终校准", value: finalScore.toFixed(1), tone: factorTone(finalScore / 9.0, 0.82, 0.62), desc: `原始评分 ${unclampedScore.toFixed(1)}，系统限制到 3.0 - 9.9 区间` }
        ]
    };
}

function generateReviewComments(proj, score) {
    let list = [];
    const isGood = score >= 7.5;
    const isBad = score < 5.5;

    let plannerComment = isGood
        ? `题材《${TOPICS_DATA[proj.topic].name}》的创意很有诚意，核心关卡很有粘性！`
        : isBad ? `玩法比较匮乏，感觉根本没有抓住玩家的情感痛点。`
        : `核心机制还行，不过缺乏让人眼前一亮的惊喜点，中规中矩。`;
    list.push({ reviewer: "抖音小游戏前哨站", text: plannerComment, score: Math.round(score + (Math.random() - 0.5)) });

    let artComment = proj.art > proj.code * 1.5
        ? `美术表现极其惊艳！色彩搭配极具艺术冲击力。`
        : isBad ? `画面素材有些简陋，感觉像是临时凑来的素材。`
        : `视觉效果还可以，能够保障游戏的基本沉浸感。`;
    list.push({ reviewer: "桔子游民画报", text: artComment, score: Math.round(score + (Math.random() - 0.5)) });

    let techComment = score > 8.0
        ? `流畅度拉满，加载优化做到了行业顶尖水平，无卡顿。`
        : isBad ? `代码优化极差，不仅卡顿，而且有几处导致崩溃的严重隐患。`
        : `整体运行平稳，技术表现符合同品类平均水平。`;
    list.push({ reviewer: "Geek极客评测", text: techComment, score: Math.round(score + (Math.random() - 0.5)) });

    return list;
}

function renderScoreBreakdown(evaluation) {
    const container = document.getElementById("modal-score-breakdown");
    if (!container || !evaluation) return;
    container.innerHTML = "";
    evaluation.factors.forEach(factor => {
        const item = document.createElement("div");
        item.className = "score-factor";
        item.innerHTML = `
            <div class="score-factor-head">
                <span>${factor.label}</span>
                <span class="score-factor-value ${factor.tone}">${factor.value}</span>
            </div>
            <div class="score-factor-desc">${factor.desc}</div>`;
        container.appendChild(item);
    });
}

function showReviewModal(release, reviews, evaluation) {
    document.getElementById("review-modal").classList.add("active");
    document.getElementById("modal-rating").innerText = release.rating;

    const starContainer = document.getElementById("modal-stars");
    starContainer.innerHTML = "";
    const starCount = Math.round(release.rating / 2);
    for (let i = 0; i < 5; i++) {
        const star = document.createElement("i");
        star.className = i < starCount ? "fa-solid fa-star" : "fa-regular fa-star";
        starContainer.appendChild(star);
    }

    setTimeout(() => { drawTrendChart("modal-chart-box", release.rating); }, 100);
    renderScoreBreakdown(evaluation);

    renderList(document.getElementById("modal-reviews"), reviews, (rev) => ({
        className: "review-item",
        html: `
            <div class="reviewer-meta">
                <span class="reviewer-name">${rev.reviewer}</span>
                <span class="reviewer-score">${rev.score}分</span>
            </div>
            <p class="review-text">“${rev.text}”</p>`
    }));
}

function closeReviewModal() {
    document.getElementById("review-modal").classList.remove("active");
    switchScreen('office');
}
