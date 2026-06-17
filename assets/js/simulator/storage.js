// ==========================================================================
// 5. 存档与读档 logic (localStorage)
// ==========================================================================
const SAVE_KEY = "hoshikuzu_tycoon_save";
const SAVE_BACKUP_KEY = "hoshikuzu_tycoon_save_bak";

function saveGame() {
    try {
        const next = JSON.stringify(gameState);
        const prev = localStorage.getItem(SAVE_KEY);
        // 写入新存档前，把上一份正常存档留作备份，损坏时可回滚
        if (prev && prev !== next) {
            localStorage.setItem(SAVE_BACKUP_KEY, prev);
        }
        localStorage.setItem(SAVE_KEY, next);
    } catch (e) {
        // 隐私模式 / 存储配额超限：跳过本次自动存档，避免每个 tick 抛错卡死游戏
        console.warn("自动存档失败（存储不可用），本次跳过", e);
    }
}

function loadGame() {
    // 解析一份存档原文，迁移并清洗到当前结构；无效返回 null
    const parseSave = (raw) => {
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return sanitizeSave(parsed);
    };

    try {
        const save = parseSave(localStorage.getItem(SAVE_KEY));
        if (save) {
            gameState = save;
        }
    } catch (e) {
        console.error("主存档损坏，尝试回滚到备份", e);
        try {
            const backup = parseSave(localStorage.getItem(SAVE_BACKUP_KEY));
            if (backup) {
                gameState = backup;
                console.warn("已从备份存档恢复");
            }
        } catch (e2) {
            console.error("备份同样损坏，已初始化新公司进度", e2);
        }
    }

    // 针对第一次点击激活 AudioContext
    document.addEventListener("click", () => {
        if (synthAudioCtx && synthAudioCtx.state === "suspended") {
            synthAudioCtx.resume();
        }
    }, { once: true });
}
    
