// ==========================================================================
// Employee relationships: long-term chemistry, friction and relationship UI.
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

    function ensure(emp) {
        if (root.ensureEmployeeVitals) root.ensureEmployeeVitals(emp);
        if (root.ensureEmployeePsychology) root.ensureEmployeePsychology(emp);
        if (!emp.relations || typeof emp.relations !== "object" || Array.isArray(emp.relations)) emp.relations = {};
        return emp;
    }

    function relationKey(emp, index) {
        return emp.id || emp.name || `emp_${index}`;
    }

    function playableEmployees(gameState) {
        if (!gameState || !Array.isArray(gameState.employees)) return [];
        return gameState.employees.filter(emp => emp && emp.id !== "player");
    }

    function dateStamp(gameState) {
        const d = gameState && gameState.date ? gameState.date : {};
        return `${d.year || 1}-${d.month || 1}-${d.week || 1}`;
    }

    function relationTone(rel) {
        if (!rel) return { key: "neutral", label: "普通同事", hint: "还没有形成明显关系。" };
        if ((rel.tension || 0) >= 72) return { key: "risk", label: "暗流紧张", hint: "两人容易把分歧带进协作节奏。" };
        if ((rel.tension || 0) >= 56) return { key: "warn", label: "有点摩擦", hint: "需要更清楚的边界和复盘。" };
        if ((rel.affinity || 0) >= 74 && (rel.respect || 0) >= 64) return { key: "good", label: "默契搭档", hint: "两人能自然补位，合作会更稳。" };
        if ((rel.respect || 0) >= 76) return { key: "trust", label: "彼此信服", hint: "未必总是亲近，但愿意听对方判断。" };
        if ((rel.affinity || 0) >= 68) return { key: "warm", label: "关系升温", hint: "工作之外也开始有一些共同语言。" };
        return { key: "neutral", label: "普通同事", hint: "关系还在观察期。" };
    }

    function relationLine(a, b, rel) {
        const tone = relationTone(rel);
        if (tone.key === "risk") return `${a.name} 和 ${b.name} 最近说话都很克制，像是在等对方先退一步。`;
        if (tone.key === "warn") return `${a.name} 和 ${b.name} 能合作，但需要把边界说清楚。`;
        if (tone.key === "good") return `${a.name} 和 ${b.name} 已经能提前补上对方没说出口的部分。`;
        if (tone.key === "trust") return `${a.name} 不一定总同意 ${b.name}，但会认真听完对方的判断。`;
        if (tone.key === "warm") return `${a.name} 和 ${b.name} 开始有一些只有他们懂的工作默契。`;
        return `${a.name} 和 ${b.name} 还在普通同事的距离里互相观察。`;
    }

    function pairDeltas(a, b, activeDevCount) {
        const bothTired = (a.fatigue || 0) >= 72 && (b.fatigue || 0) >= 72;
        const bothHappy = (a.satisfaction || 70) >= 76 && (b.satisfaction || 70) >= 76;
        const roleComplement = a.role !== b.role;
        const mentorPair = [a.archetype, b.archetype].includes("fresh") && [a.archetype, b.archetype].includes("veteran");
        const idealVsPragmatic = [a.archetype, b.archetype].includes("idealist") && [a.archetype, b.archetype].includes("pragmatic");
        const debugVsLazy = [a.trait, b.trait].includes("debug") && [a.trait, b.trait].includes("lazy");
        return {
            affinity: (bothHappy ? 2 : 0) + (activeDevCount === 0 ? 1 : 0) + (mentorPair ? 1 : 0) - (bothTired ? 2 : 0),
            respect: (roleComplement && activeDevCount > 0 ? 1 : 0) + (mentorPair ? 2 : 0) - (debugVsLazy && activeDevCount > 0 ? 1 : 0),
            tension: (bothTired ? 3 : 0) + (idealVsPragmatic && activeDevCount > 0 ? 2 : 0) + (debugVsLazy && activeDevCount > 0 ? 2 : 0) - (bothHappy ? 1 : 0) - (activeDevCount === 0 ? 1 : 0)
        };
    }

    function patchRelation(rel, deltas, stamp) {
        rel.affinity = clamp((rel.affinity == null ? 50 : rel.affinity) + deltas.affinity);
        rel.respect = clamp((rel.respect == null ? 50 : rel.respect) + deltas.respect);
        rel.tension = clamp((rel.tension == null ? 20 : rel.tension) + deltas.tension);
        rel.weeksTogether = Math.max(0, Number(rel.weeksTogether || 0) + 1);
        rel.momentum = clamp((rel.affinity + rel.respect - rel.tension) / 2, -50, 100);
        rel.lastTick = stamp;
        return rel;
    }

    function tickEmployeeRelationships(gameState, activeDevCount) {
        const members = playableEmployees(gameState);
        if (members.length < 2) return [];
        if (root.ensureEmployeeRelationships) root.ensureEmployeeRelationships(gameState);
        const stamp = dateStamp(gameState);
        const updates = [];
        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                const a = ensure(members[i]);
                const b = ensure(members[j]);
                const keyA = relationKey(b, j);
                const keyB = relationKey(a, i);
                const relA = a.relations[keyA];
                const relB = b.relations[keyB];
                if (!relA || !relB || relA.lastTick === stamp) continue;
                const deltas = pairDeltas(a, b, activeDevCount || 0);
                patchRelation(relA, deltas, stamp);
                patchRelation(relB, deltas, stamp);
                relB.role = relA.role;
                updates.push({ a, b, relation: relA, deltas });
            }
        }
        return updates;
    }

    function employeeRelationshipRows(emp, gameState) {
        ensure(emp);
        const members = playableEmployees(gameState);
        if (root.ensureEmployeeRelationships) root.ensureEmployeeRelationships(gameState);
        const index = members.indexOf(emp);
        return members
            .filter(other => other !== emp)
            .map(other => {
                const otherIndex = members.indexOf(other);
                const rel = emp.relations[relationKey(other, otherIndex)] || {};
                const tone = relationTone(rel);
                return { other, rel, tone, selfIndex: index, otherIndex };
            })
            .sort((a, b) => {
                const scoreA = Math.max(a.rel.affinity || 0, a.rel.respect || 0, a.rel.tension || 0);
                const scoreB = Math.max(b.rel.affinity || 0, b.rel.respect || 0, b.rel.tension || 0);
                return scoreB - scoreA;
            });
    }

    function employeeRelationshipHtml(emp, gameState) {
        const rows = employeeRelationshipRows(emp, gameState).slice(0, 4);
        if (!rows.length) return "";
        const body = rows.map(row => `
            <div class="employee-relation-row ${safe(row.tone.key)}">
                <div>
                    <b>${safe(row.other.name)}</b>
                    <span>${safe(row.rel.role || "同事关系")} · ${safe(row.tone.label)}</span>
                    <p>${safe(relationLine(emp, row.other, row.rel))}</p>
                </div>
                <div class="employee-relation-bars">
                    <span style="--v:${Math.round(row.rel.affinity || 0)}"><i>亲和</i><b>${Math.round(row.rel.affinity || 0)}</b></span>
                    <span style="--v:${Math.round(row.rel.respect || 0)}"><i>尊重</i><b>${Math.round(row.rel.respect || 0)}</b></span>
                    <span style="--v:${Math.round(row.rel.tension || 0)}"><i>摩擦</i><b>${Math.round(row.rel.tension || 0)}</b></span>
                </div>
            </div>
        `).join("");
        return `
            <div class="employee-relations-card">
                <strong><i class="fa-solid fa-people-line"></i> 同事关系</strong>
                ${body}
            </div>
        `;
    }

    function teamRelationshipHighlights(gameState) {
        if (root.ensureEmployeeRelationships) root.ensureEmployeeRelationships(gameState);
        return playableEmployees(gameState)
            .flatMap((emp, i, members) => members.slice(i + 1).map((other, offset) => {
                const otherIndex = i + 1 + offset;
                const rel = emp.relations && emp.relations[relationKey(other, otherIndex)];
                return rel ? { a: emp, b: other, relation: rel, tone: relationTone(rel), line: relationLine(emp, other, rel) } : null;
            }))
            .filter(Boolean)
            .sort((a, b) => {
                const scoreA = Math.max(a.relation.affinity || 0, a.relation.respect || 0, a.relation.tension || 0);
                const scoreB = Math.max(b.relation.affinity || 0, b.relation.respect || 0, b.relation.tension || 0);
                return scoreB - scoreA;
            })
            .slice(0, 5);
    }

    return {
        relationTone,
        tickEmployeeRelationships,
        employeeRelationshipRows,
        employeeRelationshipHtml,
        teamRelationshipHighlights
    };
});
