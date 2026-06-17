// 启动/重启游戏主时钟：先清除旧 interval，避免重复 setInterval 导致双倍速、双倍扣款
function startGameClock() {
    clearInterval(loopInterval);
    loopInterval = setInterval(gameTick, BALANCE.tickMs);
}

// 初始化游戏页面
window.onload = function() {
    loadGame();
    generateHiringPool();
    updateStatsUI();
    switchScreen('office');

    // 开启游戏主时钟 (每周 3.5 秒)
    startGameClock();
    
    // 如果是在开发中，直接拉回开发遮罩
    if (gameState.currentProject) {
        showDevelopmentOverlay();
    }

    // 标签页切到后台时暂停常驻 CSS 动画，省电控温
    document.addEventListener("visibilitychange", () => {
        document.body.classList.toggle("anim-paused", document.hidden);
    });
};

function isGamePaused() {
    const modals = ["custom-alert-modal", "custom-confirm-modal", "share-modal", "review-modal", "event-modal", "publisher-modal", "bankruptcy-modal", "medal-shop-modal"];
    return modals.some(id => {
        const el = document.getElementById(id);
        return el && el.classList.contains("active");
    });
}

