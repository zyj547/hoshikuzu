// ==========================================================================
// 创始人成长称号：纯荣誉，随 founderLevel 晋升。浏览器 classic script + Node 双模。
// 扩充称号只需往 FOUNDER_TITLES 追加一项（保持按 minLevel 升序）。
// ==========================================================================
(function (root, factory) {
    const api = factory();
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(this, function () {

    const FOUNDER_TITLES = [
        { minLevel: 1,  name: "萌新开发者",   icon: "fa-solid fa-seedling",   color: "var(--accent-neon)" },
        { minLevel: 3,  name: "独立制作人",   icon: "fa-solid fa-user-pen",   color: "var(--accent-yellow)" },
        { minLevel: 6,  name: "资深制作人",   icon: "fa-solid fa-user-gear",  color: "var(--accent-pink)" },
        { minLevel: 10, name: "工作室掌舵者", icon: "fa-solid fa-chess-king", color: "var(--accent-purple)" },
        { minLevel: 15, name: "业界传奇",     icon: "fa-solid fa-crown",      color: "var(--accent-gold, gold)" }
    ];

    // 纯函数：返回 minLevel <= level 的最高一档；level 异常时兜底首档
    function pickFounderTitle(level, titles) {
        const lv = (typeof level === "number" && level >= 1) ? level : 1;
        let chosen = titles[0];
        for (const tier of titles) {
            if (lv >= tier.minLevel) chosen = tier;
            else break;
        }
        return chosen;
    }

    // 便捷封装：读取全局 gameState.founderLevel
    function founderTitle() {
        const lv = (typeof gameState !== "undefined" && gameState.founderLevel) || 1;
        return pickFounderTitle(lv, FOUNDER_TITLES);
    }

    return { FOUNDER_TITLES, pickFounderTitle, founderTitle };
});
