// ==========================================================================
// 开发模块 (Game R&D Engine)
// ==========================================================================
let selectedPlatform = "Mobile";
let selectedGenre = "Casual";
let selectedTopic = "Laborer";

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
}

function startDevelopment() {
    const nameInput = document.getElementById("dev-name").value.trim();
    const gameName = nameInput || `桔子秘境 ${Math.floor(Math.random()*100)}`;
    
    // 系统策划专精 (systems): 立项时平台费用成本减少 15% (可叠加，上限 30%)
    let systemsDiscount = 0;
    gameState.employees.forEach(emp => {
        if (emp.specialty === "systems") {
            systemsDiscount += 0.15;
        }
    });
    if (systemsDiscount > 0.30) systemsDiscount = 0.30;

    const platCost = Math.round(PLATFORMS_DATA[selectedPlatform].cost * (1 - systemsDiscount));
    const genreCost = GENRES_DATA[selectedGenre].cost;
    const topicCost = TOPICS_DATA[selectedTopic].cost;
    const totalCost = platCost + genreCost + topicCost + 1000; // +1000 基础材料成本

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
        btn.className = "btn-dev-action disabled";
        btn.innerText = "开发中，员工正在输出技术力...";
        btn.disabled = true;
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
        // 根据工种产生相对应的点数
        let codeGen = 0, artGen = 0, desGen = 0;
        
        if (emp.role === "programmer") {
            codeGen = (emp.stats.code * 0.4) + Math.random() * 5;
            desGen = (emp.stats.design * 0.1);
            
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
            artGen = (emp.stats.art * 0.45) + Math.random() * 5;
            
            // 专精：原画主美 (concept): 自身美术表现点数产出提高 50%
            if (emp.specialty === "concept") {
                artGen *= 1.50;
            }
        } else if (emp.role === "designer") {
            desGen = (emp.stats.design * 0.45) + Math.random() * 5;
            codeGen = (emp.stats.code * 0.1);
            
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

    // 增加开发进度 (进度速度由所有员工总效率决定)
    const teamPower = gameState.employees.reduce((sum, emp) => sum + (emp.stats.code + emp.stats.art + emp.stats.design), 0);
    
    // 专精：引擎架构师 (engine): 开发进度推进效率额外提高 25%
    let engineSpeedBonus = 1.0;
    gameState.employees.forEach(emp => {
        if (emp.specialty === "engine") {
            engineSpeedBonus += 0.25;
        }
    });

    const baseProgressStep = ((teamPower * 0.08) + 10) * engineSpeedBonus;
    proj.progress += baseProgressStep;

    if (proj.progress >= 100) {
        proj.progress = 100;
        proj.state = "debugging";
        playSFX("success");
        
        // 开始随机生成可点击的 QA Bug
        startBugSpawning();
    }

    updateDevStatsUI();
}

function triggerDevAction() {
    const proj = gameState.currentProject;
    if (!proj) return;

    if (proj.state === "debugging") {
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

    // 评估分数算法
    const totalPoints = proj.code + proj.art + proj.design;
    const platformTarget = PLATFORMS_DATA[proj.platform].scale * 150; // 主机要求最高
    
    // 契合度与热门趋势检查
    let bonus = 1.0;
    const topic = TOPICS_DATA[proj.topic];
    if (topic.bestGenres.includes(proj.genre)) {
        bonus += 0.2; // 完美匹配 1.2
    }
    if (gameState.activeTrend.genre === proj.genre) bonus += 0.15;
    if (gameState.activeTrend.topic === proj.topic) bonus += 0.15;

    // 最终品质打分
    let baseScore = (totalPoints / platformTarget) * 6 * bonus;
    
    // 特效主美专精 (animator): 研发并发行【休闲类】或【地牢冒险类】游戏时，评分提升 5%
    const hasAnimator = gameState.employees.some(emp => emp.specialty === "animator");
    if (hasAnimator && (proj.genre === "Casual" || proj.genre === "Roguelike")) {
        baseScore *= 1.05;
    }

    if (baseScore > 9.9) baseScore = 9.9;
    if (baseScore < 3.0) baseScore = 3.0 + Math.random()*2;
    const finalScore = parseFloat(baseScore.toFixed(1));

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
    showReviewModal(release, reviews);
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

function showReviewModal(release, reviews) {
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

