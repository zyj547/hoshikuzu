// ==========================================================================
// 辅助渲染与主逻辑
// ==========================================================================

// 切换视图面板
function switchScreen(screenId) {
    // 切换导航条
    const navItems = document.querySelectorAll(".nav-menu .nav-item");
    navItems.forEach(item => item.classList.remove("active"));
    
    const activeNav = document.getElementById(`nav-${screenId}`);
    if (activeNav) activeNav.classList.add("active");

    // 切换大屏
    const screens = document.querySelectorAll(".screen-panel");
    screens.forEach(screen => screen.classList.remove("active"));
    
    const activeScreen = document.getElementById(`panel-${screenId}`);
    if (activeScreen) activeScreen.classList.add("active");

    // 特殊页面数据刷新
    if (screenId === "office") loadOfficeDesks();
    if (screenId === "develop") setupDevelopForm();
    if (screenId === "staff") loadStaffRecruits();
    if (screenId === "research") loadResearchTree();
    if (screenId === "history") loadHistoryReleases();
}

function refreshActiveScreen() {
    const activeNav = document.querySelector(".nav-menu .nav-item.active");
    if (!activeNav) return;
    const screenId = activeNav.id.replace("nav-", "");
    // 办公室卡座内容只在玩家操作后变化（招募/培训/专精时已各自重绘），
    // 无需每周全量重建——避免重置 3D 悬停态、滚动位置和不必要的重排。
    // 历史发布榜仅当仍有在售游戏（营收逐周增长）时才需要刷新。
    if (screenId === "history" && gameState.releases.some(g => g.weeksSinceRelease < 16)) {
        loadHistoryReleases();
    }
}

function staffHealthTone(value, inverse = false) {
    if (inverse) {
        if (value <= 30) return "good";
        if (value <= 65) return "warn";
        return "risk";
    }
    if (value >= 70) return "good";
    if (value >= 45) return "warn";
    return "risk";
}

function teamSummary() {
    const totals = gameState.employees.reduce((sum, emp) => {
        sum.code += emp.stats.code;
        sum.art += emp.stats.art;
        sum.design += emp.stats.design;
        sum.fatigue += emp.fatigue || 0;
        sum.morale += emp.morale == null ? 75 : emp.morale;
        return sum;
    }, { code: 0, art: 0, design: 0, fatigue: 0, morale: 0 });
    const count = Math.max(1, gameState.employees.length);
    const focusMap = [
        { key: "code", name: "代码" },
        { key: "art", name: "美术" },
        { key: "design", name: "策划" }
    ].sort((a, b) => totals[b.key] - totals[a.key]);
    return {
        focus: focusMap[0].name,
        avgFatigue: Math.round(totals.fatigue / count),
        avgMorale: Math.round(totals.morale / count)
    };
}

function nextActionHint(weeklyOut) {
    const officeSlots = gameState.officeSlots || 5;
    if (gameState.currentProject) return "推进当前项目";
    if (gameState.funds < weeklyOut * 6) return "控制开支";
    if (gameState.employees.length >= officeSlots && officeSlots < 8) return "扩张工位";
    if (gameState.employees.length < Math.min(3, officeSlots)) return "补齐团队";
    if (gameState.rp >= 18) return "研究新路线";
    if (gameState.releases.length === 0) return "立项首作";
    return "冲击趋势题材";
}

// 渲染办公室列表
function loadOfficeDesks() {
    const container = document.getElementById("office-desks");
    container.innerHTML = "";

    const specialtyNames = {
        engine: "引擎架构师",
        fullstack: "全栈工程师",
        concept: "原画主美",
        animator: "特效主美",
        systems: "系统策划",
        writer: "创意主笔"
    };

    const officeSlots = gameState.officeSlots || 5;

    // 循环遍历渲染当前办公室卡座
    for (let i = 0; i < officeSlots; i++) {
        const emp = gameState.employees[i];
        const card = document.createElement("div");
        card.className = emp ? "desk-card employee-card" : "desk-card empty-desk-card";

        if (emp) {
            let iconClass = "fa-laptop-code";
            let roleName = "程序员";
            if (emp.role === "artist") { roleName = "美术设计师"; iconClass = "fa-palette"; }
            if (emp.role === "designer") { roleName = "核心策划"; iconClass = "fa-lightbulb"; }

            // 专精状态展示标签
            let specialtyTagHtml = "";
            if (emp.specialty) {
                let tagColor = "var(--accent-neon)";
                if (emp.role === "artist") tagColor = "var(--accent-pink)";
                if (emp.role === "designer") tagColor = "var(--accent-yellow)";
                specialtyTagHtml = `<span class="specialty-tag" style="border-color:${tagColor}; color:${tagColor}; text-shadow:0 0 5px ${tagColor};">${specialtyNames[emp.specialty]}</span>`;
            }
            // 稀有度徽章
            const empRarityKey = emp.rarity || "R";
            const empRarity = HIRING_RARITIES[empRarityKey];
            const rarityBadgeHtml = `<span class="desk-rarity-badge" style="color:${empRarity.color}; border-color:${empRarity.color};">${empRarity.name}</span>`;
            const morale = emp.morale == null ? 75 : emp.morale;
            const fatigue = emp.fatigue || 0;
            const efficiency = Math.round(employeeEfficiency(emp) * 100);
            const restCost = Math.max(800, Math.round(emp.salary * 0.6));

            // 是否可以专精
            const fireButtonHtml = i === 0 || emp.id === "player"
                ? `<button class="btn-research staff-action-btn fire" disabled>创始人</button>`
                : `<button class="btn-research staff-action-btn fire" onclick="fireEmployee(${i})">开除</button>`;
            let actionButtonHtml = `
                <div class="staff-action-row compact">
                    <button class="btn-research staff-action-btn train" onclick="trainEmployee(${i})">
                        培训 (¥${emp.level * 4000})
                    </button>
                    <button class="btn-research staff-action-btn rest" onclick="restEmployee(${i})">
                        休整 (¥${restCost})
                    </button>
                    ${fireButtonHtml}
                </div>
            `;
            if (emp.level >= 5 && !emp.specialty) {
                actionButtonHtml = `
                    <div class="staff-action-row compact">
                        <button class="btn-research staff-action-btn train" onclick="trainEmployee(${i})">
                            培训 (¥${emp.level * 4000})
                        </button>
                        <button class="btn-research staff-action-btn specialize" onclick="openSpecialtyModal(${i})">
                            专精
                        </button>
                        <button class="btn-research staff-action-btn rest" onclick="restEmployee(${i})">
                            休整
                        </button>
                        ${fireButtonHtml}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="staff-avatar-box">
                    <div class="staff-avatar ${emp.role}">
                        <i class="fa-solid ${iconClass}"></i>
                        <span class="staff-role-badge">Lv</span>
                    </div>
                    <div class="staff-profile">
                        <div class="staff-name-row">
                            <span class="staff-name">${escapeHtml(emp.name)}</span>
                            ${rarityBadgeHtml}
                            ${specialtyTagHtml}
                        </div>
                        <span class="staff-level">${roleName} | 等级 Lv.${emp.level}</span>
                    </div>
                </div>
                <div class="staff-skills">
                    <div class="skill-stat">
                        <span class="skill-val code">${emp.stats.code}</span>
                        <span class="skill-lbl">代码</span>
                    </div>
                    <div class="skill-stat">
                        <span class="skill-val art">${emp.stats.art}</span>
                        <span class="skill-lbl">美术</span>
                    </div>
                    <div class="skill-stat">
                        <span class="skill-val design">${emp.stats.design}</span>
                        <span class="skill-lbl">设计</span>
                    </div>
                </div>
                <div class="staff-condition">
                    <div class="condition-pill ${staffHealthTone(morale)}">心情 ${morale}</div>
                    <div class="condition-pill ${staffHealthTone(fatigue, true)}">疲劳 ${fatigue}</div>
                    <div class="condition-pill ${staffHealthTone(efficiency)}">效率 ${efficiency}%</div>
                </div>
                <div class="staff-actions">
                    ${actionButtonHtml}
                </div>
            `;
        } else {
            // 空卡座
            card.innerHTML = `
                <div class="staff-avatar-box empty-desk-main">
                    <div class="staff-avatar empty-avatar">
                        <i class="fa-solid fa-chair"></i>
                    </div>
                    <div class="staff-profile">
                        <span class="staff-name muted-name">空置开发卡座</span>
                        <span class="staff-level">前往人才招募中心扩大团队</span>
                    </div>
                </div>
                <div class="staff-actions empty-desk-action">
                    <button class="btn-research staff-empty-action" onclick="switchScreen('staff')">
                        快速招募员工
                    </button>
                </div>
            `;
        }
        container.appendChild(card);
    }

    if (officeSlots < 8) {
        const cost = getOfficeExpandCost();
        const card = document.createElement("div");
        card.className = "desk-card office-expand-card";
        card.innerHTML = `
            <div class="staff-avatar-box">
                <div class="staff-avatar expand-avatar">
                    <i class="fa-solid fa-building-circle-arrow-right"></i>
                </div>
                <div class="staff-profile">
                    <span class="staff-name">扩建办公室</span>
                    <span class="staff-level">当前容量 ${gameState.employees.length}/${officeSlots}，最高 8 人</span>
                </div>
            </div>
            <div class="desk-status-text">新增 1 个员工槽位</div>
            <div class="desk-status-text expand-cost">¥${cost.toLocaleString()}</div>
            <div class="staff-actions">
                <button class="btn-research staff-empty-action" onclick="expandOfficeSlots()">
                    支付扩建费用
                </button>
            </div>
        `;
        container.appendChild(card);
    }
}

// 渲染作品陈列室
function loadHistoryReleases() {
    const emptyHtml = `<p style="text-align: center; color: var(--text-secondary); margin-top: 3rem;">尚未发布任何一款游戏，请前往左侧启动研发！</p>`;
    renderList(document.getElementById("history-releases"), gameState.releases, (game) => ({
        className: "history-item",
        html: `
            <div class="game-title-box">
                <span class="game-title">${escapeHtml(game.name)}</span>
                <span class="game-metadata">${TOPICS_DATA[game.topic].name} | ${GENRES_DATA[game.genre].name}</span>
            </div>
            <div class="game-rating-box">
                <i class="fa-solid fa-star"></i>口碑分 ${game.rating}
            </div>
            <div class="history-stat-box">
                <span class="history-stat-lbl">目标渠道</span>
                <span class="history-stat-val" style="color: var(--accent-neon);">${PLATFORMS_DATA[game.platform].name}</span>
            </div>
            <div class="history-stat-box">
                <span class="history-stat-lbl">积累粉丝</span>
                <span class="history-stat-val" style="color: var(--accent-pink);">+${game.fansGained} 人</span>
            </div>
            <div class="history-stat-box">
                <span class="history-stat-lbl">创造毛利</span>
                <span class="history-stat-val" style="color: var(--accent-yellow);">¥${game.revenueGenerated}</span>
            </div>
        `
    }), emptyHtml);
}

// 顶部核心数据 UI 缓存与数值变化闪烁动效
let lastUIStats = { funds: 0, fans: 0, rp: 0 };
let isUIInitialized = false;

function triggerValueFlash(elementId, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    // 先移除之前的动画类以触发重新播放
    el.classList.remove("flash-up", "flash-down");
    void el.offsetWidth; // 强制 Reflow
    el.classList.add(type === "up" ? "flash-up" : "flash-down");
}

// 渲染顶部数据
function updateStatsUI() {
    // 在更新数值前，进行高亮闪烁判定及飘字特效触发
    if (isUIInitialized) {
        if (lastUIStats.funds !== undefined) {
            if (gameState.funds > lastUIStats.funds) {
                triggerValueFlash("stat-funds", "up");
                spawnFloatingText(`+¥${Math.round(gameState.funds - lastUIStats.funds).toLocaleString()}`, "stat-funds", "up");
            }
            if (gameState.funds < lastUIStats.funds) {
                triggerValueFlash("stat-funds", "down");
                spawnFloatingText(`-¥${Math.round(lastUIStats.funds - gameState.funds).toLocaleString()}`, "stat-funds", "down");
            }
        }
        if (lastUIStats.fans !== undefined) {
            if (gameState.fans > lastUIStats.fans) {
                triggerValueFlash("stat-fans", "up");
                spawnFloatingText(`+${Math.round(gameState.fans - lastUIStats.fans).toLocaleString()} 粉丝`, "stat-fans", "up");
            }
            if (gameState.fans < lastUIStats.fans) {
                triggerValueFlash("stat-fans", "down");
                spawnFloatingText(`-${Math.round(lastUIStats.fans - gameState.fans).toLocaleString()} 粉丝`, "stat-fans", "down");
            }
        }
        if (lastUIStats.rp !== undefined) {
            if (gameState.rp > lastUIStats.rp) {
                triggerValueFlash("stat-rp", "up");
                spawnFloatingText(`+${gameState.rp - lastUIStats.rp} RP`, "stat-rp", "up");
            }
            if (gameState.rp < lastUIStats.rp) {
                triggerValueFlash("stat-rp", "down");
                spawnFloatingText(`-${lastUIStats.rp - gameState.rp} RP`, "stat-rp", "down");
            }
        }
    }

    // 更新缓存，以防下次判定偏离
    lastUIStats = {
        funds: gameState.funds,
        fans: gameState.fans,
        rp: gameState.rp
    };
    isUIInitialized = true;

    document.getElementById("stat-funds").innerText = `¥${gameState.funds.toLocaleString()}`;
    document.getElementById("stat-fans").innerText = gameState.fans.toLocaleString();
    document.getElementById("stat-rp").innerText = gameState.rp;
    document.getElementById("stat-date").innerText = `第 ${gameState.date.year} 年 ${gameState.date.month} 月 ${gameState.date.week} 周`;

    // 侧栏简报更新
    document.getElementById("aside-released-count").innerText = `${gameState.releases.length} 款`;
    const inc = document.getElementById("aside-last-income");
    inc.innerText = `${gameState.lastIncome >= 0 ? '+' : ''}¥${gameState.lastIncome.toLocaleString()}`;
    inc.style.color = gameState.lastIncome >= 0 ? "var(--accent-neon)" : "var(--accent-pink)";

    const weeklyWages = gameState.employees.reduce((sum, emp) => sum + emp.salary, 0);
    document.getElementById("aside-weekly-wages").innerText = `¥${weeklyWages}`;
    document.getElementById("aside-weekly-rent").innerText = `¥500`;
    const weeklyOut = weeklyWages + BALANCE.weeklyRent;
    const runwayWeeks = gameState.funds > 0 ? Math.floor(gameState.funds / Math.max(1, weeklyOut)) : 0;
    document.getElementById("aside-runway").innerText = `${runwayWeeks} 周`;
    document.getElementById("aside-runway").style.color = runwayWeeks < 6 ? "var(--accent-pink)" : runwayWeeks < 12 ? "var(--accent-yellow)" : "var(--accent-neon)";
    const summary = teamSummary();
    document.getElementById("aside-team-focus").innerText = summary.focus;
    const officeSlotEl = document.getElementById("aside-office-slots");
    if (officeSlotEl) {
        const officeSlots = gameState.officeSlots || 5;
        officeSlotEl.innerText = `${gameState.employees.length}/${officeSlots}`;
        officeSlotEl.style.color = gameState.employees.length >= officeSlots ? "var(--accent-yellow)" : "var(--accent-neon)";
    }
    const healthText = summary.avgFatigue > 70 ? "疲劳过高" : summary.avgMorale < 45 ? "士气低迷" : "稳定";
    document.getElementById("aside-team-health").innerText = `${healthText} (${summary.avgMorale}/${summary.avgFatigue})`;
    document.getElementById("aside-team-health").style.color = healthText === "稳定" ? "var(--accent-neon)" : "var(--accent-yellow)";
    document.getElementById("aside-next-action").innerText = nextActionHint(weeklyOut);

    // 财务折叠面板内容更新
    const lastSalesVal = gameState.lastSales || 0;
    document.getElementById("bill-game-sales").innerText = `+¥${lastSalesVal.toLocaleString()}`;
    document.getElementById("bill-employee-wages").innerText = `-¥${weeklyWages.toLocaleString()}`;

    // 趋势更新
    document.getElementById("aside-trend-genre").innerText = GENRES_DATA[gameState.activeTrend.genre].name;
    document.getElementById("aside-trend-topic").innerText = TOPICS_DATA[gameState.activeTrend.topic].name;
}

// 更新大趋势
function updateTrends() {
    const genres = Object.keys(GENRES_DATA);
    const topics = Object.keys(TOPICS_DATA);
    gameState.activeTrend.genre = genres[Math.floor(Math.random() * genres.length)];
    gameState.activeTrend.topic = topics[Math.floor(Math.random() * topics.length)];
    
    // 弹出轻微通知提示
    spawnFloatingText("市场趋势发生偏转！", "stat-date", "design");
}

// 飘字特效生成器 (优化性能：避免 getBoundingClientRect 触发强制 Reflow)
function spawnFloatingText(text, targetId, className) {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    // 动态确保目标父容器具有 relative 定位
    if (window.getComputedStyle(targetEl).position === "static") {
        targetEl.style.position = "relative";
    }

    const fl = document.createElement("div");
    fl.className = `floating-point ${className}`;
    fl.innerText = text;
    
    // 采用局部相对定位
    fl.style.position = "absolute";
    fl.style.left = `calc(50% + ${Math.random() * 30 - 15}px)`;
    fl.style.top = "-15px";
    fl.style.transform = "translateX(-50%)";

    targetEl.appendChild(fl);
    
    // 动画播放完直接摧毁
    setTimeout(() => {
        fl.remove();
    }, 1200);
}

// ==========================================================================
// 1. 销量趋势 SVG 折线图绘制引擎 (SVG Trend Chart Drawer)
// ==========================================================================
function drawTrendChart(containerId, rating) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const baseValue = Math.round(rating * rating * 90 + 250);
    let data = [];
    for (let i = 0; i < 8; i++) {
        const factor = Math.pow(0.65 + (rating * 0.02), i);
        data.push(Math.round(baseValue * factor + Math.random() * (baseValue * 0.05)));
    }

    const width = container.clientWidth || 400;
    const height = 120;
    const paddingX = 35;
    const paddingY = 18;

    const maxVal = Math.max(...data) * 1.15 || 100;
    const minVal = 0;

    const getX = (idx) => paddingX + (idx * (width - paddingX * 2) / (data.length - 1));
    const getY = (val) => height - paddingY - ((val - minVal) * (height - paddingY * 2) / (maxVal - minVal));

    let svgContent = `
        <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--accent-neon)" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="var(--accent-neon)" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <line x1="${paddingX}" y1="${getY(maxVal*0.75)}" x2="${width - paddingX}" y2="${getY(maxVal*0.75)}" class="chart-grid-line" />
            <line x1="${paddingX}" y1="${getY(maxVal*0.5)}" x2="${width - paddingX}" y2="${getY(maxVal*0.5)}" class="chart-grid-line" />
            <line x1="${paddingX}" y1="${getY(maxVal*0.25)}" x2="${width - paddingX}" y2="${getY(maxVal*0.25)}" class="chart-grid-line" />
            
            <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
    `;

    let polylinePoints = [];
    let areaPoints = [`${getX(0)},${height - paddingY}`];

    data.forEach((val, idx) => {
        const px = getX(idx);
        const py = getY(val);
        polylinePoints.push(`${px},${py}`);
        areaPoints.push(`${px},${py}`);
        
        svgContent += `<circle cx="${px}" cy="${py}" class="chart-dot"><title>第${idx+1}周销量: ${val}份</title></circle>`;
        svgContent += `<text x="${px}" y="${height - 4}" class="chart-label" text-anchor="middle">W${idx+1}</text>`;
    });
    areaPoints.push(`${getX(data.length - 1)},${height - paddingY}`);

    svgContent = `
        <path d="M ${areaPoints.join(' L ')} Z" class="chart-area" />
        <path d="M ${polylinePoints.join(' L ')}" class="chart-path" />
    ` + svgContent;

    svgContent += `
        <text x="${paddingX - 5}" y="${getY(data[0]) + 4}" class="chart-label" text-anchor="end">${data[0]}</text>
        <text x="${paddingX - 5}" y="${height - paddingY + 4}" class="chart-label" text-anchor="end">0</text>
        </svg>
    `;

    container.innerHTML = svgContent;
}

