// ==========================================================================
// 主流程弹窗模板：评测、事件、面试、发行、研发卡结果
// ==========================================================================
(function () {
    if (typeof mountSimulatorTemplate !== "function") return;
    mountSimulatorTemplate(`
    <div class="modal-overlay" id="review-modal">
        <div class="review-card">
            <h3 class="review-title" id="modal-title">新游评测简报</h3>
            <div class="rating-box">
                <span class="rating-num" id="modal-rating">9.5</span>
                <div class="rating-stars" id="modal-stars"></div>
            </div>
            <div class="chart-container" id="modal-chart-box"></div>
            <div class="score-breakdown" id="modal-score-breakdown"></div>
            <div class="review-list" id="modal-reviews"></div>
            <button class="btn-modal-close" onclick="closeReviewModal()">宣布推向市场并开启推广！</button>
        </div>
    </div>

    <div class="modal-overlay" id="event-modal">
        <div class="event-card">
            <h3 class="event-title" id="event-modal-title"><i class="fa-solid fa-circle-exclamation"></i>突发紧急事件</h3>
            <p class="event-desc" id="event-modal-desc">事件描述</p>
            <div class="event-choices" id="event-modal-choices"></div>
        </div>
    </div>

    <div class="modal-overlay" id="interview-modal">
        <div class="event-card">
            <h3 class="event-title" id="interview-title"><i class="fa-solid fa-user-tie"></i> 面试</h3>
            <p class="event-desc" id="interview-desc">候选人台词</p>
            <div class="event-choices" id="interview-choices"></div>
        </div>
    </div>

    <div class="modal-overlay" id="candidate-detail-modal">
        <div class="event-card candidate-detail-card">
            <h3 class="event-title" id="candidate-detail-title"><i class="fa-solid fa-id-card"></i> 候选人详情</h3>
            <div class="event-desc candidate-detail-body" id="candidate-detail-body"></div>
            <div class="event-choices candidate-detail-actions">
                <button class="choice-btn" id="candidate-detail-interview-btn">邀约面试</button>
                <button class="choice-btn choice-muted" onclick="closeCandidateDetail()">关闭</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay reveal-overlay" id="reveal-overlay">
        <div class="reveal-card">
            <div class="reveal-eyebrow">EVALUATION · 评测揭晓</div>
            <div id="reveal-cover" class="reveal-cover"></div>
            <div class="reveal-title" id="reveal-title">《作品》</div>
            <div class="reveal-factors" id="reveal-factors"></div>
            <div class="reveal-final" id="reveal-final">
                <div class="reveal-final-label">综合评分</div>
                <div class="reveal-score" id="reveal-score">0.0</div>
                <div class="reveal-bar"><div class="reveal-bar-fill" id="reveal-bar-fill"></div></div>
                <div class="reveal-verdict" id="reveal-verdict"></div>
            </div>
            <div class="reveal-burst" id="reveal-burst"></div>
            <button class="reveal-continue" id="reveal-continue">查看完整评测 →</button>
        </div>
    </div>

    <div class="modal-overlay" id="publisher-modal">
        <div class="review-card" style="max-width: 750px;">
            <h3 class="review-title" style="color: var(--accent-neon);"><i class="fa-solid fa-paper-plane"></i> 选择游戏发行渠道</h3>
            <p class="panel-desc" style="text-align: center; margin-bottom: 1rem;">选择适合您当前游戏规模和财务状况的发行方式，直接影响后续的爆款概率和分成！</p>
            <div class="publisher-options" id="pub-options-list">
                <div class="publisher-card selected" id="pub-card-self" onclick="selectPublisherOption('self')">
                    <div class="pub-icon"><i class="fa-solid fa-user-shield"></i></div>
                    <div class="pub-name">自主独立发行</div>
                    <div class="pub-meta">
                        <div><span class="pub-lbl">预付款</span><span class="pub-val accent">¥0</span></div>
                        <div><span class="pub-lbl">平台分成</span><span class="pub-val">0% (保留100%)</span></div>
                        <div><span class="pub-lbl">粉丝曝光</span><span class="pub-val accent-blue">1.0x (无加成)</span></div>
                    </div>
                    <p class="pub-desc">独立在各大应用商城上架，无需任何额外费用，但缺乏流量扶持。</p>
                </div>
                <div class="publisher-card" id="pub-card-tiktok" onclick="selectPublisherOption('tiktok')">
                    <div class="pub-icon" style="color: var(--accent-pink);"><i class="fa-brands fa-tiktok"></i></div>
                    <div class="pub-name">抖音精选独占</div>
                    <div class="pub-meta">
                        <div><span class="pub-lbl">预付款</span><span class="pub-val accent" style="color: var(--accent-emerald);">+¥5,000</span></div>
                        <div><span class="pub-lbl">平台分成</span><span class="pub-val">50% (抽取一半)</span></div>
                        <div><span class="pub-lbl">粉丝曝光</span><span class="pub-val accent-blue">1.5x 流量推荐</span></div>
                    </div>
                    <p class="pub-desc">与抖音精选深度联运，瞬间获取大量推荐并获得补贴金，但分成折半。</p>
                </div>
                <div class="publisher-card" id="pub-card-steam" onclick="selectPublisherOption('steam')">
                    <div class="pub-icon" style="color: var(--accent-yellow);"><i class="fa-brands fa-steam"></i></div>
                    <div class="pub-name">Steam 大厂联运</div>
                    <div class="pub-meta">
                        <div><span class="pub-lbl">预付款</span><span class="pub-val accent" style="color: var(--accent-pink);">-¥5,000</span></div>
                        <div><span class="pub-lbl">平台分成</span><span class="pub-val">30% (抽取三成)</span></div>
                        <div><span class="pub-lbl">粉丝曝光</span><span class="pub-val accent-blue">2.5x 爆发引流</span></div>
                    </div>
                    <p class="pub-desc">通过国际发行商上架，需垫付 ¥5,000 申请费，但可带来全球爆发性推广。</p>
                </div>
            </div>
            <button class="btn-modal-close" style="margin-top: 1.5rem; width: 100%;" onclick="confirmPublisherSelection()">签署协议并正式推向市场！</button>
        </div>
    </div>

    <div id="card-result-modal" class="modal-overlay">
        <div class="event-card">
            <h3 class="event-title" id="card-result-title"><i class="fa-solid fa-book-open"></i> 开发手记</h3>
            <p class="event-desc" id="card-result-desc">事件描述</p>
            <div class="event-choices" id="card-result-choices"></div>
        </div>
    </div>
    `);
})();
