// ==========================================================================
// Employee psychology: inner motives, heart knots and lightweight relationships.
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

    const HEART_KNOTS = {
        prove_self: {
            title: "害怕拖累团队",
            summary: "很想证明自己，但一旦方案被否定，就会怀疑是不是自己不够格。",
            need: "给他小而完整的责任，并在复盘时指出具体成长。"
        },
        old_project_shadow: {
            title: "旧项目阴影",
            summary: "过去见过项目失控，所以对风险、流程和承诺格外敏感。",
            need: "别用空话安抚他，给清晰边界、备选方案和复盘权。"
        },
        unseen_effort: {
            title: "害怕努力白费",
            summary: "看起来松散，其实是不想把认真交给一个不会看见它的地方。",
            need: "认可他的实际贡献，再用明确目标把他从躲闪里拉出来。"
        },
        broken_promises: {
            title: "不信画饼",
            summary: "对薪资、合同和承诺非常敏感，听过太多以后再说。",
            need: "少讲愿景，多给可兑现的数字、期限和规则。"
        },
        sellout_fear: {
            title: "怕作品失去表达",
            summary: "能接受商业压力，但害怕团队只剩下追热点和变现。",
            need: "保留一块创作自留地，让他知道妥协不是投降。"
        },
        stability_hunger: {
            title: "需要稳定感",
            summary: "不是不敢冒险，而是需要知道团队能不能按时发薪、按计划活下去。",
            need: "透明说明现金流和排期，别把风险包装成热血。"
        },
        freedom_anxiety: {
            title: "害怕被固定住",
            summary: "习惯同时做很多事，被管得太死会迅速失去动力。",
            need: "给清晰交付边界，同时保留一点自主空间。"
        },
        control_anxiety: {
            title: "控制感焦虑",
            summary: "对不确定性格外敏感，Bug、脏数据和模糊需求都会让他坐立不安。",
            need: "给他可追踪的问题清单，而不是一句“你看着办”。"
        },
        founder_burden: {
            title: "创始人的担子",
            summary: "不会离开，但会把团队的压力吞进自己身上。",
            need: "适当休整和授权，否则创始人会成为节奏瓶颈。"
        }
    };

    const ARCHETYPE_BASE = {
        fresh: { ambition: 76, securityNeed: 45, creativeDrive: 62, trustInFounder: 58, knotKey: "prove_self" },
        veteran: { ambition: 58, securityNeed: 72, creativeDrive: 54, trustInFounder: 42, knotKey: "old_project_shadow" },
        idealist: { ambition: 64, securityNeed: 34, creativeDrive: 88, trustInFounder: 54, knotKey: "sellout_fear" },
        pragmatic: { ambition: 48, securityNeed: 82, creativeDrive: 42, trustInFounder: 56, knotKey: "stability_hunger" },
        slash: { ambition: 66, securityNeed: 48, creativeDrive: 70, trustInFounder: 40, knotKey: "freedom_anxiety" },
        lazy: { ambition: 35, securityNeed: 58, creativeDrive: 46, trustInFounder: 52, knotKey: "unseen_effort" }
    };

    const TRAIT_SHIFT = {
        debug: { ambition: 4, creativeDrive: -4, trustInFounder: -2, knotKey: "control_anxiety" },
        idea: { ambition: 6, creativeDrive: 14 },
        multi: { ambition: 8, trustInFounder: 4 },
        salary: { securityNeed: 16, trustInFounder: -8, knotKey: "broken_promises" },
        lazy: { ambition: -8, securityNeed: 4, knotKey: "unseen_effort" },
        none: {}
    };

    function ensure(emp) {
        if (root.ensureEmployeeVitals) root.ensureEmployeeVitals(emp);
        return emp;
    }

    function mergeBase(emp) {
        const archetype = emp.id === "player" ? "founder" : (emp.archetype || "pragmatic");
        const base = archetype === "founder"
            ? { ambition: 72, securityNeed: 64, creativeDrive: 66, trustInFounder: 100, knotKey: "founder_burden" }
            : (ARCHETYPE_BASE[archetype] || ARCHETYPE_BASE.pragmatic);
        const shift = TRAIT_SHIFT[emp.trait || "none"] || {};
        return {
            ambition: clamp(base.ambition + (shift.ambition || 0)),
            securityNeed: clamp(base.securityNeed + (shift.securityNeed || 0)),
            creativeDrive: clamp(base.creativeDrive + (shift.creativeDrive || 0)),
            trustInFounder: clamp(base.trustInFounder + (shift.trustInFounder || 0)),
            knotKey: shift.knotKey || base.knotKey
        };
    }

    function ensureEmployeePsychology(emp) {
        if (!emp) return emp;
        ensure(emp);
        const base = mergeBase(emp);
        const existing = emp.psychology && typeof emp.psychology === "object" && !Array.isArray(emp.psychology)
            ? emp.psychology
            : {};
        emp.psychology = {
            ambition: clamp(existing.ambition == null ? base.ambition : existing.ambition),
            securityNeed: clamp(existing.securityNeed == null ? base.securityNeed : existing.securityNeed),
            creativeDrive: clamp(existing.creativeDrive == null ? base.creativeDrive : existing.creativeDrive),
            trustInFounder: clamp(existing.trustInFounder == null ? base.trustInFounder : existing.trustInFounder),
            burnoutRisk: clamp(existing.burnoutRisk == null ? 0 : existing.burnoutRisk),
            knotKey: HEART_KNOTS[existing.knotKey] ? existing.knotKey : base.knotKey,
            growthTags: Array.isArray(existing.growthTags) ? existing.growthTags.slice(0, 8) : []
        };
        updateDynamicPsychology(emp);
        if (!emp.relations || typeof emp.relations !== "object" || Array.isArray(emp.relations)) emp.relations = {};
        return emp;
    }

    function updateDynamicPsychology(emp) {
        if (!emp || !emp.psychology) return emp;
        const fatigue = emp.fatigue || 0;
        const satisfaction = emp.satisfaction == null ? 70 : emp.satisfaction;
        const loyalty = emp.loyalty == null ? 55 : emp.loyalty;
        const stress = Math.max(0, fatigue - 45) * 0.72 + Math.max(0, 48 - satisfaction) * 0.55;
        emp.psychology.burnoutRisk = clamp(Math.round(stress));
        if (loyalty >= 82) emp.psychology.trustInFounder = clamp(emp.psychology.trustInFounder + 1);
        if (satisfaction <= 35) emp.psychology.trustInFounder = clamp(emp.psychology.trustInFounder - 1);
        return emp;
    }

    function employeeHeartKnot(emp) {
        ensureEmployeePsychology(emp);
        return HEART_KNOTS[emp.psychology.knotKey] || HEART_KNOTS.stability_hunger;
    }

    function employeeMindLabel(emp) {
        ensureEmployeePsychology(emp);
        const p = emp.psychology;
        if (p.burnoutRisk >= 66) return { tone: "risk", label: "快撑不住" };
        if (p.trustInFounder <= 32) return { tone: "warn", label: "信任动摇" };
        if (p.ambition >= 72) return { tone: "good", label: "想证明自己" };
        if (p.creativeDrive >= 78) return { tone: "idea", label: "表达欲强" };
        if (p.securityNeed >= 76) return { tone: "watch", label: "需要稳定" };
        return { tone: "neutral", label: "状态平稳" };
    }

    function employeeMindChipHtml(emp) {
        const label = employeeMindLabel(emp);
        const knot = employeeHeartKnot(emp);
        return `<div class="condition-pill employee-mind-pill ${safe(label.tone)}" title="${safe(knot.summary)}">${safe(label.label)}</div>`;
    }

    function employeePsychologyHtml(emp) {
        ensureEmployeePsychology(emp);
        const p = emp.psychology;
        const knot = employeeHeartKnot(emp);
        const label = employeeMindLabel(emp);
        const tags = p.growthTags.length
            ? p.growthTags.map(tag => `<span>${safe(tag)}</span>`).join("")
            : `<span>尚未形成长期成长标签</span>`;
        return `
            <div class="employee-psych-card ${safe(label.tone)}">
                <div class="employee-psych-head">
                    <span><i class="fa-solid fa-brain"></i> 内心状态</span>
                    <b>${safe(label.label)}</b>
                </div>
                <div class="employee-psych-grid">
                    <div><span>野心</span><b>${Math.round(p.ambition)}</b></div>
                    <div><span>稳定需求</span><b>${Math.round(p.securityNeed)}</b></div>
                    <div><span>表达欲</span><b>${Math.round(p.creativeDrive)}</b></div>
                    <div><span>信任</span><b>${Math.round(p.trustInFounder)}</b></div>
                </div>
                <div class="employee-heart-knot">
                    <strong>${safe(knot.title)}</strong>
                    <p>${safe(knot.summary)}</p>
                    <p><em>${safe(knot.need)}</em></p>
                </div>
                <div class="employee-growth-tags">${tags}</div>
            </div>
        `;
    }

    function relationKey(emp, index) {
        return emp.id || emp.name || `emp_${index}`;
    }

    function relationRole(a, b) {
        if ([a.archetype, b.archetype].includes("fresh") && [a.archetype, b.archetype].includes("veteran")) return "师徒";
        if (a.role !== b.role && (a.role === "artist" || b.role === "artist") && (a.role === "designer" || b.role === "designer")) return "协作搭档";
        if (a.trait === "idea" && b.trait === "idea") return "灵感共振";
        if (a.trait === "lazy" && b.trait === "lazy") return "摸鱼同盟";
        if (a.trait === "salary" || b.trait === "salary") return "现实拉扯";
        return "普通同事";
    }

    function baseRelation(a, b) {
        let affinity = 52;
        let respect = 50;
        let tension = 18;
        if (relationRole(a, b) === "师徒") { affinity += 10; respect += 16; }
        if (relationRole(a, b) === "协作搭档") { affinity += 8; respect += 8; }
        if (a.archetype === "idealist" && b.archetype === "pragmatic" || b.archetype === "idealist" && a.archetype === "pragmatic") tension += 18;
        if (a.trait === "lazy" && b.trait === "debug" || b.trait === "lazy" && a.trait === "debug") tension += 10;
        if (a.satisfaction >= 80 && b.satisfaction >= 80) affinity += 8;
        if ((a.fatigue || 0) >= 75 || (b.fatigue || 0) >= 75) tension += 8;
        return { affinity: clamp(affinity), respect: clamp(respect), tension: clamp(tension), role: relationRole(a, b) };
    }

    function ensureEmployeeRelationships(gameState) {
        if (!gameState || !Array.isArray(gameState.employees)) return [];
        if (root.ensureEmployeeEcosystem) root.ensureEmployeeEcosystem(gameState);
        const emps = gameState.employees.filter(emp => emp.id !== "player");
        emps.forEach(ensureEmployeePsychology);
        const beats = [];
        for (let i = 0; i < emps.length; i++) {
            for (let j = i + 1; j < emps.length; j++) {
                const a = emps[i];
                const b = emps[j];
                const keyA = relationKey(b, j);
                const keyB = relationKey(a, i);
                const base = baseRelation(a, b);
                const relA = a.relations[keyA] || base;
                const relB = b.relations[keyB] || base;
                a.relations[keyA] = {
                    affinity: clamp(relA.affinity == null ? base.affinity : relA.affinity),
                    respect: clamp(relA.respect == null ? base.respect : relA.respect),
                    tension: clamp(relA.tension == null ? base.tension : relA.tension),
                    role: relA.role || base.role
                };
                b.relations[keyB] = {
                    affinity: clamp(relB.affinity == null ? base.affinity : relB.affinity),
                    respect: clamp(relB.respect == null ? base.respect : relB.respect),
                    tension: clamp(relB.tension == null ? base.tension : relB.tension),
                    role: relB.role || base.role
                };
                beats.push({ a, b, relation: a.relations[keyA] });
            }
        }
        return beats;
    }

    function teamRelationshipBeats(gameState) {
        return ensureEmployeeRelationships(gameState)
            .sort((left, right) => {
                const leftScore = Math.max(left.relation.affinity, left.relation.respect, left.relation.tension);
                const rightScore = Math.max(right.relation.affinity, right.relation.respect, right.relation.tension);
                return rightScore - leftScore;
            })
            .slice(0, 3);
    }

    function tickEmployeePsychology(gameState, activeDevCount) {
        if (!gameState || !Array.isArray(gameState.employees)) return;
        gameState.employees.forEach(emp => {
            ensureEmployeePsychology(emp);
            if (activeDevCount > 0) {
                emp.psychology.trustInFounder = clamp(emp.psychology.trustInFounder + (emp.satisfaction >= 70 ? 1 : -1));
            }
            updateDynamicPsychology(emp);
        });
        ensureEmployeeRelationships(gameState);
    }

    return {
        HEART_KNOTS,
        ensureEmployeePsychology,
        updateDynamicPsychology,
        employeeHeartKnot,
        employeeMindLabel,
        employeeMindChipHtml,
        employeePsychologyHtml,
        ensureEmployeeRelationships,
        teamRelationshipBeats,
        tickEmployeePsychology
    };
});
