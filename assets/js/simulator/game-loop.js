// ==========================================================================
// 推进式时间系统 (Player-Driven Advance Clock)
// 世界默认静止，只有玩家下达「推进至…」指令后，时间才按周流逝并在锚点暂停。
// ==========================================================================
let advanceTimer = null;     // 当前推进的 setInterval 句柄
let advanceRemaining = 0;    // 剩余要推进的周数
let advanceReason = "";      // 推进目标，用于到点后的提示（"week"/"payday"/"event"/"card"）
let advanceOnDone = null;    // 推进结束后的回调（卡片研发用）

function isAdvancing() {
    return advanceTimer !== null;
}

// 是否处于「不能推进」的阻塞态（有弹窗时）
function isGameBlocked() {
    const modals = ["custom-alert-modal", "custom-confirm-modal", "share-modal", "review-modal",
        "event-modal", "publisher-modal", "bankruptcy-modal", "medal-shop-modal", "founder-modal", "card-result-modal", "stageup-modal"];
    return modals.some(id => {
        const el = document.getElementById(id);
        return el && el.classList.contains("active");
    });
}

// 兼容旧调用名
function isGamePaused() { return isGameBlocked(); }

function stopAdvance() {
    if (advanceTimer) {
        clearInterval(advanceTimer);
        advanceTimer = null;
    }
    advanceRemaining = 0;
    advanceReason = "";
    advanceOnDone = null;
    updateAdvanceUI();
}

// 核心入口：推进 weeks 周；reason 决定锚点；onDone 在自然走完后触发
function startAdvance(weeks, reason = "week", onDone = null) {
    if (isAdvancing() || isGameBlocked()) return;
    if (!gameState.founderBackground) return; // 尚未选择创始人背景
    advanceRemaining = Math.max(1, Math.round(weeks));
    advanceReason = reason;
    advanceOnDone = onDone;

    advanceTimer = setInterval(() => {
        if (isGameBlocked()) return; // 弹窗期间冻结，不消耗时间
        const interrupted = weeklyStep();
        advanceRemaining--;

        if (interrupted) {
            // 重大事件强制暂停（破产 / 空窗随机事件）
            stopAdvance();
            return;
        }
        if (advanceRemaining <= 0) {
            const done = advanceOnDone;
            const why = advanceReason;
            stopAdvance();
            if (typeof done === "function") {
                done();
            } else if (why === "payday") {
                showPaydayBrief();
            }
        }
    }, BALANCE.stepMs);

    updateAdvanceUI();
}

// 推进至发薪日（本月月末）
function advanceToPayday() {
    const weeksLeft = (4 - gameState.date.week) + 1; // 到下个月初
    startAdvance(weeksLeft, "payday");
}

// 推进至下一个关键节点（空窗期：等待随机事件/趋势/RP 积累，最多 12 周）
function advanceToNextBeat() {
    startAdvance(12, "event");
}

// ==========================================================================
// 单周结算（推进过程中每“周”执行一次）
// 返回 true 表示触发了需强制暂停的重大事件。
// ==========================================================================
function weeklyStep() {
    let interrupted = false;

    // 递增周数
    gameState.date.week++;
    let isPayday = false;
    if (gameState.date.week > 4) {
        gameState.date.week = 1;
        gameState.date.month++;
        isPayday = true; // 跨月 => 发薪日
        if (gameState.date.month > 12) {
            gameState.date.month = 1;
            gameState.date.year++;
        }
    }

    // 每周固定租金
    gameState.funds -= BALANCE.weeklyRent;

    // 月薪制：仅在发薪日统一扣除全员月薪
    let wagesPaid = 0;
    if (isPayday) {
        wagesPaid = gameState.employees.reduce((sum, emp) => sum + emp.salary, 0);
        gameState.funds -= wagesPaid;
    }

    // 在售游戏的持续营收（含市场疲劳已写入 rating，不再重复）
    let weeklySales = 0;
    gameState.releases.forEach(game => {
        if (game.weeksSinceRelease < BALANCE.salesWindowWeeks) {
            const decay = Math.pow(BALANCE.revenueDecay, game.weeksSinceRelease);
            const baseRevenue = game.rating * BALANCE.revenuePerRating * (1 + gameState.fans * BALANCE.fansRevenueFactor) * PLATFORMS_DATA[game.platform].scale;
            const shareMultiplier = BALANCE.publisherShare[game.publisher] ?? 1.0;
            const thisWeekRev = Math.round(baseRevenue * decay * shareMultiplier);
            weeklySales += thisWeekRev;
            game.revenueGenerated += thisWeekRev;
            game.weeksSinceRelease++;
        }
    });
    gameState.funds += weeklySales;

    // 负债利息：资金为负时持续承压
    let interest = 0;
    if (gameState.funds < 0) {
        interest = Math.round(Math.abs(gameState.funds) * BALANCE.debtInterestRate);
        gameState.funds -= interest;
    }

    gameState.lastSales = weeklySales;
    gameState.lastIncome = weeklySales - BALANCE.weeklyRent - wagesPaid - interest;

    // 特权 / 科技带来的每周粉丝增长
    if (gameState.activePerks && gameState.activePerks.fansGrowthBoost) {
        gameState.fans += BALANCE.fansBoostPerWeek;
    }
    if (gameState.researchPerks && gameState.researchPerks.community) {
        gameState.fans += 8;
    }

    // 统计本周处于研发态的项目数（主项目开发/打磨 + 各辅助项目），决定团队产能分配
    const mainDeveloping = gameState.currentProject &&
        (gameState.currentProject.state === "developing" || gameState.currentProject.state === "polishing");
    const auxCount = (gameState.auxProjects || []).filter(a => a.state === "developing").length;
    const activeDevCount = (mainDeveloping ? 1 : 0) + auxCount;

    if (activeDevCount === 0) {
        // 空窗期：员工恢复 + 闲置积累 RP
        gameState.employees.forEach(emp => {
            emp.fatigue = Math.max(0, (emp.fatigue || 0) - 8);
            emp.morale = Math.min(100, (emp.morale == null ? 75 : emp.morale) + 2);
            const rpChance = BALANCE.idleRpChance + (gameState.researchPerks && gameState.researchPerks.analytics ? 0.08 : 0);
            if (Math.random() < rpChance) {
                let rpGained = emp.level * (Math.random() > 0.5 ? 1 : 2);
                if (emp.trait === "idea") rpGained = Math.round(rpGained * BALANCE.ideaTraitMultiplier);
                if (gameState.researchPerks && gameState.researchPerks.analytics) rpGained += 1;
                gameState.rp += rpGained;
            }
        });
    } else {
        // 研发期：团队产能在所有在研项目间分摊（并行的代价 = 各自更慢）
        const rate = 1 / activeDevCount;
        applyWeeklyDevFatigue();
        accumulateDevPoints(rate);
        tickAuxProjects(rate);
    }

    // 趋势刷新
    if (Math.random() < trendUpdateChance()) {
        updateTrends();
    }

    // 空窗期偶发随机事件（强制暂停处理）
    if (!gameState.currentProject && Math.random() < BALANCE.randomEventChance) {
        triggerRandomEvent();
        interrupted = true;
    }

    // 破产线
    if (gameState.funds < BALANCE.bankruptcyThreshold) {
        triggerBankruptcy();
        interrupted = true;
    }

    saveGame();
    updateStatsUI();
    refreshActiveScreen();
    return interrupted;
}

// 破产老兵：更敏锐捕捉趋势 => 更高刷新概率
function trendUpdateChance() {
    return BALANCE.trendUpdateChance + (gameState.founderBackground === "veteran" ? 0.06 : 0);
}

// 发薪日财务简报
function showPaydayBrief() {
    const wages = gameState.employees.reduce((sum, emp) => sum + emp.salary, 0);
    const fundsTone = gameState.funds < 0 ? "var(--accent-pink)" : "var(--accent-neon)";
    const msg = `
        <div style="text-align:left; display:flex; flex-direction:column; gap:0.5rem;">
            <div style="font-weight:700; color:#fff;">📅 第 ${gameState.date.year} 年 ${gameState.date.month} 月 · 发薪日结算</div>
            <div style="display:flex; justify-content:space-between;"><span>本月员工月薪</span><span style="color:var(--accent-pink);">-¥${wages.toLocaleString()}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>当前资金余额</span><span style="color:${fundsTone};">¥${Math.round(gameState.funds).toLocaleString()}</span></div>
        </div>`;
    alert(msg, "财务简报");
}

// ==========================================================================
// 推进控制条 UI 同步
// ==========================================================================
function updateAdvanceUI() {
    const statusEl = document.getElementById("advance-status");
    if (statusEl) {
        statusEl.innerText = isAdvancing()
            ? `推进中… 剩余 ${advanceRemaining} 周`
            : "时间静止 · 等待您的指令";
        statusEl.style.color = isAdvancing() ? "var(--accent-yellow)" : "var(--text-secondary)";
    }
    document.querySelectorAll(".advance-btn").forEach(btn => {
        btn.disabled = isAdvancing();
    });
    const pauseBtn = document.getElementById("advance-pause-btn");
    if (pauseBtn) pauseBtn.style.display = isAdvancing() ? "" : "none";
}
