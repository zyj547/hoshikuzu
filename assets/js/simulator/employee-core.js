// ==========================================================================
// Employee core tools: vitals, memory, profile, retention and renewal helpers.
// ==========================================================================
(function (root, factory) {
    const api = factory(root);
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    const MEMORY_LIMIT = 12;

    function employeeClamp(v, min = 0, max = 100) {
        const n = Number(v);
        if (!Number.isFinite(n)) return min;
        return Math.max(min, Math.min(max, n));
    }

    function nowDateText(gameState) {
        const d = gameState && gameState.date ? gameState.date : { year: 1, month: 1, week: 1 };
        return `第 ${d.year} 年 ${d.month} 月第 ${d.week} 周`;
    }

    function ensureEmployeeVitals(emp) {
        if (!emp) return emp;
        if (emp.satisfaction == null) emp.satisfaction = emp.morale == null ? 70 : employeeClamp(emp.morale);
        if (emp.loyalty == null) {
            const base = emp.id === "player" ? 100 : 52;
            const moraleBonus = Math.round(((emp.morale == null ? 75 : emp.morale) - 70) * 0.2);
            emp.loyalty = employeeClamp(base + moraleBonus);
        }
        if (!Array.isArray(emp.memories)) emp.memories = [];
        if (!emp.storyFlags || typeof emp.storyFlags !== "object" || Array.isArray(emp.storyFlags)) emp.storyFlags = {};
        if (!emp.statusText) emp.statusText = "整理今天的任务";
        if (!emp.statusTone) emp.statusTone = "neutral";
        return emp;
    }

    function ensureEmployeeEcosystem(gameState) {
        if (!gameState || !Array.isArray(gameState.employees)) return;
        gameState.employees.forEach(ensureEmployeeVitals);
    }

    function addEmployeeMemory(emp, text, gameState) {
        if (!emp || !text) return;
        ensureEmployeeVitals(emp);
        emp.memories.push({ date: nowDateText(gameState), text: String(text).slice(0, 140) });
        emp.memories = emp.memories.slice(-MEMORY_LIMIT);
    }

    function setEmployeeStatus(emp, text, tone = "neutral") {
        if (!emp) return;
        emp.statusText = text;
        emp.statusTone = tone;
    }

    function roleLabel(role) {
        if (role === "artist") return "美术";
        if (role === "designer") return "策划";
        return "程序";
    }

    function roleName(role) {
        if (role === "artist") return "美术设计师";
        if (role === "designer") return "核心策划";
        return "程序员";
    }

    function traitName(emp) {
        if (typeof EMPLOYEE_TRAITS !== "undefined" && EMPLOYEE_TRAITS[emp.trait || "none"]) return EMPLOYEE_TRAITS[emp.trait || "none"].name;
        return emp.trait || "无";
    }

    function archetypeName(emp) {
        if (typeof EMPLOYEE_ARCHETYPES !== "undefined" && EMPLOYEE_ARCHETYPES[emp.archetype || "pragmatic"]) return EMPLOYEE_ARCHETYPES[emp.archetype || "pragmatic"].name;
        return emp.archetype || "务实养家型";
    }

    function employeeTagHtml(emp) {
        ensureEmployeeVitals(emp);
        const safe = typeof escapeHtml === "function" ? escapeHtml : (s) => String(s == null ? "" : s);
        return `<div class="staff-live-status ${emp.statusTone || "neutral"}"><i class="fa-solid fa-wave-square"></i>${safe(emp.statusText || "")}</div>`;
    }

    function employeeMemoryHtml(emp) {
        ensureEmployeeVitals(emp);
        const safe = typeof escapeHtml === "function" ? escapeHtml : (s) => String(s == null ? "" : s);
        if (!emp.memories.length) return `<div class="memory-empty">还没有共同记忆。重要选择、特质事件、作品发行和离职都会记录在这里。</div>`;
        return emp.memories.slice().reverse().map(m => `
            <div class="memory-line">
                <span>${safe(m.date || "某一周")}</span>
                <p>${safe(m.text || "")}</p>
            </div>
        `).join("");
    }

    function buildEmployeeBio(emp, gameState) {
        ensureEmployeeVitals(emp);
        const memories = emp.memories || [];
        const bestMemory = memories.length ? memories[memories.length - 1].text : "还在等待属于自己的高光时刻。";
        return `《${emp.name}》${roleName(emp.role)} Lv.${emp.level || 1}
特质：${traitName(emp)} / 性格：${archetypeName(emp)}
能力：代码 ${emp.stats?.code || 0} · 美术 ${emp.stats?.art || 0} · 策划 ${emp.stats?.design || 0}
当前状态：${emp.statusText || "整理任务"}（情绪 ${Math.round(emp.satisfaction)}，忠诚 ${Math.round(emp.loyalty)}）
共同记忆：${bestMemory}
-- 来自《${gameState?.companyName || "桔子工作室"}》员工小传`;
    }

    function copyEmployeeBio(idx) {
        const emp = root.gameState && root.gameState.employees ? root.gameState.employees[idx] : null;
        if (!emp) return;
        const text = buildEmployeeBio(emp, root.gameState);
        if (root.navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => alert("员工小传已复制，可以直接分享。", "员工年鉴"));
        } else {
            alert(`<pre style="white-space:pre-wrap;text-align:left;">${text}</pre>`, "员工年鉴");
        }
    }

    function openEmployeeMemory(idx) {
        const emp = root.gameState && root.gameState.employees ? root.gameState.employees[idx] : null;
        if (!emp) return;
        ensureEmployeeVitals(emp);
        const safe = typeof escapeHtml === "function" ? escapeHtml : (s) => String(s == null ? "" : s);
        const contract = typeof contractLabel === "function" ? contractLabel(emp) : "合同信息暂无";
        const isFounder = emp.id === "player";
        const morale = emp.morale == null ? 75 : emp.morale;
        const fatigue = emp.fatigue || 0;
        const efficiency = typeof employeeEfficiency === "function" ? Math.round(employeeEfficiency(emp) * 100) : 100;
        const body = `
            <div class="employee-profile-modal">
                <div class="employee-profile-hero">
                    <div>
                        <b>${safe(emp.name)}</b>
                        <span>${roleName(emp.role)} · Lv.${emp.level || 1} · ${isFounder ? "创始人" : contract}</span>
                    </div>
                    <button type="button" class="btn-research staff-action-btn memory" onclick="copyEmployeeBio(${idx})">复制小传</button>
                </div>
                <div class="employee-memory-head">
                    <span>心情 ${Math.round(morale)}</span>
                    <span>情绪 ${Math.round(emp.satisfaction)}</span>
                    <span>忠诚 ${Math.round(emp.loyalty)}</span>
                    <span>疲劳 ${Math.round(fatigue)}</span>
                    <span>效率 ${efficiency}%</span>
                </div>
                <div class="employee-profile-grid">
                    <div><span>代码</span><b>${emp.stats?.code || 0}</b></div>
                    <div><span>美术</span><b>${emp.stats?.art || 0}</b></div>
                    <div><span>策划</span><b>${emp.stats?.design || 0}</b></div>
                    <div><span>特质</span><b>${traitName(emp)}</b></div>
                    <div><span>性格</span><b>${archetypeName(emp)}</b></div>
                    <div><span>状态</span><b>${safe(emp.statusText || "整理任务")}</b></div>
                </div>
                <div class="employee-detail-section-title">共同记忆</div>
                <div class="employee-memory-list">${employeeMemoryHtml(emp)}</div>
            </div>
        `;
        if (typeof alert === "function") alert(body, `${emp.name} · 员工详情`);
    }

    function employeeFarewellText(emp, reason = "leave") {
        ensureEmployeeVitals(emp);
        const memories = Array.isArray(emp.memories) ? emp.memories : [];
        const lastMemory = memories.length ? `他最后提到：“${memories[memories.length - 1].text}”` : "";
        if (emp.loyalty >= 78) return `他留下一张纸条：谢谢你认真把我当成团队的一员。${lastMemory}`;
        if (emp.loyalty <= 35) return emp.archetype === "slash" ? "桌上只剩一张便签：有缘江湖再见。" : "他收拾得很快，几乎没有回头。";
        if (reason === "fire") return `他点点头，带走了自己的杯子。${lastMemory}`;
        return `他认真道别，把手头资料整理得很清楚。${lastMemory}`;
    }

    function employeeRetentionMultiplier(emp) {
        ensureEmployeeVitals(emp);
        let multiplier = emp.loyalty >= 82 ? 0.45 : emp.loyalty >= 68 ? 0.7 : emp.loyalty <= 30 ? 1.55 : emp.loyalty <= 45 ? 1.25 : 1;
        const memoryText = (emp.memories || []).map(m => m.text || "").join(" ");
        if (/升职|神作|爆款|共同|感谢/.test(memoryText)) multiplier *= 0.85;
        if (/离职|争吵|疲惫|被忽视/.test(memoryText)) multiplier *= 1.18;
        return multiplier;
    }

    function employeeRenewalRaiseModifier(emp) {
        ensureEmployeeVitals(emp);
        let modifier = 0;
        if (emp.loyalty >= 80) modifier -= 0.08;
        if (emp.loyalty <= 38) modifier += 0.14;
        if ((emp.memories || []).some(m => /爆款|神作|共同/.test(m.text || ""))) modifier -= 0.04;
        if ((emp.memories || []).some(m => /离职|疲惫|争吵/.test(m.text || ""))) modifier += 0.06;
        return modifier;
    }

    return {
        employeeClamp,
        nowDateText,
        ensureEmployeeVitals,
        ensureEmployeeEcosystem,
        addEmployeeMemory,
        setEmployeeStatus,
        roleLabel,
        roleName,
        traitName,
        archetypeName,
        employeeTagHtml,
        employeeMemoryHtml,
        buildEmployeeBio,
        copyEmployeeBio,
        openEmployeeMemory,
        employeeFarewellText,
        employeeRetentionMultiplier,
        employeeRenewalRaiseModifier
    };
});
