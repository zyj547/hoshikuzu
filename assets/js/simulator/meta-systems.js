// ==========================================================================
// 2. 发行商选择控制与交互 (Publisher Management)
// ==========================================================================
let tempPublisherType = "self";

function showPublisherModal() {
    document.getElementById("publisher-modal").classList.add("active");
    selectPublisherOption("self");
}

function selectPublisherOption(pubType) {
    tempPublisherType = pubType;
    
    // 样式更新
    const cards = ["self", "tiktok", "steam"];
    cards.forEach(type => {
        const cardEl = document.getElementById(`pub-card-${type}`);
        if (type === pubType) {
            cardEl.classList.add("selected");
        } else {
            cardEl.classList.remove("selected");
        }
    });
}

function confirmPublisherSelection() {
    if (tempPublisherType === "steam" && gameState.funds < 5000) {
        alert("当前资金不足 ¥5,000，无法支付 Steam 发行申请金！请选择其他渠道。");
        return;
    }
    // 真正进行游戏发布
    releaseGame(tempPublisherType);
}

// ==========================================================================
// 3. 破产保护与勋章特权商店 (Bankruptcy & Medal Perks Shop)
// ==========================================================================
async function confirmRestartGame() {
    playSFX("click");
    const ok = await confirm("⚠️ 确定要立刻申请【破产清盘】吗？\n\n这会立刻终结当前的创业周目，当前积累的所有成果与粉丝将按照公式折算为【桔子勋章】！\n您可以携带勋章在多周目特权商店兑换初始资金加倍、动作地牢等继承特权，开启全新的橙色创业帝国之旅！");
    if (ok) {
        triggerBankruptcy();
    }
}

async function resetAllGameData() {
    playSFX("click");
    const ok = await confirm("⚠️ 警告：这会彻底删除您当前的游戏进度、所有多周目特权、已积累的【桔子勋章】！\n\n此操作不可逆，确定要清除所有存档并完全重置游戏吗？");
    if (ok) {
        localStorage.removeItem("hoshikuzu_tycoon_save");
        localStorage.removeItem("orange_medals");
        await alert("已成功清除本地所有数据！页面即将刷新重新开始。");
        window.location.reload();
    }
}

// ==========================================================================
// 数据分享与存档导入/导出逻辑
// ==========================================================================
function openShareModal() {
    if (typeof playSFX === "function") {
        playSFX("click");
    }
    
    // 编译成就分享卡片文本
    const achievementText = `🏆 【${gameState.companyName}】独立创业战绩卡 🏆
──────────────────────────────
🍊 游戏：《桔子创业模拟器》
📅 创业年份：第 ${gameState.date.year} 年 ${gameState.date.month} 月第 ${gameState.date.week} 周
💰 当前资金：¥${Math.round(gameState.funds).toLocaleString()}
👥 拥有粉丝：${gameState.fans.toLocaleString()} 人
💡 研发实力 (RP)：${gameState.rp}
🎮 独立游戏发行总量：${gameState.releases.length} 款
🏅 累积获得【桔子勋章】：${orangeMedalsCount} 枚
──────────────────────────────
快来与我一决高下，开启您的橙色独立游戏帝国之旅吧！`;
    
    document.getElementById("share-achievement-text").innerText = achievementText;
    
    // 生成存档 Base64 编码数据
    try {
        const saveData = {
            save: gameState,
            medals: orangeMedalsCount
        };
        const jsonStr = JSON.stringify(saveData);
        const base64 = utf8ToBase64(jsonStr);
        document.getElementById("share-export-code").value = base64;
    } catch (err) {
        console.error("存档码生成失败", err);
        document.getElementById("share-export-code").value = "存档码生成失败，请重试";
    }
    
    // 清空导入输入框
    document.getElementById("share-import-code").value = "";
    
    // 默认切回成就分享标签
    switchShareTab("achievement");
    
    // 打开模态框
    document.getElementById("share-modal").classList.add("active");
}

function closeShareModal() {
    if (typeof playSFX === "function") {
        playSFX("click");
    }
    document.getElementById("share-modal").classList.remove("active");
}

function switchShareTab(tab) {
    if (typeof playSFX === "function") {
        playSFX("click");
    }
    
    const tabAchievementBtn = document.getElementById("tab-share-achievement");
    const tabSaveBtn = document.getElementById("tab-share-save");
    const panelAchievement = document.getElementById("share-panel-achievement");
    const panelSave = document.getElementById("share-panel-save");
    
    if (tab === "achievement") {
        tabAchievementBtn.classList.add("active");
        tabSaveBtn.classList.remove("active");
        panelAchievement.style.display = "block";
        panelSave.style.display = "none";
    } else {
        tabAchievementBtn.classList.remove("active");
        tabSaveBtn.classList.add("active");
        panelAchievement.style.display = "none";
        panelSave.style.display = "block";
    }
}

function copyAchievementCard() {
    const text = document.getElementById("share-achievement-text").innerText;
    navigator.clipboard.writeText(text).then(() => {
        if (typeof playSFX === "function") playSFX("success");
        spawnFloatingText("成就已复制！", "tab-share-achievement", "up");
    }).catch(err => {
        // 回退方案
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        if (typeof playSFX === "function") playSFX("success");
        spawnFloatingText("成就已复制！", "tab-share-achievement", "up");
    });
}

function copyExportSaveCode() {
    const text = document.getElementById("share-export-code").value;
    navigator.clipboard.writeText(text).then(() => {
        if (typeof playSFX === "function") playSFX("success");
        spawnFloatingText("存档码已复制！", "tab-share-save", "up");
    }).catch(err => {
        // 回退方案
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        if (typeof playSFX === "function") playSFX("success");
        spawnFloatingText("存档码已复制！", "tab-share-save", "up");
    });
}

async function importSaveCode() {
    const base64 = document.getElementById("share-import-code").value.trim();
    if (!base64) {
        alert("请先粘贴存档码！", "系统提示");
        return;
    }
    
    try {
        // 解码 Base64 并反序列化
        const jsonStr = base64ToUtf8(base64);
        const parsed = JSON.parse(jsonStr);
        
        // 数据完整性验证
        if (!parsed || typeof parsed !== "object" || !parsed.save || parsed.medals === undefined) {
            throw new Error("格式不完整");
        }
        
        const save = sanitizeSave(parsed.save);
        const medals = sanitizeMedalCount(parsed.medals);
        
        // 二次确认覆盖
        const confirmOk = await confirm("⚠️ 警告：导入此存档码会彻底覆盖您当前的单局进度及积累的全部勋章！\n\n您确定要覆盖数据并载入此存档吗？");
        if (confirmOk) {
            localStorage.setItem(SAVE_KEY, JSON.stringify(save));
            localStorage.setItem("orange_medals", medals.toString());
            closeShareModal();
            await alert("🎉 存档导入成功！页面即将重载载入新进度。");
            window.location.reload();
        }
    } catch (err) {
        if (typeof playSFX === "function") playSFX("bug");
        alert("⚠️ 导入失败：存档码无效、已损坏或数据字段不兼容！", "系统提示");
        console.error("导入存档失败", err);
    }
}

// ==========================================================================
// 编年史 (工作室大事件发展志)
// ==========================================================================
function addChronicleEntry(text) {
    if (!gameState.chronology) {
        gameState.chronology = [];
    }
    const dateStr = `第 ${gameState.date.year} 年 ${gameState.date.month} 月第 ${gameState.date.week} 周`;
    gameState.chronology.push({
        date: dateStr,
        text: text
    });
    if (gameState.chronology.length > 100) {
        gameState.chronology.shift();
    }
    saveGame();
}

function switchHistoryTab(tab) {
    playSFX("click");
    const btnGames = document.getElementById("tab-history-games");
    const btnChronicle = document.getElementById("tab-history-chronicle");
    const panelGames = document.getElementById("history-releases");
    const panelChronicle = document.getElementById("history-chronicle");

    if (tab === "games") {
        btnGames.classList.add("active");
        btnChronicle.classList.remove("active");
        panelGames.style.display = "flex";
        panelChronicle.style.display = "none";
        loadHistoryReleases();
    } else {
        btnGames.classList.remove("active");
        btnChronicle.classList.add("active");
        panelGames.style.display = "none";
        panelChronicle.style.display = "flex";
        loadChronicleTimeline();
    }
}

function loadChronicleTimeline() {
    const container = document.getElementById("history-chronicle");
    container.innerHTML = "";

    if (!gameState.chronology || gameState.chronology.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 3rem;">尚未产生大事件记录，去发行第一款游戏或招募员工吧！</p>`;
        return;
    }

    const list = [...gameState.chronology].reverse();
    list.forEach(entry => {
        const node = document.createElement("div");
        node.className = "chronicle-node";
        node.style.position = "relative";
        node.style.paddingLeft = "1.5rem";
        node.style.marginBottom = "1.2rem";
        node.style.textAlign = "left";
        
        const dot = document.createElement("div");
        dot.style.position = "absolute";
        dot.style.left = "-5px";
        dot.style.top = "6px";
        dot.style.width = "10px";
        dot.style.height = "10px";
        dot.style.borderRadius = "50%";
        dot.style.background = "var(--accent-yellow)";
        dot.style.boxShadow = "0 0 8px var(--accent-yellow)";
        node.appendChild(dot);

        const time = document.createElement("span");
        time.style.fontSize = "0.78rem";
        time.style.color = "var(--accent-neon)";
        time.style.fontWeight = "bold";
        time.style.display = "block";
        time.innerText = entry.date;

        const text = document.createElement("p");
        text.style.fontSize = "0.85rem";
        text.style.color = "var(--text-primary)";
        text.style.margin = "0.2rem 0 0 0";
        text.style.lineHeight = "1.4";
        text.textContent = entry.text;

        node.appendChild(time);
        node.appendChild(text);
        container.appendChild(node);
    });
}

// ==========================================================================
// 财务明细手风琴折叠
// ==========================================================================
function toggleWeeklyBill() {
    playSFX("click");
    const panel = document.getElementById("weekly-bill-details");
    const arrow = document.getElementById("bill-arrow");
    if (panel.style.display === "none") {
        panel.style.display = "flex";
        arrow.style.transform = "rotate(180deg)";
    } else {
        panel.style.display = "none";
        arrow.style.transform = "rotate(0deg)";
    }
}

// ==========================================================================
// 互动式 Debug 灭虫小游戏逻辑
// ==========================================================================
let bugSpawnInterval = null;

function startBugSpawning() {
    if (bugSpawnInterval) return;
    const zone = document.getElementById("bug-spawn-zone");
    if (!zone) return;
    zone.innerHTML = "";
    
    bugSpawnInterval = setInterval(() => {
        const proj = gameState.currentProject;
        if (!proj || proj.state !== "debugging" || proj.bugs <= 0) {
            stopBugSpawning();
            return;
        }
        
        if (zone.children.length >= 6) return; // 限制同屏上限
        
        const bug = document.createElement("div");
        bug.className = "spawned-bug";
        bug.innerHTML = `<i class="fa-solid fa-bug"></i>`;
        bug.style.position = "absolute";
        
        const x = Math.random() * 80 + 10;
        const y = Math.random() * 50 + 25;
        bug.style.left = `${x}%`;
        bug.style.top = `${y}%`;
        bug.style.pointerEvents = "auto";
        bug.style.cursor = "pointer";
        bug.style.fontSize = `${1.2 + Math.random() * 0.5}rem`;
        bug.style.color = "var(--accent-pink)";
        bug.style.filter = "drop-shadow(0 0 5px var(--accent-pink))";
        bug.style.transition = "transform 0.18s ease, opacity 0.18s";
        bug.style.animation = `bug-wiggle ${0.4 + Math.random() * 0.4}s infinite alternate ease-in-out`;
        
        bug.onclick = (e) => {
            e.stopPropagation();
            proj.bugs = Math.max(0, proj.bugs - 1);
            playSFX("zap");
            
            const rect = zone.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            const fl = document.createElement("div");
            fl.className = "floating-point down";
            fl.innerText = "-1 BUG";
            fl.style.position = "absolute";
            fl.style.left = `${clickX}px`;
            fl.style.top = `${clickY}px`;
            fl.style.transform = "translate(-50%, -50%)";
            fl.style.pointerEvents = "none";
            fl.style.zIndex = "100";
            zone.appendChild(fl);
            setTimeout(() => fl.remove(), 1200);
            
            bug.style.transform = "scale(0) rotate(180deg)";
            bug.style.opacity = "0";
            setTimeout(() => bug.remove(), 200);
            
            if (proj.bugs <= 0) {
                proj.bugs = 0;
                proj.state = "finished";
                playSFX("success");
                stopBugSpawning();
            }
            updateDevStatsUI();
        };
        zone.appendChild(bug);
    }, 1200);
}

function stopBugSpawning() {
    if (bugSpawnInterval) {
        clearInterval(bugSpawnInterval);
        bugSpawnInterval = null;
    }
    const zone = document.getElementById("bug-spawn-zone");
    if (zone) zone.innerHTML = "";
}

// ==========================================================================
// 员工专精分支逻辑
// ==========================================================================
let tempSpecializingIndex = null;

function openSpecialtyModal(empIdx) {
    tempSpecializingIndex = empIdx;
    const emp = gameState.employees[empIdx];
    if (!emp) return;

    playSFX("click");
    
    const descEl = document.getElementById("specialty-modal-desc");
    descEl.innerHTML = `请选择 <strong>${escapeHtml(emp.name)}</strong> 的终身发展方向（等级限制：Lv.5以上，单次可选）：`;

    const container = document.getElementById("specialty-choices-container");
    container.innerHTML = "";

    let options = [];
    if (emp.role === "programmer") {
        options = [
            {
                key: "engine",
                name: "引擎架构师 (Engine Architect)",
                desc: "提升核心算法，游戏开发进度推进速度额外提升 25%，自身代码产出提高 40%。",
                icon: "fa-laptop-code",
                color: "var(--accent-neon)"
            },
            {
                key: "fullstack",
                name: "全栈工程师 (Full-Stack Developer)",
                desc: "融会贯通，自身获得额外的 30% 代码实力输出与 30% 策划设计点数输出。",
                icon: "fa-network-wired",
                color: "var(--accent-neon)"
            }
        ];
    } else if (emp.role === "artist") {
        options = [
            {
                key: "concept",
                name: "原画主美 (Concept Lead)",
                desc: "精修原画与UI设定，自身美术表现点数产出提高 50%。",
                icon: "fa-palette",
                color: "var(--accent-pink)"
            },
            {
                key: "animator",
                name: "特效主美 (UI Animator)",
                desc: "专攻视觉特效，研发并发行【休闲类】或【地牢冒险类】游戏时，评分提升 5%。",
                icon: "fa-wand-magic-sparkles",
                color: "var(--accent-pink)"
            }
        ];
    } else if (emp.role === "designer") {
        options = [
            {
                key: "systems",
                name: "系统策划 (Systems Designer)",
                desc: "打通平台商业通道，项目立项平台配额金成本减少 15% (可叠加，上限 30%)。",
                icon: "fa-gears",
                color: "var(--accent-yellow)"
            },
            {
                key: "writer",
                name: "创意主笔 (Creative Writer)",
                desc: "专攻剧本架构，策划产出增幅 40%，且新游发售获得的粉丝基数增幅 20%。",
                icon: "fa-pen-fancy",
                color: "var(--accent-yellow)"
            }
        ];
    }

    options.forEach(opt => {
        const card = document.createElement("div");
        card.className = "choice-btn";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "flex-start";
        card.style.gap = "0.4rem";
        card.style.padding = "1rem";
        card.style.textAlign = "left";
        card.style.cursor = "pointer";
        
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem; font-weight:bold; color:${opt.color};">
                <i class="fa-solid ${opt.icon}"></i> ${opt.name}
            </div>
            <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4; margin:0;">${opt.desc}</p>
        `;
        card.onclick = () => chooseSpecialty(opt.key);
        container.appendChild(card);
    });

    document.getElementById("specialty-modal").classList.add("active");
}

function closeSpecialtyModal() {
    playSFX("click");
    document.getElementById("specialty-modal").classList.remove("active");
}

async function chooseSpecialty(key) {
    if (tempSpecializingIndex === null) return;
    const emp = gameState.employees[tempSpecializingIndex];
    if (!emp) return;

    const specialtyNames = {
        engine: "引擎架构师",
        fullstack: "全栈工程师",
        concept: "原画主美",
        animator: "特效主美",
        systems: "系统策划",
        writer: "创意主笔"
    };

    playSFX("success");
    emp.specialty = key;
    
    // 写入大事记
    addChronicleEntry(`🌟 团队核心【${emp.name}】精修学业，成功晋升专精角色【${specialtyNames[key]}】！`);

    saveGame();
    closeSpecialtyModal();
    loadOfficeDesks();
    await alert(`恭喜！员工 ${escapeHtml(emp.name)} 已成功晋升为：${specialtyNames[key]}！专属特权已永久激活。`, "工作室人才专精简报");
}

function triggerBankruptcy() {
    playSFX("bankruptcy");
    clearInterval(loopInterval); // 暂停主时钟

    // 计算本局成绩
    const gamesCount = gameState.releases.length;
    const maxFans = gameState.fans;
    const finalMedals = Math.max(1, Math.floor(maxFans / 800) + Math.floor(gamesCount / 4));

    // 更新多周目勋章数据
    orangeMedalsCount += finalMedals;
    localStorage.setItem("orange_medals", orangeMedalsCount);

    // 渲染数据
    document.getElementById("settle-games-count").innerText = `${gamesCount} 款`;
    document.getElementById("settle-max-fans").innerText = `${maxFans} 名`;
    document.getElementById("settle-final-funds").innerText = `¥${Math.round(gameState.funds).toLocaleString()}`;
    document.getElementById("settle-medals-gained").innerText = `+${finalMedals} 枚`;

    // 弹出结算浮层
    document.getElementById("bankruptcy-modal").classList.add("active");
}

function goToMedalShop() {
    document.getElementById("bankruptcy-modal").classList.remove("active");
    
    // 重置特权商店选中状态
    shopSelectedPerks = { fundsBoost: false, roguelikeUnlocked: false, fansGrowthBoost: false };
    
    updateMedalShopUI();
    document.getElementById("medal-shop-modal").classList.add("active");
}

// 计算所选特权的勋章总花费（fundsBoost=1 / roguelike=2 / fansGrowth=3）
function perkCost(perks) {
    return (perks.fundsBoost ? 1 : 0)
        + (perks.roguelikeUnlocked ? 2 : 0)
        + (perks.fansGrowthBoost ? 3 : 0);
}

function updateMedalShopUI() {
    document.getElementById("shop-owned-medals").innerText = `${orangeMedalsCount} 枚`;
    
    const totalCost = perkCost(shopSelectedPerks);

    document.getElementById("shop-total-cost").innerText = totalCost;
    document.getElementById("shop-remaining-medals").innerText = orangeMedalsCount - totalCost;

    // 按钮高亮与状态
    const perks = [
        { key: "fundsBoost", rowId: "perk-row-funds", badgeId: "perk-badge-funds" },
        { key: "roguelikeUnlocked", rowId: "perk-row-rogue", badgeId: "perk-badge-rogue" },
        { key: "fansGrowthBoost", rowId: "perk-row-fans", badgeId: "perk-badge-fans" }
    ];

    perks.forEach(p => {
        const row = document.getElementById(p.rowId);
        const badge = document.getElementById(p.badgeId);
        if (shopSelectedPerks[p.key]) {
            row.classList.add("perk-selected");
            badge.innerText = "已选中";
            badge.style.borderColor = "var(--accent-yellow)";
            badge.style.color = "var(--accent-yellow)";
        } else {
            row.classList.remove("perk-selected");
            badge.innerText = "未选中";
            badge.style.borderColor = "rgba(255,255,255,0.2)";
            badge.style.color = "var(--text-secondary)";
        }
    });
}

function togglePerkSelection(perkKey, cost) {
    playSFX("click");
    let tempCost = cost;
    if (shopSelectedPerks[perkKey]) {
        shopSelectedPerks[perkKey] = false;
    } else {
        // 计算当前已扣除
        const currentCost = perkCost(shopSelectedPerks);

        if (currentCost + cost > orangeMedalsCount) {
            alert("⚠️ 您的桔子勋章余额不足，无法选购此特权！可通过多周目创业破产获取更多勋章。");
            return;
        }
        shopSelectedPerks[perkKey] = true;
    }
    updateMedalShopUI();
}

function applyMedalShopPerksAndStart() {
    playSFX("success");
    const totalCost = perkCost(shopSelectedPerks);

    orangeMedalsCount -= totalCost;
    localStorage.setItem("orange_medals", orangeMedalsCount);

    // 全局重置 gameState（基于默认结构，叠加勋章商店购买的继承特权）
    gameState = createDefaultGameState();
    gameState.funds = shopSelectedPerks.fundsBoost ? 80000 : 50000;
    gameState.unlockedGenres = shopSelectedPerks.roguelikeUnlocked ? ["Casual", "Roguelike"] : ["Casual"];
    gameState.activePerks = { ...shopSelectedPerks };

    saveGame();
    addChronicleEntry("🍊 桔子网络工作室正式重组成立！承载着勋章特权，开启全新的征程。");
    document.getElementById("medal-shop-modal").classList.remove("active");
    
    // 重新开启定时时钟
    startGameClock();
    
    // 重新初始化页面
    loadOfficeDesks();
    generateHiringPool();
    isUIInitialized = false; // 重置标识，避免闪烁上个周目的结算变动数值
    updateStatsUI();
    switchScreen('office');
    
    alert("🍊 工作室重组成功！携带您的继承特权，正式开启全新的桔子创业帝国之旅！");
}

