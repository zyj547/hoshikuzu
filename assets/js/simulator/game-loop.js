// ==========================================================================
// 核心时钟 (Game Tick Loop)
// ==========================================================================
function gameTick() {
    // 如果有任何模态弹窗激活，暂停时钟推进
    if (isGamePaused()) return;

    // 递增周数
    gameState.date.week++;
    if (gameState.date.week > 4) {
        gameState.date.week = 1;
        gameState.date.month++;
        if (gameState.date.month > 12) {
            gameState.date.month = 1;
            gameState.date.year++;
        }
    }

    // 处理每周支出 (租金与员工工资)
    const weeklyWages = gameState.employees.reduce((sum, emp) => sum + emp.salary, 0);
    const totalOut = weeklyWages + BALANCE.weeklyRent;

    gameState.funds -= totalOut;

    // 处理每日销量带来的持续收益
    let weeklySales = 0;
    gameState.releases.forEach(game => {
        if (game.weeksSinceRelease < BALANCE.salesWindowWeeks) {
            // 收益计算衰减
            const decay = Math.pow(BALANCE.revenueDecay, game.weeksSinceRelease);
            let baseRevenue = game.rating * BALANCE.revenuePerRating * (1 + gameState.fans * BALANCE.fansRevenueFactor) * PLATFORMS_DATA[game.platform].scale;

            // 应用发行商的分成政策（保留比例，未知发行商默认全额自营）
            const shareMultiplier = BALANCE.publisherShare[game.publisher] ?? 1.0;

            let thisWeekRev = Math.round(baseRevenue * decay * shareMultiplier);
            weeklySales += thisWeekRev;
            game.revenueGenerated += thisWeekRev;
            game.weeksSinceRelease++;
        }
    });

    gameState.funds += weeklySales;
    gameState.lastSales = weeklySales;
    gameState.lastIncome = weeklySales - totalOut;

    // 大厂光环：名气回流特权（多周目特权）
    if (gameState.activePerks && gameState.activePerks.fansGrowthBoost) {
        gameState.fans += BALANCE.fansBoostPerWeek;
    }

    // 闲置状态下员工积累研发点 (RP)
    if (!gameState.currentProject) {
        gameState.employees.forEach(emp => {
            // 每个人闲置时有几率积累 RP
            if (Math.random() < BALANCE.idleRpChance) {
                let rpGained = emp.level * (Math.random() > 0.5 ? 1 : 2);
                if (emp.trait === "idea") {
                    rpGained = Math.round(rpGained * BALANCE.ideaTraitMultiplier); // 灵感爆棚特质
                }
                gameState.rp += rpGained;
            }
        });
    } else {
        // 如果在开发中，处理开发进度
        developProgressTick();
    }

    // 偶尔更新热门趋势
    if (Math.random() < BALANCE.trendUpdateChance) {
        updateTrends();
    }

    // 偶尔触发随机事件
    if (Math.random() < BALANCE.randomEventChance) {
        triggerRandomEvent();
    }

    // 数据检测，若资金赤字严重提示游戏结束 (破产)
    if (gameState.funds < BALANCE.bankruptcyThreshold) {
        triggerBankruptcy();
    }

    // 保存进度并更新界面
    saveGame();
    updateStatsUI();
    
    // 重刷当前视图
    refreshActiveScreen();
}

