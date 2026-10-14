// ==========================================================================
// Employee career: long-term paths, XP leveling and career identity UI.
// ==========================================================================
(function (root, factory) {
    const api = factory(root);
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    function clamp(v, min = 0, max = 100) {
        const fn = root.employeeClamp || ((n, lo, hi) => Math.max(lo, Math.min(hi, n)));
        return fn(v, min, max);
    }

    function safe(text) {
        const escape = typeof root.escapeHtml === "function"
            ? root.escapeHtml
            : (s) => String(s == null ? "" : s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
        return escape(text);
    }

    function ensureVitals(emp) {
        if (root.ensureEmployeeVitals) root.ensureEmployeeVitals(emp);
        if (root.ensureEmployeePsychology) root.ensureEmployeePsychology(emp);
        if (!emp.career || typeof emp.career !== "object" || Array.isArray(emp.career)) emp.career = {};
        return emp;
    }

    const CAREER_PATHS = {
        engineer: {
            name: "技术专家",
            icon: "fa-solid fa-microchip",
            color: "var(--accent-neon)",
            match: emp => emp.role === "programmer" || (emp.stats?.code || 0) >= Math.max(emp.stats?.art || 0, emp.stats?.design || 0),
            stages: ["代码执行者", "系统修补者", "架构骨干", "技术负责人", "工程主心骨"],
            bonuses: level => ({ code: Math.max(1, Math.floor(level / 2)), efficiency: Math.min(8, level + 1) })
        },
        artist: {
            name: "视觉核心",
            icon: "fa-solid fa-palette",
            color: "var(--accent-pink)",
            match: emp => emp.role === "artist",
            stages: ["素材执行者", "风格捕手", "视觉骨干", "美术主导", "审美定调者"],
            bonuses: level => ({ art: Math.max(1, Math.floor(level / 2)), satisfaction: Math.min(6, level) })
        },
        designer: {
            name: "玩法策划",
            icon: "fa-solid fa-diagram-project",
            color: "var(--accent-yellow)",
            match: emp => emp.role === "designer",
            stages: ["需求整理者", "规则打磨者", "体验骨干", "系统主策", "节奏掌舵者"],
            bonuses: level => ({ design: Math.max(1, Math.floor(level / 2)), rp: Math.min(4, Math.ceil(level / 2)) })
        },
        mentor: {
            name: "团队导师",
            icon: "fa-solid fa-user-graduate",
            color: "#7dd3fc",
            match: emp => {
                const tags = emp.psychology?.growthTags || [];
                return tags.some(tag => /带人|传承|开始能带人/.test(tag)) || emp.archetype === "veteran";
            },
            stages: ["经验分享者", "新人托底者", "团队导师", "传承核心", "人才孵化器"],
            bonuses: level => ({ loyalty: Math.min(5, level), teamXp: Math.min(6, level + 1) })
        },
        producer: {
            name: "制作骨干",
            icon: "fa-solid fa-clipboard-check",
            color: "#c084fc",
            match: emp => {
                const total = (emp.stats?.code || 0) + (emp.stats?.art || 0) + (emp.stats?.design || 0);
                return emp.trait === "multi" || total >= 80;
            },
            stages: ["补位成员", "流程维护者", "制作骨干", "项目副手", "团队稳定器"],
            bonuses: level => ({ fatigueRelief: Math.min(5, level), efficiency: Math.min(6, level) })
        }
    };

    function careerXpForNext(level) {
        return 36 + Math.max(0, level - 1) * 18;
    }

    function inferCareerPath(emp) {
        ensureVitals(emp);
        const tags = emp.psychology?.growthTags || [];
        if (tags.some(tag => /带人|传承|开始能带人/.test(tag))) return "mentor";
        if (emp.trait === "multi" && (emp.level || 1) >= 4) return "producer";
        const ordered = ["engineer", "artist", "designer", "producer", "mentor"];
        return ordered.find(key => CAREER_PATHS[key].match(emp)) || "producer";
    }

    function ensureEmployeeCareer(emp) {
        if (!emp) return emp;
        ensureVitals(emp);
        const existing = emp.career || {};
        const pathKey = CAREER_PATHS[existing.pathKey] ? existing.pathKey : inferCareerPath(emp);
        emp.career = {
            pathKey,
            level: Math.max(1, Math.min(5, Number(existing.level || Math.min(5, Math.max(1, Math.floor((emp.level || 1) / 2) + 1))))),
            xp: Math.max(0, Number(existing.xp || emp.xp || 0)),
            title: existing.title || "",
            milestones: Array.isArray(existing.milestones) ? existing.milestones.slice(-8) : []
        };
        updateEmployeeCareerTitle(emp);
        return emp;
    }

    function updateEmployeeCareerTitle(emp) {
        ensureVitals(emp);
        const career = emp.career || {};
        const path = CAREER_PATHS[career.pathKey] || CAREER_PATHS.producer;
        const stage = path.stages[Math.max(0, Math.min(path.stages.length - 1, (career.level || 1) - 1))];
        career.title = `${path.name} · ${stage}`;
        emp.career = career;
        return career.title;
    }

    function addCareerMilestone(emp, text) {
        if (!text) return;
        ensureEmployeeCareer(emp);
        emp.career.milestones.push(String(text).slice(0, 80));
        emp.career.milestones = emp.career.milestones.slice(-8);
    }

    function addEmployeeCareerXp(emp, amount, reason, gameState) {
        if (!emp || emp.id === "player") return null;
        ensureEmployeeCareer(emp);
        const career = emp.career;
        career.xp = Math.max(0, (career.xp || 0) + Math.max(0, Math.round(amount || 0)));
        let leveled = 0;
        while (career.level < 5 && career.xp >= careerXpForNext(career.level)) {
            career.xp -= careerXpForNext(career.level);
            career.level += 1;
            leveled += 1;
            applyCareerLevelBonus(emp, gameState);
        }
        if (reason) addCareerMilestone(emp, reason);
        updateEmployeeCareerTitle(emp);
        if (leveled > 0) {
            if (root.addEmployeeMemory) root.addEmployeeMemory(emp, `职业成长为「${career.title}」，团队开始用新的方式依赖 TA。`, gameState);
            if (root.addChronicleEntry) root.addChronicleEntry(`🌟 ${emp.name} 成长为「${career.title}」。`);
        }
        return { career, leveled };
    }

    function applyCareerLevelBonus(emp, gameState) {
        ensureEmployeeCareer(emp);
        const path = CAREER_PATHS[emp.career.pathKey] || CAREER_PATHS.producer;
        const bonus = path.bonuses(emp.career.level);
        emp.stats = emp.stats || { code: 0, art: 0, design: 0 };
        if (bonus.code) emp.stats.code += bonus.code;
        if (bonus.art) emp.stats.art += bonus.art;
        if (bonus.design) emp.stats.design += bonus.design;
        if (bonus.satisfaction) emp.satisfaction = clamp((emp.satisfaction || 70) + bonus.satisfaction);
        if (bonus.loyalty) emp.loyalty = clamp((emp.loyalty || 55) + bonus.loyalty);
        if (bonus.fatigueRelief) emp.fatigue = clamp((emp.fatigue || 0) - bonus.fatigueRelief);
        if (bonus.rp && gameState) gameState.rp = Math.max(0, (gameState.rp || 0) + bonus.rp);
    }

    function tickEmployeeCareers(gameState, activeDevCount) {
        if (!gameState || !Array.isArray(gameState.employees)) return [];
        const updates = [];
        gameState.employees.forEach(emp => {
            if (!emp || emp.id === "player") return;
            ensureEmployeeCareer(emp);
            let gain = 1;
            if (activeDevCount > 0) gain += 2;
            if ((emp.satisfaction || 70) >= 82) gain += 1;
            if ((emp.fatigue || 0) >= 82) gain -= 1;
            if ((emp.psychology?.growthTags || []).length >= 2) gain += 1;
            const result = addEmployeeCareerXp(emp, Math.max(0, gain), "日常协作经验累积", gameState);
            if (result) updates.push({ emp, ...result });
        });
        return updates;
    }

    function careerBadgeHtml(emp) {
        ensureEmployeeCareer(emp);
        const path = CAREER_PATHS[emp.career.pathKey] || CAREER_PATHS.producer;
        return `<span class="career-badge" title="${safe(emp.career.title)}" style="--career-color:${path.color};"><i class="${path.icon}"></i>${safe(path.name)} Lv.${emp.career.level}</span>`;
    }

    function employeeCareerHtml(emp) {
        ensureEmployeeCareer(emp);
        const path = CAREER_PATHS[emp.career.pathKey] || CAREER_PATHS.producer;
        const need = careerXpForNext(emp.career.level);
        const pct = emp.career.level >= 5 ? 100 : Math.round(Math.min(100, (emp.career.xp / need) * 100));
        const milestones = emp.career.milestones.length
            ? emp.career.milestones.slice(-3).reverse().map(text => `<li>${safe(text)}</li>`).join("")
            : `<li>还没有形成明确的职业里程碑。</li>`;
        return `
            <div class="employee-career-card" style="--career-color:${path.color};">
                <div class="employee-career-head">
                    <span><i class="${path.icon}"></i> 职业路线</span>
                    <b>${safe(emp.career.title)}</b>
                </div>
                <div class="employee-career-track">
                    <div style="width:${pct}%"></div>
                </div>
                <div class="employee-career-meta">
                    <span>成长 Lv.${emp.career.level}/5</span>
                    <span>${emp.career.level >= 5 ? "已成熟" : `${Math.round(emp.career.xp)} / ${need} XP`}</span>
                </div>
                <ul class="employee-career-milestones">${milestones}</ul>
            </div>
        `;
    }

    return {
        CAREER_PATHS,
        careerXpForNext,
        inferCareerPath,
        ensureEmployeeCareer,
        addEmployeeCareerXp,
        tickEmployeeCareers,
        careerBadgeHtml,
        employeeCareerHtml
    };
});
