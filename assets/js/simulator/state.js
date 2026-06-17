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
const SAVE_VERSION = 1;

// 全新一局的默认状态（单一数据源，供初始化、存档迁移、重组复用）
function createDefaultGameState() {
    return {
        companyName: "桔子网络工作室",
        funds: 50000,
        fans: 100,
        rp: 10,
        date: { year: 1, month: 1, week: 1 },
        employees: [
            { id: "player", name: "创始人(您)", role: "designer", stats: { code: 15, art: 10, design: 20 }, salary: 0, level: 1, xp: 0, trait: "multi" }
        ],
        unlockedGenres: ["Casual"],
        unlockedTopics: ["Laborer"],
        unlockedPlatforms: ["Mobile"],
        releases: [],
        currentProject: null,
        lastIncome: 0,
        lastSales: 0,
        activeTrend: { genre: "Casual", topic: "Laborer" },
        // 多周目数据
        medalsGained: 0,
        activePerks: { fundsBoost: false, roguelikeUnlocked: false, fansGrowthBoost: false },
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

let gameState = createDefaultGameState();

// 跨周目勋章与特权持久化变量
let orangeMedalsCount = parseInt(localStorage.getItem("orange_medals") || "0");
let shopSelectedPerks = { fundsBoost: false, roguelikeUnlocked: false, fansGrowthBoost: false };

// 临时招聘池
let hiringPool = [];
let activeResearchTab = "genre";
let loopInterval = null;

// ==========================================================================
// 经济与节奏平衡参数（集中管理，便于数值调参）
// ==========================================================================
const BALANCE = {
    tickMs: 3500,             // 主时钟每周时长（毫秒）
    weeklyRent: 500,          // 每周固定租金
    salesWindowWeeks: 16,     // 单款游戏在售周数
    revenueDecay: 0.75,       // 每周营收衰减系数
    revenuePerRating: 1500,   // 单位口碑分基础营收
    fansRevenueFactor: 0.002, // 粉丝对营收的加成系数
    publisherShare: { tiktok: 0.5, steam: 0.7, self: 1.0 }, // 发行分成（保留比例）
    fansBoostPerWeek: 5,      // 大厂光环每周粉丝回流
    idleRpChance: 0.25,       // 闲置员工每周积累 RP 概率
    ideaTraitMultiplier: 1.5, // “灵感爆棚”特质 RP 加成
    trendUpdateChance: 0.1,   // 每周刷新趋势概率
    randomEventChance: 0.08,  // 每周随机事件概率
    bankruptcyThreshold: -30000 // 破产资金线
};

