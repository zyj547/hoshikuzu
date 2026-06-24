// ==========================================================================
// System modal templates: alert/confirm, specialty, founder, company stage-up.
// ==========================================================================
(function () {
    if (typeof mountSimulatorTemplate !== "function") return;
    mountSimulatorTemplate(`
    <div id="custom-alert-modal" class="custom-alert-overlay" role="alertdialog" aria-modal="true" aria-labelledby="custom-alert-title" aria-describedby="custom-alert-message">
        <div class="custom-alert-card glass-card">
            <div class="custom-alert-header">
                <i class="fa-solid fa-bell custom-alert-icon info"></i>
                <span id="custom-alert-title">系统提示</span>
            </div>
            <div class="custom-alert-body" id="custom-alert-message">提示内容</div>
            <div class="custom-alert-footer">
                <button class="custom-alert-btn" id="custom-alert-confirm-btn">确定</button>
            </div>
        </div>
    </div>

    <div id="custom-confirm-modal" class="custom-alert-overlay" role="alertdialog" aria-modal="true" aria-labelledby="custom-confirm-title" aria-describedby="custom-confirm-message">
        <div class="custom-alert-card glass-card">
            <div class="custom-alert-header">
                <i class="fa-solid fa-circle-question custom-alert-icon info"></i>
                <span id="custom-confirm-title">系统确认</span>
            </div>
            <div class="custom-alert-body" id="custom-confirm-message">确认内容</div>
            <div class="custom-alert-footer" style="gap: 1rem;">
                <button class="custom-alert-btn" id="custom-confirm-cancel-btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: var(--text-secondary); box-shadow: none;">取消</button>
                <button class="custom-alert-btn" id="custom-confirm-ok-btn">确定</button>
            </div>
        </div>
    </div>

    <div id="specialty-modal" class="modal-overlay">
        <div class="event-card glass-card" style="max-width: 480px; border-color: var(--accent-neon); box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 25px rgba(0, 240, 255, 0.15);">
            <h3 class="event-title" style="color: var(--accent-neon);"><i class="fa-solid fa-graduation-cap"></i> 职业专精选项</h3>
            <p class="event-desc" id="specialty-modal-desc">为员工选择未来的晋升专精方向：</p>
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem;" id="specialty-choices-container"></div>
            <button class="btn-modal-close" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--text-secondary);" onclick="closeSpecialtyModal()">稍后再说</button>
        </div>
    </div>

    <div id="founder-modal" class="modal-overlay">
        <div class="review-card" style="max-width: 760px;">
            <h3 class="review-title" style="color: var(--accent-neon);"><i class="fa-solid fa-id-badge"></i> 选择你的创始人背景</h3>
            <p class="panel-desc" style="text-align:center; margin-bottom:1rem;">你的出身将决定整局玩法风格，选择后本周目不可更改。</p>
            <div class="founder-grid" id="founder-choices"></div>
        </div>
    </div>

    <div id="stageup-modal" class="modal-overlay">
        <div class="event-card glass-card" style="max-width: 480px; border-color: var(--accent-yellow); box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 25px rgba(251,191,36,0.18);">
            <h3 class="event-title" id="stageup-modal-title" style="color: var(--accent-yellow);"><i class="fa-solid fa-arrow-trend-up"></i> 申请晋级</h3>
            <div id="stageup-modal-body"></div>
            <div style="display:flex; gap:0.8rem; margin-top:1rem;">
                <button class="btn-modal-close" style="flex:1; background:transparent; border:1px solid rgba(255,255,255,0.15); color:var(--text-secondary);" onclick="closeStageUpModal()">关闭</button>
                <button class="btn-modal-close" id="stageup-confirm-btn" style="flex:1;" onclick="confirmStageUp()">确认晋级</button>
            </div>
        </div>
    </div>

    <div id="stageup-fx"></div>
    `);
})();
