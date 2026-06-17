// ==========================================================================
// 招募雇员模块
// ==========================================================================
function generateHiringPool() {
    hiringPool = [];
    const roles = ["designer", "programmer", "artist"];
    
    for (let i = 0; i < 3; i++) {
        const role = roles[i];
        const rName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] + (Math.random() > 0.5 ? "姐" : "哥");
        
        // 属性浮动
        const seed = Math.random();
        const code = Math.round(role === "programmer" ? 25 + seed * 30 : 5 + seed * 15);
        const art = Math.round(role === "artist" ? 28 + seed * 28 : 5 + seed * 15);
        const design = Math.round(role === "designer" ? 26 + seed * 30 : 8 + seed * 12);
        
        let salary = Math.round((code + art + design) * 22 + 500);
        const cost = Math.round(salary * 2); // 招聘费

        // 随机产生员工特质
        const traitKeys = Object.keys(EMPLOYEE_TRAITS);
        const randomTrait = Math.random() > 0.35 ? traitKeys[Math.floor(Math.random() * (traitKeys.length - 1)) + 1] : "none";
        
        if (randomTrait === "salary") {
            salary = salary * 2; // 薪水杀手双倍周薪
        }

        hiringPool.push({
            name: rName,
            role: role,
            stats: { code, art, design },
            salary: salary,
            cost: cost,
            level: 1,
            trait: randomTrait
        });
    }
}

function loadStaffRecruits() {
    renderList(document.getElementById("hiring-list"), hiringPool, (cand, idx) => {
        let iconClass = "fa-laptop-code";
        let roleColor = "var(--accent-neon)";
        let roleName = "程序员";
        if (cand.role === "artist") { roleColor = "var(--accent-pink)"; roleName = "美术设计师"; iconClass = "fa-palette"; }
        if (cand.role === "designer") { roleColor = "var(--accent-yellow)"; roleName = "核心策划"; iconClass = "fa-lightbulb"; }

        const traitObj = EMPLOYEE_TRAITS[cand.trait || "none"];
        const traitHTML = cand.trait && cand.trait !== "none" ? `<span class="trait-badge ${traitObj.badgeClass}" title="${traitObj.desc}">${traitObj.name}</span>` : "";

        return { className: "candidate-card", html: `
            <div class="candidate-header">
                <div class="candidate-info">
                    <div class="staff-avatar ${cand.role}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="staff-profile">
                        <span class="staff-name">${cand.name} ${traitHTML}</span>
                        <span class="staff-level" style="color: ${roleColor}">${roleName}</span>
                    </div>
                </div>
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
                <span class="list-lbl">期望周薪</span>
                <span class="candidate-salary">¥${cand.salary}</span>
            </div>
            <button class="btn-hire" onclick="hireCandidate(${idx})">
                签订雇佣合同 (手续费 ¥${cand.cost})
            </button>
        ` };
    });
}

function hireCandidate(idx) {
    const cand = hiringPool[idx];
    if (gameState.employees.length >= 5) {
        alert("当前办公室卡座已满！无法招募新员工（最大 5 人）。");
        return;
    }
    if (gameState.funds < cand.cost) {
        alert("资金不足以支付入职雇佣手续费！");
        return;
    }

    gameState.funds -= cand.cost;
    gameState.employees.push({
        name: cand.name,
        role: cand.role,
        stats: cand.stats,
        salary: cand.salary,
        level: 1,
        xp: 0,
        trait: cand.trait || "none"
    });

    // 移除招募池中的该候选人并重新加载招募列表
    hiringPool.splice(idx, 1);
    generateHiringPool(); // 再次补充
    saveGame();
    
    let roleName = "程序员";
    if (cand.role === "artist") roleName = "美术师";
    if (cand.role === "designer") roleName = "策划师";
    addChronicleEntry(`🤝 成功招募候选人【${cand.name}】担任【${roleName}】！`);

    updateStatsUI();
    loadStaffRecruits();
    playSFX("click");
    alert(`恭喜！${cand.name} 已成功入职！`);
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

// ==========================================================================
// 科技研究模块
// ==========================================================================
const RESEARCH_DATABASE = {
    genre: {
        "RPG": { name: "角色扮演 (RPG)", desc: "解锁后可以研发重度硬核角色扮演游戏，盈利上限更高。", cost: 15 },
        "Roguelike": { name: "地牢冒险 (Roguelike)", desc: "解锁后可以研发随机地牢动作类游戏，极其受核心玩家欢迎。", cost: 25 },
        "Tycoon": { name: "模拟经营 (Tycoon)", desc: "研发具有深度的策略模拟经营游戏，粉丝增长效率极佳。", cost: 40 }
    },
    topic: {
        "Space": { name: "科幻深空", desc: "太空歌剧与硬科幻背景，是科幻爱好者的首选主题。", cost: 10 },
        "Cyberpunk": { name: "赛博都市", desc: "霓虹美学与高科技低生活题材，拥有极强的视觉可塑性。", cost: 20 },
        "Retro": { name: "像素复古", desc: "老派怀旧风，用最纯粹的游戏玩法打动玩家。", cost: 30 }
    },
    platform: {
        "TikTok": { name: "抖音小游戏生态", desc: "解锁接入抖音推荐算法，大幅提升轻度游戏的销量上限。", cost: 12 },
        "PC": { name: "Steam商店发行", desc: "发行至全球最大的个人电脑游戏平台，高定价高销量上限。", cost: 28 },
        "Console": { name: "索尼/任天堂主机端", desc: "进军最重度的家庭娱乐主机阵营，品质要求极苛刻但口碑爆炸。", cost: 50 }
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

        const card = document.createElement("div");
        card.className = "research-card";
        card.innerHTML = `
            <div class="research-info">
                <span class="research-name">${item.name}</span>
                <p class="research-desc">${item.desc}</p>
            </div>
            <div class="research-action">
                <span class="research-cost"><i class="fa-solid fa-lightbulb"></i> ${item.cost} RP</span>
                <button class="btn-research" ${isUnlocked || gameState.rp < item.cost ? 'disabled' : ''} onclick="researchTech('${key}')">
                    ${isUnlocked ? '已成功研发' : '启动科技攻关'}
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

    saveGame();
    updateStatsUI();
    loadResearchTree();
    alert(`恭喜！已成功解锁《${item.name}》科技，立项时可用！`);
}

// ==========================================================================
// 突发事件引擎
// ==========================================================================
const EVENTS_POOL = [
    {
        title: "粉丝的疯狂来信",
        desc: "有一位您的核心粉丝给工作室寄来一封信，表达了他对你们消除类游戏的热爱，并附赠了一张 ¥2,000 的赞助卡。但也有一群玩家抱怨你们没有出新题材，你打算怎么回应？",
        choices: [
            { text: "收下资金，给玩家发送一封感谢信", action: () => { gameState.funds += 2000; updateStatsUI(); alert("资金增加 ¥2,000"); } },
            { text: "用 ¥3,000 举办线上粉丝见面会，回馈社区", action: () => { if (gameState.funds < 3000) return alert("资金不足！"); gameState.funds -= 3000; gameState.fans += 500; updateStatsUI(); alert("粉丝增加 500 人"); } }
        ]
    },
    {
        title: "发行商独占诱惑",
        desc: "抖音知名发行大厂找到你们，承诺如果你们下一款游戏选择由他们代理发行，将立即一次性打款 ¥20,000 支持，但是这会抽走下款游戏 40% 的总分成。",
        choices: [
            { text: "同意代理协议，先拿钱再说！", action: () => { gameState.funds += 20000; updateStatsUI(); alert("启动资金增加 ¥20,000"); } },
            { text: "拒绝大厂代理，坚持自主运营独立自强", action: () => { gameState.fans += 200; updateStatsUI(); alert("独立精神感动了社区，粉丝增长 200 人"); } }
        ]
    },
    {
        title: "核心代码大崩溃",
        desc: "深夜开发时，一处服务器接口突然崩盘。程序员表示如果花 ¥4,000 购买云备份组件可以瞬间修复；否则必须全员加班，全工作室点数暂时下跌。",
        choices: [
            { text: "紧急出钱购买云备份组件修复", action: () => { if (gameState.funds < 4000) return alert("资金不足！"); gameState.funds -= 4000; updateStatsUI(); alert("危机解除"); } },
            { text: "拒绝花冤枉钱，全体留下来加班维护", action: () => { gameState.employees.forEach(e => { e.stats.code = Math.max(1, e.stats.code - 2); }); alert("程序员过度劳累，代码开发能力下降"); } }
        ]
    }
];

function triggerRandomEvent() {
    const ev = EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)];
    
    document.getElementById("event-modal").classList.add("active");
    document.getElementById("event-modal-title").innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${ev.title}`;
    document.getElementById("event-modal-desc").innerText = ev.desc;
    
    const btnContainer = document.getElementById("event-modal-choices");
    btnContainer.innerHTML = "";
    ev.choices.forEach(ch => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = ch.text;
        btn.onclick = () => {
            ch.action();
            document.getElementById("event-modal").classList.remove("active");
        };
        btnContainer.appendChild(btn);
    });
}

