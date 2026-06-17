// ==========================================================================
// 开发模块 (Game R&D Engine)
// ==========================================================================
let selectedPlatform = "Mobile";
let selectedGenre = "Casual";
let selectedTopic = "Laborer";

function getSystemsDiscount() {
    let systemsDiscount = 0;
    gameState.employees.forEach(emp => {
        if (emp.specialty === "systems") {
            systemsDiscount += 0.15;
        }
    });
    return Math.min(systemsDiscount, 0.30);
}

function calculateProjectCost(platformKey = selectedPlatform, genreKey = selectedGenre, topicKey = selectedTopic) {
    const systemsDiscount = getSystemsDiscount();
    const platformCost = Math.round(PLATFORMS_DATA[platformKey].cost * (1 - systemsDiscount));
    const genreCost = GENRES_DATA[genreKey].cost;
    const topicCost = TOPICS_DATA[topicKey].cost;
    return {
        platformCost,
        genreCost,
        topicCost,
        totalCost: platformCost + genreCost + topicCost + 1000,
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
    const moraleFactor = 0.75 + ((emp.morale == null ? 75 : emp.morale) / 100) * 0.35;
    const fatiguePenalty = 1 - ((emp.fatigue || 0) / 100) * 0.45;
    return Math.max(0.35, moraleFactor * fatiguePenalty);
}

function factorTone(value, goodAt = 1, warnAt = 0.75) {
    if (value >= goodAt) return "good";
    if (value >= warnAt) return "warn";
    return "risk";
}

function estimateProjectPlan() {
    const cost = calculateProjectCost();
    const fit = calculateTeamFit();
    const platform = PLATFORMS_DATA[selectedPlatform];
    const topic = TOPICS_DATA[selectedTopic];
    const hasTopicMatch = topic.bestGenres.includes(selectedGenre);
    const trendHits = (gameState.activeTrend.genre === selectedGenre ? 1 : 0)
        + (gameState.activeTrend.topic === selectedTopic ? 1 : 0);
    const runwayWeeks = Math.max(0, Math.floor((gameState.funds - cost.totalCost) / Math.max(1, gameState.employees.reduce((sum, emp) => sum + emp.salary, 0) + BALANCE.weeklyRent)));
    const estimatedScore = Math.min(9.9, Math.max(3.0, (
        (fit.totalPower / (platform.scale * 130)) * 5.8 * fit.fit
        * (hasTopicMatch ? 1.12 : 0.96)
        * (1 + trendHits * 0.08)
    )));
    return { cost, fit, hasTopicMatch, trendHits, runwayWeeks, estimatedScore };
}

function renderProjectPreview() {
    const box = document.getElementById("project-preview");
    if (!box) return;
    const plan = estimateProjectPlan();
    const cashAfter = gameState.funds - plan.cost.totalCost;
    const fitPct = Math.round(plan.fit.fit * 100);
    const scoreText = plan.estimatedScore.toFixed(1);
    const runwayTone = cashAfter < 0 ? "risk" : plan.runwayWeeks < 8 ? "warn" : "good";
    const matchTone = plan.hasTopicMatch ? "good" : "warn";
    const scoreTone = factorTone(plan.estimatedScore / 9.0, 0.82, 0.62);
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
            ${plan.cost.systemsDiscount > 0 ? `系统策划专精已节省 ${Math.round(plan.cost.systemsDiscount * 100)}% 平台成本。` : ''}
        </div>
    `;
}

function setupDevelopForm() {
    // 加载平台
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

    // 加载类型
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

    // 加载题材
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
}

function startDevelopment() {
    const nameInput = document.getElementById("dev-name").value.trim();
    const gameName = nameInput || `桔子秘境 ${Math.floor(Math.random()*100)}`;
    const { totalCost } = calculateProjectCost();

    if (gameState.funds < totalCost) {
        alert("资金不足以启动该规模的项目开发！");
        return;
    }

    gameState.funds -= totalCost;
    
    // 初始化当前项目
    gameState.currentProject = {
        name: gameName,
        platform: selectedPlatform,
        genre: selectedGenre,
        topic: selectedTopic,
        progress: 0,
        code: 0,
        art: 0,
        design: 0,
        bugs: 0,
        devEventCooldown: 2,
        miniCooldown: 1,
        miniStreak: 0,
        miniReady: false,
        state: "coding" // coding, debugging, finished
    };

    addChronicleEntry(`🚀 新项目《${gameName}》正式立项启动！选用【${PLATFORMS_DATA[selectedPlatform].name}】平台研发，类型为【${GENRES_DATA[selectedGenre].name}】，成本预算 ¥${totalCost.toLocaleString()}`);

    saveGame();
    updateStatsUI();
    showDevelopmentOverlay();
}

function showDevelopmentOverlay() {
    const overlay = document.getElementById("development-overlay");
    overlay.classList.add("active");
    
    const proj = gameState.currentProject;
    document.getElementById("overlay-game-name").innerText = proj.name;
    document.getElementById("overlay-game-meta").innerHTML = `
        <i class="${GENRES_DATA[proj.genre].icon}"></i> ${GENRES_DATA[proj.genre].name} | 
        <i class="${PLATFORMS_DATA[proj.platform].icon}"></i> ${PLATFORMS_DATA[proj.platform].name}
    `;
    
    updateDevStatsUI();
}

function updateDevStatsUI() {
    const proj = gameState.currentProject;
    if (!proj) return;

    document.getElementById("overlay-progress").innerText = `${Math.floor(proj.progress)}%`;
    document.getElementById("overlay-progress-bar").style.width = `${proj.progress}%`;
    
    document.getElementById("overlay-code").innerText = Math.floor(proj.code);
    document.getElementById("overlay-art").innerText = Math.floor(proj.art);
    document.getElementById("overlay-design").innerText = Math.floor(proj.design);
    document.getElementById("overlay-bugs").innerText = Math.floor(proj.bugs);

    const btn = document.getElementById("dev-action-btn");
    if (proj.state === "coding") {
        if (proj.miniReady) {
            btn.className = "btn-dev-action focus";
            btn.innerText = `灵感火花！点击冲刺 x${(proj.miniStreak || 0) + 1}`;
            btn.disabled = false;
        } else {
            btn.className = "btn-dev-action disabled";
            btn.innerText = `研发推进中，灵感冷却 ${proj.miniCooldown || 0} 周`;
            btn.disabled = true;
        }
    } else if (proj.state === "debugging") {
        btn.className = "btn-dev-action bug-fixing";
        btn.innerText = "开发完成！点击开始测试修复Bug";
        btn.disabled = false;
    } else if (proj.state === "finished") {
        btn.className = "btn-dev-action release";
        btn.innerText = "测试完成！宣布正式发布上线";
        btn.disabled = false;
    }
}

function developProgressTick() {
    const proj = gameState.currentProject;
    if (!proj || proj.state !== "coding") return;

    let anyPointGenerated = false;

    // 每周根据雇员能力递增点数
    gameState.employees.forEach((emp, index) => {
        const efficiency = employeeEfficiency(emp);
        // 根据工种产生相对应的点数
        let codeGen = 0, artGen = 0, desGen = 0;
        
        if (emp.role === "programmer") {
            codeGen = ((emp.stats.code * 0.4) + Math.random() * 5) * efficiency;
            desGen = (emp.stats.design * 0.1) * efficiency;
            
            // 专精：引擎架构师 (engine): 自身代码产出提高 40%
            if (emp.specialty === "engine") {
                codeGen *= 1.40;
            }
            // 专精：全栈工程师 (fullstack): 自身代码实力输出 +30%，且额外输出其产生的代码的 30% 作为设计策划点数
            if (emp.specialty === "fullstack") {
                codeGen *= 1.30;
                desGen += codeGen * 0.30;
            }
        } else if (emp.role === "artist") {
            artGen = ((emp.stats.art * 0.45) + Math.random() * 5) * efficiency;
            
            // 专精：原画主美 (concept): 自身美术表现点数产出提高 50%
            if (emp.specialty === "concept") {
                artGen *= 1.50;
            }
        } else if (emp.role === "designer") {
            desGen = ((emp.stats.design * 0.45) + Math.random() * 5) * efficiency;
            codeGen = (emp.stats.code * 0.1) * efficiency;
            
            // 专精：创意主笔 (writer): 策划产出增幅 40%
            if (emp.specialty === "writer") {
                desGen *= 1.40;
            }
        }

        // 产生 Bug 的概率 (Debug 狂魔减半)
        let bugChance = emp.trait === "debug" ? 0.07 : 0.15;
        if (Math.random() < bugChance) {
            proj.bugs += Math.floor(Math.random() * 3) + 1;
            spawnFloatingText("BUG+", "overlay-bugs", "bug");
            playSFX("bug");
        }

        const fatigueGain = gameState.researchPerks && gameState.researchPerks.workflow ? 3 : 4;
        emp.fatigue = Math.min(100, (emp.fatigue || 0) + fatigueGain);
        emp.morale = Math.max(0, (emp.morale == null ? 75 : emp.morale) - (emp.fatigue > 70 ? 2 : 0));

        // 累加属性
        proj.code += codeGen;
        proj.art += artGen;
        proj.design += desGen;

        // 飘字与音效效果
        if (codeGen > 2.5) { spawnFloatingText(`+${Math.round(codeGen)}`, "overlay-code", "code"); anyPointGenerated = true; }
        if (artGen > 2.5) { spawnFloatingText(`+${Math.round(artGen)}`, "overlay-art", "art"); anyPointGenerated = true; }
        if (desGen > 2.5) { spawnFloatingText(`+${Math.round(desGen)}`, "overlay-design", "design"); anyPointGenerated = true; }
    });

    if (anyPointGenerated) {
        playSFX("point");
    }

    if (!proj.miniReady) {
        proj.miniCooldown = Math.max(0, (proj.miniCooldown || 0) - 1);
        if (proj.miniCooldown === 0) {
            proj.miniReady = true;
            spawnFloatingText("灵感火花!", "dev-action-btn", "design");
            playSFX("point");
        }
    }

    // 增加开发进度 (进度速度由所有员工总效率决定)
    const teamPower = gameState.employees.reduce((sum, emp) => sum + (emp.stats.code + emp.stats.art + emp.stats.design), 0);
    
    // 专精：引擎架构师 (engine): 开发进度推进效率额外提高 25%
    let engineSpeedBonus = 1.0;
    gameState.employees.forEach(emp => {
        if (emp.specialty === "engine") {
            engineSpeedBonus += 0.25;
        }
    });

    const workflowBonus = gameState.researchPerks && gameState.researchPerks.workflow ? 1.08 : 1.0;
    const baseProgressStep = ((teamPower * 0.08) + 10) * engineSpeedBonus * workflowBonus;
    proj.progress += baseProgressStep;

    maybeTriggerDevelopmentEvent(proj);

    if (proj.progress >= 100) {
        proj.progress = 100;
        proj.state = "debugging";
        playSFX("success");
        
        // 开始随机生成可点击的 QA Bug
        startBugSpawning();
    }

    updateDevStatsUI();
}

function triggerCodingMiniAction(proj) {
    if (!proj.miniReady) return;

    const ratio = GENRES_DATA[proj.genre].ratio;
    const streak = (proj.miniStreak || 0) + 1;
    const boost = Math.min(34, 9 + streak * 4);
    const progressBoost = Math.min(14, 4 + streak * 1.5);

    proj.code += boost * ratio.code;
    proj.art += boost * ratio.art;
    proj.design += boost * ratio.design;
    proj.progress = Math.min(100, proj.progress + progressBoost);
    proj.miniStreak = streak;
    proj.miniReady = false;
    proj.miniCooldown = Math.max(1, 4 - Math.min(3, Math.floor(streak / 2)));

    gameState.employees.forEach(emp => {
        emp.fatigue = Math.min(100, (emp.fatigue || 0) + 2);
        if (streak >= 4) {
            emp.morale = Math.max(0, (emp.morale == null ? 75 : emp.morale) - 1);
        }
    });

    if (streak >= 4 && Math.random() < 0.22) {
        proj.bugs += 1;
        spawnFloatingText("冲刺副作用 BUG+1", "overlay-bugs", "bug");
        playSFX("bug");
    } else {
        playSFX("success");
    }

    spawnFloatingText(`冲刺 +${Math.round(boost)}`, "overlay-progress", "up");
    addChronicleEntry(`⚡ 《${proj.name}》完成第 ${streak} 次灵感冲刺，研发进度明显推进。`);

    if (proj.progress >= 100) {
        proj.progress = 100;
        proj.state = "debugging";
        startBugSpawning();
        playSFX("success");
    }
}

const DEVELOPMENT_EVENTS = [
    {
        title: "核心玩法出现分歧",
        desc: "团队在本周评审中发现主循环有点松散。是立刻砍掉一部分边缘功能，还是继续硬撑完整设计？",
        choices: [
            {
                text: "砍掉边缘功能，聚焦核心体验",
                action: (proj) => {
                    proj.design += 18;
                    proj.progress = Math.max(0, proj.progress - 6);
                    addChronicleEntry(`🧩 《${proj.name}》中途收束玩法范围，核心体验更聚焦，但进度略有回退。`);
                    alert("核心设计 +18，开发进度 -6%");
                }
            },
            {
                text: "保留完整设计，全员加速推进",
                action: (proj) => {
                    proj.progress += 10;
                    proj.bugs += 4;
                    addChronicleEntry(`⚡ 《${proj.name}》选择保留完整设计高速推进，但技术债明显增加。`);
                    alert("开发进度 +10%，Bug +4");
                }
            }
        ]
    },
    {
        title: "美术风格临时升级",
        desc: "主美提出可以把界面和特效整体升级一档，但会占用一周测试时间。要不要批准？",
        choices: [
            {
                text: "批准升级，强化第一眼吸引力",
                action: (proj) => {
                    proj.art += 22;
                    proj.progress = Math.max(0, proj.progress - 5);
                    addChronicleEntry(`🎨 《${proj.name}》批准美术风格升级，视觉表现显著增强。`);
                    alert("美术表现 +22，开发进度 -5%");
                }
            },
            {
                text: "维持当前风格，先保证上线节奏",
                action: (proj) => {
                    proj.progress += 7;
                    proj.design += 5;
                    alert("开发进度 +7%，核心设计 +5");
                }
            }
        ]
    },
    {
        title: "底层性能瓶颈暴露",
        desc: "程序员发现当前实现可能在低端机上卡顿。现在重构会变慢，但发布后的技术评价更稳。",
        choices: [
            {
                text: "马上重构，别让口碑死在卡顿上",
                action: (proj) => {
                    proj.code += 24;
                    proj.bugs = Math.max(0, proj.bugs - 3);
                    proj.progress = Math.max(0, proj.progress - 8);
                    addChronicleEntry(`🛠️ 《${proj.name}》中途重构底层性能，牺牲进度换来更稳的技术底座。`);
                    alert("代码实力 +24，Bug -3，开发进度 -8%");
                }
            },
            {
                text: "先上线，性能问题以后热更",
                action: (proj) => {
                    proj.progress += 8;
                    proj.bugs += 3;
                    alert("开发进度 +8%，Bug +3");
                }
            }
        ]
    }
];

function maybeTriggerDevelopmentEvent(proj) {
    if (proj.progress < 18 || proj.progress > 88) return;
    proj.devEventCooldown = Math.max(0, (proj.devEventCooldown || 0) - 1);
    if (proj.devEventCooldown > 0 || Math.random() > 0.16) return;
    proj.devEventCooldown = 4;
    const ev = DEVELOPMENT_EVENTS[Math.floor(Math.random() * DEVELOPMENT_EVENTS.length)];

    document.getElementById("event-modal").classList.add("active");
    document.getElementById("event-modal-title").innerHTML = `<i class="fa-solid fa-screwdriver-wrench"></i> ${ev.title}`;
    document.getElementById("event-modal-desc").innerText = ev.desc;
    const btnContainer = document.getElementById("event-modal-choices");
    btnContainer.innerHTML = "";
    ev.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = choice.text;
        btn.onclick = () => {
            choice.action(proj);
            proj.progress = Math.min(100, Math.max(0, proj.progress));
            proj.bugs = Math.max(0, Math.round(proj.bugs));
            document.getElementById("event-modal").classList.remove("active");
            updateDevStatsUI();
            saveGame();
        };
        btnContainer.appendChild(btn);
    });
}

function triggerDevAction() {
    const proj = gameState.currentProject;
    if (!proj) return;

    if (proj.state === "coding") {
        triggerCodingMiniAction(proj);
        updateDevStatsUI();
        saveGame();
    } else if (proj.state === "debugging") {
        // 点击修复 Bug (计算 Debug 狂魔加成)
        let qaPower = gameState.employees.reduce((sum, emp) => {
            let power = emp.stats.code;
            if (emp.trait === "debug") {
                power = Math.round(power * 1.5); // Debug狂魔加成+50%
            }
            return sum + power;
        }, 0) + 10;
        
        let fixCount = Math.round(qaPower * 0.4 + 2);
        proj.bugs -= fixCount;
        playSFX("click");
        
        if (proj.bugs <= 0) {
            proj.bugs = 0;
            proj.state = "finished";
            playSFX("success");
        }
        updateDevStatsUI();
    } else if (proj.state === "finished") {
        // 点击发布游戏，改为先弹出发行商选择对话框，而不再直接 releaseGame
        playSFX("click");
        showPublisherModal();
    }
}

function releaseGame(publisherType) {
    const proj = gameState.currentProject;
    if (!proj) return;

    // 应用发行商的前期收支与粉丝曝光乘数
    let fansMultiplier = 1.0;
    if (publisherType === "tiktok") {
        gameState.funds += 5000;
        fansMultiplier = 1.5;
    } else if (publisherType === "steam") {
        gameState.funds -= 5000;
        fansMultiplier = 2.5;
    }

    const evaluation = buildReleaseEvaluation(proj);
    const bonus = evaluation.bonus;
    const finalScore = evaluation.finalScore;

    // 生成评论列表
    const reviews = generateReviewComments(proj, finalScore);
    
    // 创意主笔专精 (writer): 每一个创意主笔增幅新游发售获得的粉丝基数 20%
    let writerBonusMultiplier = 1.0;
    gameState.employees.forEach(emp => {
        if (emp.specialty === "writer") {
            writerBonusMultiplier += 0.20;
        }
    });

    // 生成游戏结果
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
    gameState.currentProject = null; // 清空项目

    // 写入编年史大事记
    const pubNames = { self: "自主发行", tiktok: "抖音独占推广", steam: "Steam签约发行" };
    addChronicleEntry(`🎮 成功发布了由【${pubNames[publisherType]}】承销的《${release.name}》（类型：${GENRES_DATA[release.genre].name}，题材：${TOPICS_DATA[release.topic].name}），斩获综合评分 ${release.rating}，吸引了 ${release.fansGained.toLocaleString()} 名新拥趸！`);

    // 隐藏开发遮罩与发行商选择弹窗，弹出评测模态框
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

    const unclampedScore = baseScore;
    if (baseScore > 9.9) baseScore = 9.9;
    if (baseScore < 3.0) baseScore = 3.0 + Math.random() * 2;
    const finalScore = parseFloat(baseScore.toFixed(1));

    return {
        finalScore,
        bonus,
        factors: [
            {
                label: "完成度",
                value: `${Math.round(completionRatio * 100)}%`,
                tone: factorTone(completionRatio, 0.95, 0.65),
                desc: `${Math.round(totalPoints)} 点产出 / ${Math.round(platformTarget)} 平台目标`
            },
            {
                label: "题材契合",
                value: hasTopicMatch ? "+20%" : "一般",
                tone: hasTopicMatch ? "good" : "warn",
                desc: `${TOPICS_DATA[proj.topic].name} ${hasTopicMatch ? "适合" : "不太适合"} ${GENRES_DATA[proj.genre].name}`
            },
            {
                label: "趋势加成",
                value: `+${(trendGenreHit ? 15 : 0) + (trendTopicHit ? 15 : 0)}%`,
                tone: trendGenreHit || trendTopicHit ? "good" : "warn",
                desc: trendGenreHit || trendTopicHit ? "命中当前市场风向" : "没有吃到本期热门红利"
            },
            {
                label: "专精加成",
                value: animatorMultiplier > 1 ? "+5%" : "无",
                tone: animatorMultiplier > 1 ? "good" : "warn",
                desc: animatorMultiplier > 1 ? "特效主美提升了品类表现" : "没有触发发行评分专精"
            },
            {
                label: "最终校准",
                value: finalScore.toFixed(1),
                tone: factorTone(finalScore / 9.0, 0.82, 0.62),
                desc: `原始评分 ${unclampedScore.toFixed(1)}，系统限制到 3.0 - 9.9 区间`
            }
        ]
    };
}

// ==========================================================================
// 评测报告
// ==========================================================================
function generateReviewComments(proj, score) {
    let list = [];
    const isGood = score >= 7.5;
    const isBad = score < 5.5;

    // 1. 策划评论
    let plannerComment = "";
    if (isGood) {
        plannerComment = `题材《${TOPICS_DATA[proj.topic].name}》的创意很有诚意，核心关卡很有粘性！`;
    } else if (isBad) {
        plannerComment = `玩法比较匮乏，感觉根本没有抓住玩家的情感痛点。`;
    } else {
        plannerComment = `核心机制还行，不过缺乏让人眼前一亮的惊喜点，中规中矩。`;
    }
    list.push({ reviewer: "抖音小游戏前哨站", text: plannerComment, score: Math.round(score + (Math.random() - 0.5)) });

    // 2. 美术评论
    let artComment = "";
    if (proj.art > proj.code * 1.5) {
        artComment = `美术表现极其惊艳！色彩搭配极具艺术冲击力。`;
    } else if (isBad) {
        artComment = `画面素材有些简陋，感觉像是临时凑来的素材。`;
    } else {
        artComment = `视觉效果还可以，能够保障游戏的基本沉浸感。`;
    }
    list.push({ reviewer: "桔子游民画报", text: artComment, score: Math.round(score + (Math.random() - 0.5)) });

    // 3. 极客技术评论
    let techComment = "";
    if (score > 8.0) {
        techComment = `流畅度拉满，抖音小游戏的加载优化做到了行业顶尖水平，无卡顿。`;
    } else if (isBad) {
        techComment = `代码优化极差，不仅卡顿，而且有几处导致崩溃的严重隐患。`;
    } else {
        techComment = `整体运行平稳，技术表现符合同品类平均水平。`;
    }
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
            <div class="score-factor-desc">${factor.desc}</div>
        `;
        container.appendChild(item);
    });
}

function showReviewModal(release, reviews, evaluation) {
    document.getElementById("review-modal").classList.add("active");
    document.getElementById("modal-rating").innerText = release.rating;
    
    // 星星渲染
    const starContainer = document.getElementById("modal-stars");
    starContainer.innerHTML = "";
    const starCount = Math.round(release.rating / 2);
    for (let i = 0; i < 5; i++) {
        const star = document.createElement("i");
        star.className = i < starCount ? "fa-solid fa-star" : "fa-regular fa-star";
        starContainer.appendChild(star);
    }

    // 绘制霓虹销量图
    setTimeout(() => {
        drawTrendChart("modal-chart-box", release.rating);
    }, 100);

    renderScoreBreakdown(evaluation);

    // 评论渲染
    renderList(document.getElementById("modal-reviews"), reviews, (rev) => ({
        className: "review-item",
        html: `
            <div class="reviewer-meta">
                <span class="reviewer-name">${rev.reviewer}</span>
                <span class="reviewer-score">${rev.score}分</span>
            </div>
            <p class="review-text">“${rev.text}”</p>
        `
    }));
}

function closeReviewModal() {
    document.getElementById("review-modal").classList.remove("active");
    switchScreen('office');
}

