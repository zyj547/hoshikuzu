// 默认初始化存档状态
// ==========================================================================
// 安全工具：转义用户/外部存档可控文本，防止通过 innerHTML 注入脚本 (XSS)
// ==========================================================================
function escapeHtml(str) {
    return String(str == null ? "" : str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// 通用列表渲染：清空容器后按 items 生成子元素，一次性插入（单次重排）。
// itemFn(item, idx) 返回 { className?, html } 或直接返回 html 字符串。
// items 为空且提供 emptyHtml 时，渲染占位内容。
function renderList(container, items, itemFn, emptyHtml) {
    container.innerHTML = "";
    if (items.length === 0 && emptyHtml != null) {
        container.innerHTML = emptyHtml;
        return;
    }
    const frag = document.createDocumentFragment();
    items.forEach((item, idx) => {
        const res = itemFn(item, idx);
        const el = document.createElement("div");
        if (typeof res === "string") {
            el.innerHTML = res;
        } else {
            if (res.className) el.className = res.className;
            el.innerHTML = res.html;
        }
        frag.appendChild(el);
    });
    container.appendChild(frag);
}

// UTF-8 字符串 ↔ Base64（替代已废弃的 escape/unescape；与旧存档码字节完全一致，向后兼容）
function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
}
function base64ToUtf8(base64) {
    const bin = atob(base64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

// 存档结构版本号（结构变更时递增，供未来迁移判断）
// v2: 推进式时间系统 + 卡片化研发 + 创始人背景（与 v1 不兼容，旧档将清空重开）
const SAVE_VERSION = 2;

// 全新一局的默认状态（单一数据源，供初始化、存档迁移、重组复用）
function createDefaultGameState() {
    return {
        companyName: "桔子网络工作室",
        funds: 35000,
        fans: 100,
        rp: 10,
        date: { year: 1, month: 1, week: 1 },
        founderBackground: null, // 开局选择前为 null，选择后写入背景 key
        founderLevel: 1,
        founderXp: 0,
        talentPoints: 0,
        talents: { management: 0, leadership: 0, creative: 0, business: 0 },
        creativeCooldown: 0,  // 创意激发剩余冷却周数
        creativeArmed: false, // 创意激发已激活、待下次发行消耗
        nextTrend: null,      // 商业嗅觉：预知的下季趋势
        employees: [
            { id: "player", name: "创始人(您)", role: "designer", stats: { code: 15, art: 10, design: 20 }, salary: 0, level: 1, xp: 0, trait: "multi", morale: 78, fatigue: 0, contractWeeksLeft: null, contractYears: 0, pendingRenewal: false }
        ],
        officeSlots: 3,
        companyStage: 0, // 公司发展阶段索引（0=独立作坊）
        hiringRefreshes: 0,
        unlockedGenres: ["Casual"],
        unlockedTopics: ["Laborer"],
        unlockedPlatforms: ["Mobile"],
        releases: [],
        currentProject: null,
        auxProjects: [], // 并行辅助项目（B 组后台自动推进）
        lastIncome: 0,
        lastSales: 0,
        recentGenres: [], // 最近发布的类型序列，用于市场疲劳度判定
        platformRep: Object.keys(PLATFORM_REP_CONFIG).reduce((acc, k) => { acc[k] = PLATFORM_REP_CONFIG[k].start; return acc; }, {}),
        activeTrend: { genre: "Casual", topic: "Laborer" },
        // 多周目数据
        medalsGained: 0,
        activePerks: { fundsBoost: false, roguelikeUnlocked: false, fansGrowthBoost: false },
        researchPerks: { workflow: false, community: false, analytics: false },
        chronology: [],
        saveVersion: SAVE_VERSION
    };
}

// 递归用默认值补全存档缺失字段（仅填补缺失，不覆盖已有进度）
function fillDefaults(target, defaults) {
    if (defaults === null || typeof defaults !== "object" || Array.isArray(defaults)) {
        return target;
    }
    for (const key in defaults) {
        if (target[key] === undefined) {
            target[key] = JSON.parse(JSON.stringify(defaults[key]));
        } else if (defaults[key] && typeof defaults[key] === "object" && !Array.isArray(defaults[key])) {
            fillDefaults(target[key], defaults[key]);
        }
    }
    return target;
}

// 存档迁移：把任意版本的旧存档补全到当前结构，避免缺字段导致运行时崩溃
function migrateSave(parsed) {
    return fillDefaults(parsed, createDefaultGameState());
}

// 存档校验与清洗：外部导入 / localStorage 读取都必须走这里，避免异常字段污染运行态
const SAVE_LIMITS = {
    text: 80,
    chronologyText: 240,
    chronology: 100,
    employees: 8,
    releases: 80,
    stat: 999,
    funds: 999999999,
    fans: 999999999,
    rp: 999999
};

const VALID_ROLES = ["designer", "programmer", "artist"];
const VALID_SPECIALTIES = ["engine", "fullstack", "concept", "animator", "systems", "writer"];
const VALID_PROJECT_STATES = ["developing", "polishing", "finished"];
const VALID_PUBLISHERS = ["self", "tiktok", "steam"];

function clonePlain(value) {
    return JSON.parse(JSON.stringify(value));
}

function clampNumber(value, min, max, fallback = min) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(max, Math.max(min, num));
}

function clampInteger(value, min, max, fallback = min) {
    return Math.round(clampNumber(value, min, max, fallback));
}

function cleanText(value, fallback = "", maxLength = SAVE_LIMITS.text) {
    const text = String(value == null ? fallback : value).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    return text.slice(0, maxLength) || fallback;
}

function enumValue(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}

function uniqueValidList(values, validKeys, requiredFirst) {
    const out = [];
    if (requiredFirst && validKeys.includes(requiredFirst)) out.push(requiredFirst);
    if (Array.isArray(values)) {
        values.forEach(value => {
            if (validKeys.includes(value) && !out.includes(value)) {
                out.push(value);
            }
        });
    }
    return out;
}

function sanitizeStats(stats) {
    return {
        code: clampInteger(stats && stats.code, 0, SAVE_LIMITS.stat, 0),
        art: clampInteger(stats && stats.art, 0, SAVE_LIMITS.stat, 0),
        design: clampInteger(stats && stats.design, 0, SAVE_LIMITS.stat, 0)
    };
}

function sanitizeEmployee(emp, fallback) {
    const source = emp && typeof emp === "object" ? emp : fallback;
    const clean = {
        id: cleanText(source.id || "", "", 40),
        name: cleanText(source.name, fallback.name, SAVE_LIMITS.text),
        role: enumValue(source.role, VALID_ROLES, fallback.role),
        stats: sanitizeStats(source.stats || fallback.stats),
        salary: clampInteger(source.salary, 0, 9999999, fallback.salary || 0),
        level: clampInteger(source.level, 1, 99, fallback.level || 1),
        xp: clampInteger(source.xp, 0, 999999, fallback.xp || 0),
        trait: enumValue(source.trait, Object.keys(EMPLOYEE_TRAITS), fallback.trait || "none"),
        rarity: enumValue(source.rarity, ["R", "SR", "SSR"], fallback.rarity || "R"),
        morale: clampInteger(source.morale, 0, 100, fallback.morale == null ? 75 : fallback.morale),
        fatigue: clampInteger(source.fatigue, 0, 100, fallback.fatigue || 0),
        contractWeeksLeft: source.contractWeeksLeft == null ? null : clampInteger(source.contractWeeksLeft, 0, 400, 96),
        contractYears: clampInteger(source.contractYears, 0, 3, 0),
        pendingRenewal: Boolean(source.pendingRenewal)
    };
    if (VALID_SPECIALTIES.includes(source.specialty)) {
        clean.specialty = source.specialty;
    }
    return clean;
}

function sanitizeProject(project) {
    if (!project || typeof project !== "object") return null;
    const platform = enumValue(project.platform, Object.keys(PLATFORMS_DATA), "Mobile");
    const genre = enumValue(project.genre, Object.keys(GENRES_DATA), "Casual");
    const topic = enumValue(project.topic, Object.keys(TOPICS_DATA), "Laborer");
    return {
        name: cleanText(project.name, "未命名项目", SAVE_LIMITS.text),
        platform,
        genre,
        topic,
        progress: clampNumber(project.progress, 0, 100, 0),
        code: clampInteger(project.code, 0, 99999, 0),
        art: clampInteger(project.art, 0, 99999, 0),
        design: clampInteger(project.design, 0, 99999, 0),
        bugs: clampInteger(project.bugs, 0, 9999, 0),
        cardsResolved: clampInteger(project.cardsResolved, 0, 99, 0),
        cardsNeeded: clampInteger(project.cardsNeeded, 3, 20, 6),
        polishWeeksLeft: clampInteger(project.polishWeeksLeft, 0, 8, 0),
        rushPenalty: Boolean(project.rushPenalty),
        isAux: Boolean(project.isAux),
        state: enumValue(project.state, VALID_PROJECT_STATES, "developing")
    };
}

function sanitizeRelease(release) {
    if (!release || typeof release !== "object") return null;
    const platform = enumValue(release.platform, Object.keys(PLATFORMS_DATA), "Mobile");
    const genre = enumValue(release.genre, Object.keys(GENRES_DATA), "Casual");
    const topic = enumValue(release.topic, Object.keys(TOPICS_DATA), "Laborer");
    return {
        name: cleanText(release.name, "未命名游戏", SAVE_LIMITS.text),
        platform,
        genre,
        topic,
        rating: clampNumber(release.rating, 0, 10, 5),
        weeksSinceRelease: clampInteger(release.weeksSinceRelease, 0, BALANCE.salesWindowWeeks, 0),
        revenueGenerated: clampInteger(release.revenueGenerated, 0, SAVE_LIMITS.funds, 0),
        publisher: enumValue(release.publisher, VALID_PUBLISHERS, "self"),
        fansGained: clampInteger(release.fansGained, 0, SAVE_LIMITS.fans, 0)
    };
}

function sanitizePerks(perks) {
    return {
        fundsBoost: Boolean(perks && perks.fundsBoost),
        roguelikeUnlocked: Boolean(perks && perks.roguelikeUnlocked),
        fansGrowthBoost: Boolean(perks && perks.fansGrowthBoost)
    };
}

function sanitizeResearchPerks(perks) {
    return {
        workflow: Boolean(perks && perks.workflow),
        community: Boolean(perks && perks.community),
        analytics: Boolean(perks && perks.analytics)
    };
}

function sanitizeDate(date) {
    return {
        year: clampInteger(date && date.year, 1, 999, 1),
        month: clampInteger(date && date.month, 1, 12, 1),
        week: clampInteger(date && date.week, 1, 4, 1)
    };
}

function sanitizeChronology(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.slice(-SAVE_LIMITS.chronology).map(entry => ({
        date: cleanText(entry && entry.date, "未知时间", SAVE_LIMITS.text),
        text: cleanText(entry && entry.text, "", SAVE_LIMITS.chronologyText)
    })).filter(entry => entry.text);
}

function sanitizeMedalCount(value) {
    return clampInteger(value, 0, 999999, 0);
}

function sanitizeSave(rawSave) {
    if (!rawSave || typeof rawSave !== "object" || Array.isArray(rawSave)) {
        throw new Error("存档不是对象");
    }

    const defaults = createDefaultGameState();
    const migrated = migrateSave(clonePlain(rawSave));
    const clean = createDefaultGameState();

    clean.companyName = cleanText(migrated.companyName, defaults.companyName, SAVE_LIMITS.text);
    clean.funds = clampInteger(migrated.funds, -SAVE_LIMITS.funds, SAVE_LIMITS.funds, defaults.funds);
    clean.fans = clampInteger(migrated.fans, 0, SAVE_LIMITS.fans, defaults.fans);
    clean.rp = clampInteger(migrated.rp, 0, SAVE_LIMITS.rp, defaults.rp);
    clean.date = sanitizeDate(migrated.date);
    clean.officeSlots = clampInteger(migrated.officeSlots, 2, 8, defaults.officeSlots);
    clean.companyStage = clampInteger(migrated.companyStage, 0, COMPANY_STAGES.length - 1, 0);
    clean.hiringRefreshes = clampInteger(migrated.hiringRefreshes, 0, 999999, defaults.hiringRefreshes);
    clean.employees = (Array.isArray(migrated.employees) ? migrated.employees : defaults.employees)
        .slice(0, clean.officeSlots)
        .map((emp, idx) => sanitizeEmployee(emp, defaults.employees[idx] || defaults.employees[0]));
    if (clean.employees.length === 0) {
        clean.employees = defaults.employees.map(emp => sanitizeEmployee(emp, emp));
    }
    clean.unlockedGenres = uniqueValidList(migrated.unlockedGenres, Object.keys(GENRES_DATA), "Casual");
    clean.unlockedTopics = uniqueValidList(migrated.unlockedTopics, Object.keys(TOPICS_DATA), "Laborer");
    clean.unlockedPlatforms = uniqueValidList(migrated.unlockedPlatforms, Object.keys(PLATFORMS_DATA), "Mobile");
    clean.releases = (Array.isArray(migrated.releases) ? migrated.releases : [])
        .slice(0, SAVE_LIMITS.releases)
        .map(sanitizeRelease)
        .filter(Boolean);
    clean.currentProject = sanitizeProject(migrated.currentProject);
    clean.auxProjects = (Array.isArray(migrated.auxProjects) ? migrated.auxProjects : [])
        .slice(0, 2)
        .map(sanitizeProject)
        .filter(Boolean)
        .map(p => { p.isAux = true; return p; });
    clean.founderBackground = enumValue(migrated.founderBackground, Object.keys(FOUNDER_BACKGROUNDS), null);
    clean.founderLevel = clampInteger(migrated.founderLevel, 1, 99, 1);
    clean.founderXp = clampInteger(migrated.founderXp, 0, 9999999, 0);
    clean.talentPoints = clampInteger(migrated.talentPoints, 0, 99, 0);
    clean.talents = Object.keys(FOUNDER_TALENTS).reduce((acc, k) => {
        acc[k] = clampInteger(migrated.talents && migrated.talents[k], 0, FOUNDER_TALENT_MAX, 0);
        return acc;
    }, {});
    clean.creativeCooldown = clampInteger(migrated.creativeCooldown, 0, 99, 0);
    clean.creativeArmed = Boolean(migrated.creativeArmed);
    clean.nextTrend = (migrated.nextTrend && Object.keys(GENRES_DATA).includes(migrated.nextTrend.genre) && Object.keys(TOPICS_DATA).includes(migrated.nextTrend.topic))
        ? { genre: migrated.nextTrend.genre, topic: migrated.nextTrend.topic } : null;
    clean.recentGenres = (Array.isArray(migrated.recentGenres) ? migrated.recentGenres : [])
        .filter(g => Object.keys(GENRES_DATA).includes(g)).slice(-5);
    clean.platformRep = Object.keys(PLATFORM_REP_CONFIG).reduce((acc, k) => {
        const src = migrated.platformRep && migrated.platformRep[k];
        acc[k] = clampInteger(src, 0, 100, PLATFORM_REP_CONFIG[k].start);
        return acc;
    }, {});
    clean.lastIncome = clampInteger(migrated.lastIncome, -SAVE_LIMITS.funds, SAVE_LIMITS.funds, 0);
    clean.lastSales = clampInteger(migrated.lastSales, 0, SAVE_LIMITS.funds, 0);
    clean.activeTrend = {
        genre: enumValue(migrated.activeTrend && migrated.activeTrend.genre, Object.keys(GENRES_DATA), "Casual"),
        topic: enumValue(migrated.activeTrend && migrated.activeTrend.topic, Object.keys(TOPICS_DATA), "Laborer")
    };
    clean.medalsGained = sanitizeMedalCount(migrated.medalsGained);
    clean.activePerks = sanitizePerks(migrated.activePerks);
    clean.researchPerks = sanitizeResearchPerks(migrated.researchPerks);
    clean.chronology = sanitizeChronology(migrated.chronology);
    clean.saveVersion = SAVE_VERSION;

    return clean;
}

let gameState = createDefaultGameState();

// 跨周目勋章与特权持久化变量
let orangeMedalsCount = sanitizeMedalCount(localStorage.getItem("orange_medals") || "0");
let shopSelectedPerks = { fundsBoost: false, roguelikeUnlocked: false, fansGrowthBoost: false };

// 临时招聘池
let hiringPool = [];
let activeResearchTab = "genre";
let loopInterval = null;
let gameSpeed = 1;

// ==========================================================================
// 经济与节奏平衡参数（集中管理，便于数值调参）
// ==========================================================================
const BALANCE = {
    stepMs: 900,              // 推进时每“周”的实际耗时（毫秒），仅在推进中流逝
    weeklyRent: 500,          // 每周固定租金
    salesWindowWeeks: 16,     // 单款游戏在售周数
    revenueDecay: 0.72,       // 每周营收衰减系数（更前置，符合独立游戏首周爆发后迅速回落）
    revenuePerRating: 240,    // 单位口碑分基础营收（大幅下调，贴近国内独立游戏初期低收益）
    fansRevenueFactor: 0.0008, // 粉丝对营收的加成系数（降低滚雪球速度）
    fansRevenueCap: 10,       // 粉丝营收乘数上限（人气助力会饱和，避免后期营收爆炸）
    publisherShare: { tiktok: 0.5, steam: 0.7, self: 1.0 }, // 发行分成（保留比例）
    fansBoostPerWeek: 5,      // 大厂光环每周粉丝回流
    idleRpChance: 0.25,       // 闲置员工每周积累 RP 概率
    ideaTraitMultiplier: 1.5, // “灵感爆棚”特质 RP 加成
    trendUpdateChance: 0.1,   // 每周刷新趋势概率
    randomEventChance: 0.08,  // 每周随机事件概率（仅空窗期）
    bankruptcyThreshold: -30000, // 破产资金线
    debtInterestRate: 0.02,   // 负债时每周额外利息（占负债绝对值）
    fatigueDecayPerMarketGame: 0.06, // 市场疲劳：每条最近同类记录的评分衰减
    marketFatigueWindow: 3    // 市场疲劳统计最近 N 款
};

