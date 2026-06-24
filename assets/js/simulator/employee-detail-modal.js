// ==========================================================================
// Employee detail modal: direct modal entry, independent from alert queue.
// ==========================================================================
(function (root) {
    function safeText(value) {
        return typeof escapeHtml === "function" ? escapeHtml(value) : String(value == null ? "" : value);
    }

    function ensureEmployeeDetailModal() {
        let modal = document.getElementById("employee-detail-modal");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = "employee-detail-modal";
        modal.className = "modal-overlay employee-detail-overlay";
        modal.innerHTML = `
            <div class="event-card glass-card employee-detail-card">
                <button type="button" class="employee-detail-close" onclick="closeEmployeeDetailModal()" aria-label="关闭员工详情">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div id="employee-detail-content"></div>
            </div>`;
        const rootEl = document.getElementById("modal-root") || document.body;
        rootEl.appendChild(modal);
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeEmployeeDetailModal();
        });
        return modal;
    }

    function closeEmployeeDetailModal() {
        document.getElementById("employee-detail-modal")?.classList.remove("active");
    }

    function openEmployeeMemory(idx) {
        const emp = root.gameState && root.gameState.employees ? root.gameState.employees[idx] : null;
        if (!emp) return;
        if (typeof ensureEmployeeVitals === "function") ensureEmployeeVitals(emp);

        const contract = typeof contractLabel === "function" ? contractLabel(emp) : "合同信息暂无";
        const isFounder = emp.id === "player";
        const morale = emp.morale == null ? 75 : emp.morale;
        const fatigue = emp.fatigue || 0;
        const satisfaction = emp.satisfaction == null ? morale : emp.satisfaction;
        const loyalty = emp.loyalty == null ? (isFounder ? 100 : 55) : emp.loyalty;
        const efficiency = typeof employeeEfficiency === "function" ? Math.round(employeeEfficiency(emp) * 100) : 100;
        const role = typeof roleName === "function" ? roleName(emp.role) : "员工";
        const trait = typeof traitName === "function" ? traitName(emp) : "无";
        const archetype = typeof archetypeName === "function" ? archetypeName(emp) : "务实养家型";
        const memoryHtml = typeof employeeMemoryHtml === "function"
            ? employeeMemoryHtml(emp)
            : `<div class="memory-empty">还没有共同记忆。</div>`;

        const modal = ensureEmployeeDetailModal();
        const content = document.getElementById("employee-detail-content");
        content.innerHTML = `
            <div class="employee-profile-modal">
                <div class="employee-profile-hero">
                    <div>
                        <b>${safeText(emp.name)}</b>
                        <span>${role} · Lv.${emp.level || 1} · ${isFounder ? "创始人" : safeText(contract)}</span>
                    </div>
                    <button type="button" class="btn-research staff-action-btn memory" onclick="copyEmployeeBio(${idx})">复制小传</button>
                </div>
                <div class="employee-memory-head">
                    <span>心情 ${Math.round(morale)}</span>
                    <span>情绪 ${Math.round(satisfaction)}</span>
                    <span>忠诚 ${Math.round(loyalty)}</span>
                    <span>疲劳 ${Math.round(fatigue)}</span>
                    <span>效率 ${efficiency}%</span>
                </div>
                <div class="employee-profile-grid">
                    <div><span>代码</span><b>${emp.stats?.code || 0}</b></div>
                    <div><span>美术</span><b>${emp.stats?.art || 0}</b></div>
                    <div><span>策划</span><b>${emp.stats?.design || 0}</b></div>
                    <div><span>特质</span><b>${trait}</b></div>
                    <div><span>性格</span><b>${archetype}</b></div>
                    <div><span>状态</span><b>${safeText(emp.statusText || "整理任务")}</b></div>
                </div>
                <div class="employee-detail-section-title">共同记忆</div>
                <div class="employee-memory-list">${memoryHtml}</div>
            </div>`;
        modal.classList.add("active");
        if (typeof playSFX === "function") playSFX("click");
    }

    root.openEmployeeMemory = openEmployeeMemory;
    root.closeEmployeeDetailModal = closeEmployeeDetailModal;
})(typeof globalThis !== "undefined" ? globalThis : window);
