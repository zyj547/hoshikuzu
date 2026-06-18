// ==========================================================================
// 招募雇员模块
// ==========================================================================
const HIRING_RARITIES = {
    R: { name: "R", label: "潜力新人", multiplier: 1.0, level: 1, salaryMultiplier: 1.0, costMultiplier: 1.0, color: "var(--accent-neon)" },
    SR: { name: "SR", label: "资深骨干", multiplier: 1.45, level: 3, salaryMultiplier: 1.45, costMultiplier: 1.7, color: "var(--accent-pink)" },
    SSR: { name: "SSR", label: "行业王牌", multiplier: 2.15, level: 5, salaryMultiplier: 2.2, costMultiplier: 3.2, color: "var(--accent-yellow)" }
};

function rollHiringRarity(forceSSR = false) {
    if (forceSSR) return "SSR";
    const ssrBonus = typeof founderSsrBonus === "function" ? founderSsrBonus() : 0;
    const roll = Math.random();
    if (roll < 0.12 + ssrBonus) return "SSR";
    if (roll < 0.42 + ssrBonus) return "SR";
    return "R";
}

// 创始人「领袖魅力」专长对招聘相关花费的折扣
function hireCostMult() {
    return typeof founderHiringMult === "function" ? founderHiringMult() : 1;
}

function effectiveHireCost(cand) {
    return Math.round(cand.cost * hireCostMult());
}

function getHiringRefreshCost() {
    const year = gameState && gameState.date ? gameState.date.year : 1;
    return Math.round((1800 + Math.max(0, year - 1) * 600) * hireCostMult());
}

function getSsrPityRemaining() {
    return 8 - ((gameState.hiringRefreshes || 0) % 8);
}

function generateCandidate(role, rarityKey) {
    const rarity = HIRING_RARITIES[rarityKey];
    const rName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] + (Math.random() > 0.5 ? "姐" : "哥");
    const seed = Math.random();
    const variance = rarityKey === "SSR" ? 1.18 : rarityKey === "SR" ? 1.08 : 1.0;
    const code = Math.round((role === "programmer" ? 25 + seed * 30 : 5 + seed * 15) * rarity.multiplier * variance);
    const art = Math.round((role === "artist" ? 28 + seed * 28 : 5 + seed * 15) * rarity.multiplier * variance);
    const design = Math.round((role === "designer" ? 26 + seed * 30 : 8 + seed * 12) * rarity.multiplier * variance);

    let salary = Math.round((code + art + design) * 22 * rarity.salaryMultiplier + 500);
    const cost = Math.round(salary * 2 * rarity.costMultiplier);
    const traitKeys = Object.keys(EMPLOYEE_TRAITS);
    const traitChance = rarityKey === "SSR" ? 0.9 : rarityKey === "SR" ? 0.7 : 0.65;
    const randomTrait = Math.random() < traitChance ? traitKeys[Math.floor(Math.random() * (traitKeys.length - 1)) + 1] : "none";

    if (randomTrait === "salary") {
        salary = salary * 2;
    }

    // 性格原型（独立于 trait）
    const archKeys = Object.keys(EMPLOYEE_ARCHETYPES);
    const archetype = archKeys[Math.floor(Math.random() * archKeys.length)];
    const arch = EMPLOYEE_ARCHETYPES[archetype];
    const { expectedSalary, salaryFloor } = archetypeExpect(salary, arch);

    return {
        name: rName,
        role,
        stats: { code, art, design },
        salary,
        expectedSalary,
        salaryFloor,
        cost,
        level: rarity.level,
        trait: randomTrait,
        rarity: rarityKey,
        archetype
    };
}

function updateHiringMarketUI() {
    const costEl = document.getElementById("staff-refresh-cost");
    if (costEl) costEl.innerText = `¥${getHiringRefreshCost().toLocaleString()}`;
    const pityEl = document.getElementById("staff-ssr-pity");
    if (pityEl) pityEl.innerText = `${getSsrPityRemaining()} 次内必出 SSR`;
}

function generateHiringPool(forceSSR = false) {
    hiringPool = [];
    const roles = ["designer", "programmer", "artist"];
    
    for (let i = 0; i < 4; i++) {
        const role = roles[i % roles.length];
        hiringPool.push(generateCandidate(role, rollHiringRarity(forceSSR && i === 0)));
    }
    updateHiringMarketUI();
}

function loadStaffRecruits() {
    updateHiringMarketUI();
    renderList(document.getElementById("hiring-list"), hiringPool, (cand, idx) => {
        let iconClass = "fa-laptop-code";
        let roleColor = "var(--accent-neon)";
        let roleName = "程序员";
        if (cand.role === "artist") { roleColor = "var(--accent-pink)"; roleName = "美术设计师"; iconClass = "fa-palette"; }
        if (cand.role === "designer") { roleColor = "var(--accent-yellow)"; roleName = "核心策划"; iconClass = "fa-lightbulb"; }

        const traitObj = EMPLOYEE_TRAITS[cand.trait || "none"];
        const traitHTML = cand.trait && cand.trait !== "none" ? `<span class="trait-badge ${traitObj.badgeClass}" title="${traitObj.desc}">${traitObj.name}</span>` : "";
        const arch = EMPLOYEE_ARCHETYPES[cand.archetype || "pragmatic"];
        const archHTML = `<span class="trait-badge archetype" title="${arch.desc}">${arch.name}</span>`;
        const rarity = HIRING_RARITIES[cand.rarity || "R"];
        const totalStats = cand.stats.code + cand.stats.art + cand.stats.design;
        const salaryEfficiency = Math.round(totalStats / Math.max(1, cand.salary / 1000));

        return { className: `candidate-card rarity-${cand.rarity || "R"}`, html: `
            <div class="candidate-header">
                <div class="candidate-info">
                    <div class="staff-avatar ${cand.role}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="staff-profile">
                        <span class="staff-name">${cand.name} ${archHTML} ${traitHTML}</span>
                        <span class="staff-level" style="color: ${roleColor}">${roleName}</span>
                    </div>
                </div>
                <div class="rarity-badge" style="color:${rarity.color}; border-color:${rarity.color};">${rarity.name}</div>
            </div>
            <div class="candidate-rarity-line" style="color:${rarity.color};">
                ${rarity.label} · 入职 Lv.${cand.level}
            </div>
            <div class="candidate-skills">
                <div class="candidate-skill">
                    <span class="candidate-skill-val" style="color: var(--accent-neon);">${cand.stats.code}</span>
                    <span class="candidate-skill-lbl">代码</span>
                </div>
                <div class="candidate-skill">
                    <span class="candidate-skill-val" style="color: var(--accent-pink);">${cand.stats.art}</span>
                    <span class="candidate-skill-lbl">美术</span>
                </div>
                <div class="candidate-skill">
                    <span class="candidate-skill-val" style="color: var(--accent-yellow);">${cand.stats.design}</span>
                    <span class="candidate-skill-lbl">策划</span>
                </div>
            </div>
            <div class="candidate-salary-box">
                <span class="list-lbl">期望月薪</span>
                <span class="candidate-salary">¥${cand.expectedSalary}</span>
            </div>
            <div class="candidate-salary-box">
                <span class="list-lbl">性价比指数</span>
                <span class="candidate-salary" style="color: var(--accent-neon);">${salaryEfficiency}</span>
            </div>
            <button class="btn-hire" onclick="startInterview(${idx})">
                邀约面试 (渠道费 ¥${getInterviewFee(cand, gameState.date.year).toLocaleString()})
            </button>
        ` };
    });
}

function refreshHiringMarket() {
    const cost = getHiringRefreshCost();
    if (gameState.funds < cost) {
        alert(`资金不足！刷新人才市场需要 ¥${cost.toLocaleString()}。`);
        return;
    }

    gameState.funds -= cost;
    gameState.hiringRefreshes = (gameState.hiringRefreshes || 0) + 1;
    const forceSSR = gameState.hiringRefreshes % 8 === 0;
    generateHiringPool(forceSSR);
    addChronicleEntry(`🔎 支付猎头费 ¥${cost.toLocaleString()} 刷新了人才市场${forceSSR ? "，触发 SSR 保底！" : "。"}`);
    saveGame();
    updateStatsUI();
    loadStaffRecruits();
    playSFX(forceSSR ? "success" : "click");
}

// 面试谈成后的录用写入（不再收大额入职手续费）
function commitHire(cand, idx, finalSalary, initialMorale) {
    const officeSlots = gameState.officeSlots || 5;
    if (gameState.employees.length >= officeSlots) { alert("办公室卡座已满！"); return; }

    const contractYears = 1 + Math.floor(Math.random() * 3);
    gameState.employees.push({
        name: cand.name,
        role: cand.role,
        stats: cand.stats,
        salary: finalSalary,
        level: cand.level || 1,
        xp: 0,
        trait: cand.trait || "none",
        rarity: cand.rarity || "R",
        archetype: cand.archetype || "pragmatic",
        morale: initialMorale,
        fatigue: 0,
        weeksThisCycle: 0,
        contractYears: contractYears,
        contractWeeksLeft: contractYears * 48,
        pendingRenewal: false
    });

    hiringPool.splice(idx, 1);
    while (hiringPool.length < 4) {
        const roles = ["designer", "programmer", "artist"];
        hiringPool.push(generateCandidate(roles[Math.floor(Math.random() * 3)], rollHiringRarity()));
    }
    updateHiringMarketUI();
    saveGame();

    let roleName = "程序员";
    if (cand.role === "artist") roleName = "美术师";
    if (cand.role === "designer") roleName = "策划师";
    addChronicleEntry(`🤝 经过面试与谈薪，${cand.rarity || "R"} 级【${cand.name}】以月薪 ¥${finalSalary.toLocaleString()} 入职【${roleName}】。`);

    updateStatsUI();
    loadStaffRecruits();
    playSFX("click");
}

function getOfficeExpandCost() {
    const slots = gameState.officeSlots || 3;
    return 60000 + Math.max(0, slots - 3) * 45000;
}

function expandOfficeSlots() {
    const slots = gameState.officeSlots || 3;
    const cap = typeof stageSlotCap === "function" ? stageSlotCap() : 8;
    if (slots >= cap) {
        const stageName = typeof currentStage === "function" ? currentStage().name : "当前";
        alert(`当前【${stageName}】阶段工位已达上限（${cap} 个）。发展公司晋级到更高阶段才能继续扩建。`);
        return;
    }

    const cost = getOfficeExpandCost();
    if (gameState.funds < cost) {
        alert(`资金不足！扩建第 ${slots + 1} 个工位需要 ¥${cost.toLocaleString()}。`);
        return;
    }

    gameState.funds -= cost;
    gameState.officeSlots = slots + 1;
    addChronicleEntry(`🏢 工作室完成扩建，新增 1 个开发工位。当前团队容量 ${gameState.officeSlots}/8。`);
    saveGame();
    updateStatsUI();
    loadOfficeDesks();
    playSFX("upgrade");
    alert(`扩建完成！现在可以容纳 ${gameState.officeSlots} 名员工。`);
}

async function fireEmployee(idx) {
    const emp = gameState.employees[idx];
    if (!emp) return;
    if (idx === 0 || emp.id === "player") {
        alert("创始人不能开除。");
        return;
    }
    if (gameState.currentProject || (gameState.auxProjects && gameState.auxProjects.length > 0)) {
        alert("有项目正在研发中（含并行辅助项目），暂时不能开除员工。请先完成或发布所有项目。");
        return;
    }

    const severance = Math.max(1000, Math.round(emp.salary * 1.5));
    if (gameState.funds < severance) {
        alert(`资金不足以支付离职补偿金 ¥${severance.toLocaleString()}。`);
        return;
    }
    const confirmed = await confirm(`确定开除 ${emp.name} 吗？需要支付离职补偿金 ¥${severance.toLocaleString()}。`);
    if (!confirmed) {
        return;
    }

    gameState.funds -= severance;
    const accrued = proratedWage(emp.salary, emp.weeksThisCycle || 0);
    if (accrued > 0) {
        gameState.funds -= accrued;
        addChronicleEntry(`💴 结算 ${emp.name} 本月在岗 ${emp.weeksThisCycle} 周工资 ¥${accrued.toLocaleString()}。`);
    }
    gameState.employees.splice(idx, 1);
    addChronicleEntry(`📄 ${emp.name} 离开了工作室，支付离职补偿金 ¥${severance.toLocaleString()}。`);
    saveGame();
    updateStatsUI();
    loadOfficeDesks();
    playSFX("click");
}

function trainEmployee(idx) {
    const emp = gameState.employees[idx];
    let cost = emp.level * 4000;
    // 摸鱼达人培训成本减半
    if (emp.trait === "lazy") {
        cost = Math.round(cost / 2);
    }
    
    if (gameState.funds < cost) {
        alert("资金不足以支付员工培训费！");
        return;
    }

    // 备份旧状态用于对比展示
    const oldLevel = emp.level;
    const oldStats = { ...emp.stats };

    gameState.funds -= cost;
    emp.level++;
    
    // 属性成长加成计算
    let factor = 1.0;
    if (emp.trait === "multi") {
        factor = 1.2; // 全能选手1.2倍
    }
    if (emp.trait === "lazy") {
        factor = Math.random() > 0.5 ? 1.6 : 0.4; // 摸鱼达人非常随机
    }

    // 提升属性
    if (emp.role === "programmer") {
        emp.stats.code += Math.round((Math.floor(Math.random() * 8) + 5) * factor);
        emp.stats.design += Math.round((Math.floor(Math.random() * 3) + 1) * factor);
    } else if (emp.role === "artist") {
        emp.stats.art += Math.round((Math.floor(Math.random() * 8) + 5) * factor);
    } else if (emp.role === "designer") {
        emp.stats.design += Math.round((Math.floor(Math.random() * 8) + 5) * factor);
        emp.stats.code += Math.round((Math.floor(Math.random() * 3) + 1) * factor);
    }

    // 加薪
    emp.salary = Math.round(emp.salary * 1.25);

    addChronicleEntry(`🎓 团队成员【${emp.name}】完成了高强度的专业技能培训，成功晋升至等级 Lv.${emp.level}！`);

    saveGame();
    updateStatsUI();
    loadOfficeDesks();
    playSFX("upgrade");

    // 构建精美的晋升数值对比报告
    const diffs = [];
    if (emp.stats.code > oldStats.code) {
        diffs.push(`<span>代码能力:</span> <span>${oldStats.code} ➔ <b style="color: var(--accent-neon);">${emp.stats.code}</b> (+${emp.stats.code - oldStats.code})</span>`);
    }
    if (emp.stats.art > oldStats.art) {
        diffs.push(`<span>美术表现:</span> <span>${oldStats.art} ➔ <b style="color: var(--accent-pink);">${emp.stats.art}</b> (+${emp.stats.art - oldStats.art})</span>`);
    }
    if (emp.stats.design > oldStats.design) {
        diffs.push(`<span>策划创意:</span> <span>${oldStats.design} ➔ <b style="color: var(--accent-yellow);">${emp.stats.design}</b> (+${emp.stats.design - oldStats.design})</span>`);
    }

    const msg = `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.2rem;">
            <div style="font-size: 1.05rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem; font-weight: 700; color: #fff;">
                🍊 ${escapeHtml(emp.name)} 培训晋升成功！
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>级别晋升:</span>
                <span>Lv.${oldLevel} ➔ <b style="color: var(--accent-yellow);">Lv.${emp.level}</b></span>
            </div>
            ${diffs.map(d => `<div style="display: flex; justify-content: space-between; font-size: 0.88rem; opacity: 0.95;">${d}</div>`).join('')}
        </div>
    `;
    alert(msg, "工作室人才升级简报");
}

function restEmployee(idx) {
    const emp = gameState.employees[idx];
    if (!emp) return;
    const cost = Math.max(800, Math.round(emp.salary * 0.6));
    if (gameState.funds < cost) {
        alert("资金不足以安排带薪休整！");
        return;
    }
    gameState.funds -= cost;
    emp.fatigue = Math.max(0, (emp.fatigue || 0) - 35);
    emp.morale = Math.min(100, (emp.morale == null ? 75 : emp.morale) + 18);
    addChronicleEntry(`☕ ${emp.name} 完成一次带薪休整，状态明显回暖。`);
    saveGame();
    updateStatsUI();
    loadOfficeDesks();
    playSFX("success");
}

// ==========================================================================
// 科技研究模块
// ==========================================================================
const RESEARCH_DATABASE = {
    genre: {
        "RPG": { name: "角色扮演 (RPG)", route: "精品路线", desc: "解锁后可以研发重度硬核角色扮演游戏，盈利上限更高。", cost: 15 },
        "Roguelike": { name: "地牢冒险 (Roguelike)", route: "核心路线", desc: "解锁后可以研发随机地牢动作类游戏，极其受核心玩家欢迎。", cost: 25 },
        "Tycoon": { name: "模拟经营 (Tycoon)", route: "长线路线", desc: "研发具有深度的策略模拟经营游戏，粉丝增长效率极佳。", cost: 40 }
    },
    topic: {
        "Space": { name: "科幻深空", route: "幻想题材", desc: "太空歌剧与硬科幻背景，是科幻爱好者的首选主题。", cost: 10 },
        "Cyberpunk": { name: "赛博都市", route: "视觉题材", desc: "霓虹美学与高科技低生活题材，拥有极强的视觉可塑性。", cost: 20 },
        "Retro": { name: "像素复古", route: "怀旧题材", desc: "老派怀旧风，用最纯粹的游戏玩法打动玩家。", cost: 30 }
    },
    platform: {
        "TikTok": { name: "抖音小游戏生态", route: "流量路线", desc: "解锁接入抖音推荐算法，大幅提升轻度游戏的销量上限。", cost: 12 },
        "PC": { name: "Steam商店发行", route: "全球路线", desc: "发行至全球最大的个人电脑游戏平台，高定价高销量上限。", cost: 28 },
        "Console": { name: "索尼/任天堂主机端", route: "主机路线", desc: "进军最重度的家庭娱乐主机阵营，品质要求极苛刻但口碑爆炸。", cost: 50 }
    },
    perk: {
        "workflow": { name: "敏捷工作流", route: "管理路线", desc: "建立迭代节奏。研发项目每周进度更稳，员工疲劳增长压力降低。", cost: 18 },
        "community": { name: "社区运营矩阵", route: "商业路线", desc: "建立粉丝社群。每周自然增长少量粉丝，降低空窗期焦虑。", cost: 22 },
        "analytics": { name: "数据分析后台", route: "工具路线", desc: "搭建数据看板。闲置员工产出 RP 的概率和稳定性提升。", cost: 26 }
    }
};

function switchResearchTab(tab, btn) {
    activeResearchTab = tab;
    
    // 切换按钮高亮
    const links = document.querySelectorAll(".research-tabs .tab-link");
    links.forEach(l => l.classList.remove("active"));
    btn.classList.add("active");

    loadResearchTree();
}

function loadResearchTree() {
    const container = document.getElementById("research-list");
    container.innerHTML = "";

    const db = RESEARCH_DATABASE[activeResearchTab];
    Object.keys(db).forEach(key => {
        const item = db[key];
        
        // 判断是否已解锁
        let isUnlocked = false;
        if (activeResearchTab === "genre") isUnlocked = gameState.unlockedGenres.includes(key);
        if (activeResearchTab === "topic") isUnlocked = gameState.unlockedTopics.includes(key);
        if (activeResearchTab === "platform") isUnlocked = gameState.unlockedPlatforms.includes(key);
        if (activeResearchTab === "perk") isUnlocked = Boolean(gameState.researchPerks && gameState.researchPerks[key]);

        const card = document.createElement("div");
        card.className = "research-card";
        card.innerHTML = `
            <div class="research-info">
                <span class="research-route">${item.route}</span>
                <span class="research-name">${item.name}</span>
                <p class="research-desc">${item.desc}</p>
            </div>
            <div class="research-action">
                <span class="research-cost"><i class="fa-solid fa-lightbulb"></i> ${item.cost} RP</span>
                <button class="btn-research" ${isUnlocked || gameState.rp < item.cost ? 'disabled' : ''} onclick="researchTech('${key}')">
                    ${isUnlocked ? '已部署生效' : '启动科技攻关'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function researchTech(key) {
    const db = RESEARCH_DATABASE[activeResearchTab];
    const item = db[key];

    if (gameState.rp < item.cost) {
        alert("您的研发点数 (RP) 不足！");
        return;
    }

    gameState.rp -= item.cost;
    if (activeResearchTab === "genre") gameState.unlockedGenres.push(key);
    if (activeResearchTab === "topic") gameState.unlockedTopics.push(key);
    if (activeResearchTab === "platform") gameState.unlockedPlatforms.push(key);
    if (activeResearchTab === "perk") {
        if (!gameState.researchPerks) gameState.researchPerks = { workflow: false, community: false, analytics: false };
        gameState.researchPerks[key] = true;
    }

    saveGame();
    updateStatsUI();
    loadResearchTree();
    alert(`恭喜！已成功解锁《${item.name}》科技，立项时可用！`);
}

// ==========================================================================
// 突发事件引擎
// ==========================================================================
function triggerRandomEvent() {
    const state = buildEventState(gameState);
    const pool = eligibleEvents(STUDIO_EVENTS, state);
    if (!pool.length) return; // 没有符合当前处境的事件就不打扰

    const event = pickWeighted(pool, Math.random);
    const targets = selectTargets(event, state, Math.random);
    const ctx = { state, gameState, byRole: targets.byRole, target: targets.target };

    document.getElementById("event-modal").classList.add("active");
    document.getElementById("event-modal-title").innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${resolveTokens(event.title, ctx)}`;
    document.getElementById("event-modal-desc").innerText = resolveTokens(event.desc, ctx);

    const btnContainer = document.getElementById("event-modal-choices");
    btnContainer.innerHTML = "";
    event.choices.forEach(ch => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = resolveTokens(ch.text, ctx);
        btn.onclick = () => {
            applyEffects(ch.effects, ctx, Math.random);
            document.getElementById("event-modal").classList.remove("active");
            if (ch.feedback) alert(resolveTokens(ch.feedback, ctx));
            updateStatsUI();
            saveGame();
        };
        btnContainer.appendChild(btn);
    });
}

