// ==========================================================================
// 员工状态流：每周情绪/忠诚漂移、工作状态标签、特质微行为
// ==========================================================================
(function (root, factory) {
    const api = factory(root);
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    function clamp(v, min = 0, max = 100) {
        return (root.employeeClamp || ((n, lo, hi) => Math.max(lo, Math.min(hi, n))))(v, min, max);
    }

    function ensure(emp) {
        return root.ensureEmployeeVitals ? root.ensureEmployeeVitals(emp) : emp;
    }

    function pickStatus(emp, activeDevCount) {
        ensure(emp);
        const sat = emp.satisfaction;
        const fatigue = emp.fatigue || 0;
        const trait = emp.trait || "none";
        const role = root.roleLabel ? root.roleLabel(emp.role) : "任务";

        if (fatigue >= 82) return { text: "趴在工位边缘硬撑", tone: "risk" };
        if (sat <= 32 && trait === "lazy") return { text: "在工位上画猫", tone: "warn" };
        if (sat <= 36) return { text: "盯着屏幕发呆", tone: "warn" };
        if (trait === "debug" && activeDevCount > 0) return { text: "对着一行日志死磕", tone: "debug" };
        if (trait === "multi" && activeDevCount > 0 && sat >= 62) return { text: "顺手帮同事拆卡点", tone: "good" };
        if (trait === "idea" && sat >= 72) return { text: "在白板边补灵感", tone: "idea" };
        if (trait === "lazy" && activeDevCount === 0) return { text: "在茶水间恢复能量", tone: "good" };
        if (sat >= 82 && emp.role === "artist") return { text: "哼着歌调光影", tone: "good" };
        if (sat >= 82) return { text: `心情很好地推进${role}任务`, tone: "good" };
        if (activeDevCount > 0) return { text: `埋头处理${role}任务`, tone: "neutral" };
        return { text: "整理素材和笔记", tone: "neutral" };
    }

    function applyTraitMicroAction(emp, gameState, activeDevCount, rng) {
        const rand = typeof rng === "function" ? rng : Math.random;
        const project = gameState && gameState.currentProject;
        if (!emp || !project || activeDevCount <= 0) return;
        ensure(emp);

        if (emp.trait === "debug" && project.bugs > 0 && rand() < 0.18) {
            project.bugs = Math.max(0, (project.bugs || 0) - 1);
            emp.fatigue = clamp((emp.fatigue || 0) + 2);
            root.setEmployeeStatus(emp, "顺手拔掉一个小 Bug", "debug");
        }
        if (emp.trait === "multi" && rand() < 0.12) {
            project.code += emp.role === "programmer" ? 0 : 1;
            project.art += emp.role === "artist" ? 0 : 1;
            project.design += emp.role === "designer" ? 0 : 1;
            emp.satisfaction = clamp(emp.satisfaction + 1);
            root.setEmployeeStatus(emp, "跨岗补了一块短板", "good");
        }
        if (emp.trait === "idea" && rand() < 0.12) {
            gameState.rp = Math.max(0, (gameState.rp || 0) + 1);
            emp.satisfaction = clamp(emp.satisfaction + 1);
            root.setEmployeeStatus(emp, "突然记下一条灵感", "idea");
        }
        if (emp.trait === "lazy" && rand() < 0.10) {
            emp.fatigue = clamp((emp.fatigue || 0) - 5);
            emp.satisfaction = clamp(emp.satisfaction + 2);
            root.setEmployeeStatus(emp, "短暂摸鱼后精神回来了", "good");
        }
    }

    function tickEmployeeEcosystem(gameState, activeDevCount, isPayday, rng) {
        if (!gameState || !Array.isArray(gameState.employees) || !root.ensureEmployeeEcosystem) return;
        const rand = typeof rng === "function" ? rng : Math.random;
        root.ensureEmployeeEcosystem(gameState);
        gameState.employees.forEach(emp => {
            const morale = emp.morale == null ? 75 : emp.morale;
            const fatigue = emp.fatigue || 0;
            const workPressure = activeDevCount > 0 ? 2 : -2;
            const fatiguePressure = fatigue >= 70 ? -3 : fatigue <= 20 ? 2 : 0;
            const moraleDrift = morale >= 78 ? 2 : morale <= 45 ? -2 : 0;
            emp.satisfaction = clamp(emp.satisfaction + workPressure + fatiguePressure + moraleDrift);
            if (isPayday && emp.salary > 0) emp.loyalty = clamp(emp.loyalty + 1);
            if (emp.satisfaction >= 84 && rand() < 0.08) emp.loyalty = clamp(emp.loyalty + 1);
            if (emp.satisfaction <= 28 && rand() < 0.12) emp.loyalty = clamp(emp.loyalty - 1);
            const status = pickStatus(emp, activeDevCount);
            root.setEmployeeStatus(emp, status.text, status.tone);
            applyTraitMicroAction(emp, gameState, activeDevCount, rand);
        });
        if (typeof root.tickEmployeePsychology === "function") root.tickEmployeePsychology(gameState, activeDevCount);
        if (typeof root.tickEmployeeRelationships === "function") root.tickEmployeeRelationships(gameState, activeDevCount);
        if (typeof root.tickEmployeeCareers === "function") root.tickEmployeeCareers(gameState, activeDevCount);
    }

    function employeeEfficiencyMoodMultiplier(emp) {
        ensure(emp);
        const satisfaction = emp.satisfaction;
        if (satisfaction >= 85) return 1.06;
        if (satisfaction >= 70) return 1.02;
        if (satisfaction <= 25) return 0.90;
        if (satisfaction <= 40) return 0.95;
        return 1;
    }

    return {
        tickEmployeeEcosystem,
        employeeEfficiencyMoodMultiplier
    };
});
