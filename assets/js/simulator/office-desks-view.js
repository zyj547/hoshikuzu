// ==========================================================================
// Office desk view: employee card layout and interactions.
// ==========================================================================

async function confirmTrain(i) {
    const emp = gameState.employees[i];
    if (!emp) return;
    let cost = emp.level * 4000;
    if (emp.trait === "lazy") cost = Math.round(cost / 2);
    const msg = `
        <div style="text-align:left; line-height:1.7;">
            <div style="font-weight:700; color:#fff; margin-bottom:0.4rem;">培训《${escapeHtml(emp.name)}》</div>
            <div>费用：<b style="color:var(--accent-pink);">¥${cost.toLocaleString()}</b></div>
            <div>效果：等级 +1，对应专业属性成长，月薪上调约 25%。</div>
            ${emp.trait === "lazy" ? `<div style="color:var(--accent-yellow);">摸鱼达人：培训费减半，但属性成长更随机。</div>` : ""}
            <div style="margin-top:0.45rem; opacity:0.85;">确定为其安排培训吗？</div>
        </div>`;
    if (await confirm(msg, "员工培训")) trainEmployee(i);
}

async function confirmRest(i) {
    const emp = gameState.employees[i];
    if (!emp) return;
    const cost = Math.max(800, Math.round(emp.salary * 0.6));
    const msg = `
        <div style="text-align:left; line-height:1.7;">
            <div style="font-weight:700; color:#fff; margin-bottom:0.4rem;">带薪休整《${escapeHtml(emp.name)}》</div>
            <div>费用：<b style="color:var(--accent-pink);">¥${cost.toLocaleString()}</b></div>
            <div>效果：疲劳 -35，心情 +18。</div>
            <div style="margin-top:0.45rem; opacity:0.85;">确定安排休整吗？</div>
        </div>`;
    if (await confirm(msg, "带薪休整")) restEmployee(i);
}

function loadOfficeDesks() {
    const container = document.getElementById("office-desks");
    if (!container) return;
    container.innerHTML = "";

    const specialtyNames = {
        engine: "引擎架构师",
        fullstack: "全栈工程师",
        concept: "原画主美",
        animator: "特效主美",
        systems: "系统策划",
        writer: "创意主笔"
    };

    const officeSlots = gameState.officeSlots || 3;
    for (let i = 0; i < officeSlots; i++) {
        const emp = gameState.employees[i];
        const card = document.createElement("div");
        card.className = emp ? `desk-card employee-card ${emp.id === "player" ? "founder-desk-card" : ""}` : "desk-card empty-desk-card";

        if (emp) {
            if (typeof ensureEmployeeVitals === "function") ensureEmployeeVitals(emp);
            let iconClass = "fa-laptop-code";
            if (emp.role === "artist") iconClass = "fa-palette";
            if (emp.role === "designer") iconClass = "fa-lightbulb";
            const roleNameText = typeof roleName === "function" ? roleName(emp.role) : "程序员";

            let specialtyTagHtml = "";
            if (emp.specialty) {
                let tagColor = "var(--accent-neon)";
                if (emp.role === "artist") tagColor = "var(--accent-pink)";
                if (emp.role === "designer") tagColor = "var(--accent-yellow)";
                specialtyTagHtml = `<span class="specialty-tag" title="${specialtyNames[emp.specialty] || emp.specialty}" style="border-color:${tagColor}; color:${tagColor}; text-shadow:0 0 5px ${tagColor};">${specialtyNames[emp.specialty] || emp.specialty}</span>`;
            }

            let rarityBadgeHtml;
            if (i === 0 || emp.id === "player") {
                const ft = founderTitle();
                rarityBadgeHtml = `<span class="desk-rarity-badge" title="${ft.name}" style="color:${ft.color}; border-color:${ft.color};"><i class="${ft.icon}"></i> ${ft.name}</span>`;
            } else {
                const empRarity = HIRING_RARITIES[emp.rarity || "R"];
                rarityBadgeHtml = `<span class="desk-rarity-badge" title="${empRarity.name}" style="color:${empRarity.color}; border-color:${empRarity.color};">${empRarity.name}</span>`;
            }

            const morale = emp.morale == null ? 75 : emp.morale;
            const fatigue = emp.fatigue || 0;
            const satisfaction = emp.satisfaction == null ? morale : emp.satisfaction;
            const loyalty = emp.loyalty == null ? (emp.id === "player" ? 100 : 55) : emp.loyalty;
            const efficiency = Math.round(employeeEfficiency(emp) * 100);
            const fireButtonHtml = i === 0 || emp.id === "player"
                ? `<button type="button" class="btn-research staff-action-btn founder-lock" disabled><i class="fa-solid fa-crown"></i> 创始人</button>`
                : `<button type="button" class="btn-research staff-action-btn fire" onclick="fireEmployee(${i})">开除</button>`;
            const specializeButtonHtml = emp.level >= 5 && !emp.specialty
                ? `<button type="button" class="btn-research staff-action-btn specialize" onclick="openSpecialtyModal(${i})">专精</button>`
                : "";

            card.dataset.employeeDetailCard = String(i);
            card.innerHTML = `
                <div class="staff-avatar-box" data-employee-detail="${i}" onclick="openOfficeDeskDetail(${i}); return false;" title="打开员工详情">
                    <div class="staff-avatar ${emp.role}">
                        <i class="fa-solid ${iconClass}"></i>
                        <span class="staff-role-badge">Lv</span>
                    </div>
                    <div class="staff-profile">
                        <div class="staff-name-row">
                            <span class="staff-name" title="${escapeHtml(emp.name)}">${escapeHtml(emp.name)}</span>
                            ${rarityBadgeHtml}
                            ${specialtyTagHtml}
                        </div>
                        <span class="staff-level">${roleNameText} · Lv.${emp.level}</span>
                        ${typeof employeeTagHtml === "function" ? employeeTagHtml(emp) : ""}
                    </div>
                </div>
                <div class="staff-skills">
                    <div class="skill-stat"><span class="skill-val code">${emp.stats.code}</span><span class="skill-lbl">代码</span></div>
                    <div class="skill-stat"><span class="skill-val art">${emp.stats.art}</span><span class="skill-lbl">美术</span></div>
                    <div class="skill-stat"><span class="skill-val design">${emp.stats.design}</span><span class="skill-lbl">策划</span></div>
                </div>
                <div class="staff-condition">
                    <div class="condition-pill ${staffHealthTone(satisfaction)}">情绪 ${Math.round(satisfaction)}</div>
                    <div class="condition-pill ${staffHealthTone(loyalty)}">忠诚 ${Math.round(loyalty)}</div>
                    <div class="condition-pill ${staffHealthTone(fatigue, true)}">疲劳 ${fatigue}</div>
                    <div class="condition-pill ${staffHealthTone(efficiency)}">效率 ${efficiency}%</div>
                    <div class="condition-pill ${typeof contractTone === "function" ? contractTone(emp) : "good"}">${typeof contractLabel === "function" ? contractLabel(emp) : ""}</div>
                </div>
                <div class="staff-actions" data-card-action-zone>
                    <button type="button" class="btn-research staff-action-btn detail" data-employee-detail="${i}" onclick="openOfficeDeskDetail(${i}); return false;"><i class="fa-solid fa-id-card"></i> 详情</button>
                    <div class="staff-action-row compact">
                        <button type="button" class="btn-research staff-action-btn train" onclick="confirmTrain(${i})">培训</button>
                        <button type="button" class="btn-research staff-action-btn rest" onclick="confirmRest(${i})">休整</button>
                        ${specializeButtonHtml}
                        ${fireButtonHtml}
                    </div>
                </div>`;
        } else {
            card.innerHTML = `
                <div class="staff-avatar-box empty-desk-main">
                    <div class="staff-avatar empty-avatar"><i class="fa-solid fa-chair"></i></div>
                    <div class="staff-profile">
                        <span class="staff-name muted-name">空置开发卡座</span>
                        <span class="staff-level">前往人才招募中心扩大团队</span>
                    </div>
                </div>
                <div class="staff-actions empty-desk-action">
                    <button type="button" class="btn-research staff-empty-action" onclick="switchScreen('staff')">快速招募员工</button>
                </div>`;
        }
        container.appendChild(card);
    }

    const slotCap = typeof stageSlotCap === "function" ? stageSlotCap() : 8;
    if (officeSlots < slotCap) {
        const cost = getOfficeExpandCost();
        const card = document.createElement("div");
        card.className = "desk-card office-expand-card";
        card.innerHTML = `
            <div class="staff-avatar-box">
                <div class="staff-avatar expand-avatar"><i class="fa-solid fa-building-circle-arrow-right"></i></div>
                <div class="staff-profile">
                    <span class="staff-name">扩建办公室</span>
                    <span class="staff-level">当前容量 ${gameState.employees.length}/${officeSlots}，本阶段上限 ${slotCap} 人</span>
                </div>
            </div>
            <div class="desk-status-text">新增 1 个员工槽位</div>
            <div class="desk-status-text expand-cost">¥${cost.toLocaleString()}</div>
            <div class="staff-actions">
                <button type="button" class="btn-research staff-empty-action" onclick="expandOfficeSlots()">支付扩建费用</button>
            </div>`;
        container.appendChild(card);
    }
    if (typeof renderOfficeTheater === "function") renderOfficeTheater(gameState);
}

let lastOfficeDetailOpenAt = 0;

function openOfficeDeskDetail(idx) {
    const now = Date.now();
    if (now - lastOfficeDetailOpenAt < 250) return;
    lastOfficeDetailOpenAt = now;
    const emp = gameState.employees[idx];
    const modal = document.getElementById("candidate-detail-modal");
    const title = document.getElementById("candidate-detail-title");
    const body = document.getElementById("candidate-detail-body");
    const action = document.getElementById("candidate-detail-interview-btn");
    if (!emp || !modal || !title || !body || !action) return;

    if (typeof ensureEmployeeVitals === "function") ensureEmployeeVitals(emp);
    const roleMeta = typeof getCandidateRoleMeta === "function"
        ? getCandidateRoleMeta(emp.role)
        : { color: "var(--accent-neon)", name: "程序员", iconClass: "fa-laptop-code" };
    const isFounder = emp.id === "player";
    const morale = emp.morale == null ? 75 : emp.morale;
    const fatigue = emp.fatigue || 0;
    const satisfaction = emp.satisfaction == null ? morale : emp.satisfaction;
    const loyalty = emp.loyalty == null ? (isFounder ? 100 : 55) : emp.loyalty;
    const efficiency = typeof employeeEfficiency === "function" ? Math.round(employeeEfficiency(emp) * 100) : 100;
    const contract = typeof contractLabel === "function" ? contractLabel(emp) : "合同信息暂无";
    const traitText = typeof traitName === "function" ? traitName(emp) : "无";
    const archetypeText = typeof archetypeName === "function" ? archetypeName(emp) : "务实养家型";
    const memoryHtml = typeof employeeMemoryHtml === "function" ? employeeMemoryHtml(emp) : `<div class="memory-empty">还没有共同记忆。</div>`;

    title.innerHTML = `<i class="fa-solid ${roleMeta.iconClass}"></i> ${escapeHtml(emp.name)} · ${roleMeta.name}`;
    body.innerHTML = `
        <div class="candidate-detail-hero">
            <div class="staff-avatar ${emp.role}" style="color:${roleMeta.color}; border-color:${roleMeta.color};">
                <i class="fa-solid ${roleMeta.iconClass}"></i>
            </div>
            <div class="candidate-detail-summary">
                <div class="candidate-detail-name">
                    <span>${isFounder ? "创始人" : "工作室成员"} Lv.${emp.level || 1}</span>
                    <span class="rarity-badge" style="color:${roleMeta.color}; border-color:${roleMeta.color};">${isFounder ? "永久" : contract}</span>
                </div>
                <div class="candidate-detail-tags">
                    <span class="trait-badge archetype">${archetypeText}</span>
                    <span class="trait-badge">${traitText}</span>
                </div>
            </div>
        </div>
        <div class="candidate-detail-stats">
            <div class="candidate-detail-stat"><b style="color: var(--accent-neon);">${emp.stats?.code || 0}</b><span>代码</span></div>
            <div class="candidate-detail-stat"><b style="color: var(--accent-pink);">${emp.stats?.art || 0}</b><span>美术</span></div>
            <div class="candidate-detail-stat"><b style="color: var(--accent-yellow);">${emp.stats?.design || 0}</b><span>策划</span></div>
        </div>
        <div class="candidate-detail-lines">
            <div><span>心情</span><b>${Math.round(morale)}</b></div>
            <div><span>情绪</span><b>${Math.round(satisfaction)}</b></div>
            <div><span>忠诚</span><b>${Math.round(loyalty)}</b></div>
            <div><span>疲劳</span><b>${Math.round(fatigue)}</b></div>
            <div><span>效率</span><b>${efficiency}%</b></div>
            <div><span>状态</span><b>${escapeHtml(emp.statusText || "整理任务")}</b></div>
        </div>
        <div class="candidate-detail-note employee-detail-note">
            <strong>共同记忆</strong>
            <div class="employee-memory-list">${memoryHtml}</div>
        </div>
    `;
    action.textContent = "复制小传";
    action.onclick = () => {
        if (typeof copyEmployeeBio === "function") copyEmployeeBio(idx);
    };
    modal.classList.add("active");
    if (typeof playSFX === "function") playSFX("click");
}

if (typeof window !== "undefined") {
    window.openOfficeDeskDetail = openOfficeDeskDetail;
}

function handleOfficeDeskDetailEvent(event) {
    const detailButton = event.target.closest?.("[data-employee-detail]");
    if (detailButton) {
        event.preventDefault();
        event.stopPropagation();
        const idx = Number(detailButton.dataset.employeeDetail);
        openOfficeDeskDetail(idx);
        return;
    }

    const actionZone = event.target.closest?.("[data-card-action-zone]");
    if (actionZone) return;

    const card = event.target.closest?.("[data-employee-detail-card]");
    if (!card) return;
    const idx = Number(card.dataset.employeeDetailCard);
    openOfficeDeskDetail(idx);
}

document.addEventListener("pointerdown", handleOfficeDeskDetailEvent, true);
document.addEventListener("click", handleOfficeDeskDetailEvent, true);
document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    handleOfficeDeskDetailEvent(event);
}, true);
