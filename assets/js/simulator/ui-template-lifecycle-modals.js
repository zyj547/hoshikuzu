// ============================================================================
// Lifecycle modal templates: bankruptcy settlement, medal shop, sharing/save.
// ============================================================================
(function () {
    if (typeof mountSimulatorTemplate !== "function") return;
    mountSimulatorTemplate(`
    <!-- 4.5 破产结算模态框 -->
    <div class="modal-overlay" id="bankruptcy-modal">
        <div class="review-card" style="max-width: 500px; text-align: center;">
            <h3 class="review-title" style="color: var(--accent-pink);"><i class="fa-solid fa-skull-crossbones"></i> 工作室破产重组</h3>
            
            <div class="rating-box" style="margin: 1rem 0; background: rgba(217, 70, 239, 0.05); border-color: rgba(217, 70, 239, 0.2);">
                <div class="rating-num" style="font-size: 2.2rem; color: var(--accent-pink);" id="settle-title">创业终结</div>
                <div class="rating-stars" style="color: var(--text-secondary); font-size: 0.85rem;" id="settle-subtitle">
                    桔子工作室由于债务赤字宣布破产倒闭
                </div>
            </div>

            <div class="review-list" style="text-align: left; gap: 0.75rem;">
                <div class="list-item" style="border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 0.5rem;">
                    <span class="list-lbl">已发布游戏数</span>
                    <span class="list-val" id="settle-games-count" style="color: #fff;">0 款</span>
                </div>
                <div class="list-item" style="border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 0.5rem;">
                    <span class="list-lbl">历史最大粉丝群</span>
                    <span class="list-val" id="settle-max-fans" style="color: var(--accent-neon);">0 名</span>
                </div>
                <div class="list-item" style="border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 0.5rem;">
                    <span class="list-lbl">公司最终净资产</span>
                    <span class="list-val" id="settle-final-funds" style="color: var(--accent-yellow);">¥0</span>
                </div>
                <div class="list-item" style="padding-top: 0.5rem; justify-content: center; background: rgba(0,240,255,0.04); border: 1px dashed rgba(0,240,255,0.2); border-radius: 8px; padding: 0.8rem; flex-direction: column; align-items: center; gap: 0.4rem;">
                    <span class="list-lbl" style="font-weight: 700; color: var(--accent-neon);">🏆 获得多周目“桔子勋章”</span>
                    <span class="list-val" id="settle-medals-gained" style="font-size: 1.5rem; font-family: var(--font-title); color: var(--accent-yellow);">+0 枚</span>
                    <span style="font-size: 0.7rem; color: var(--text-secondary);">勋章已持久保存，可在新游戏开局前购买永久加成！</span>
                </div>
            </div>

            <button class="btn-modal-close" style="margin-top: 1rem; width: 100%; background: linear-gradient(135deg, #d946ef 0%, #7c3aed 100%); box-shadow: 0 0 15px rgba(217,70,239,0.3);" onclick="goToMedalShop()">
                进入下一世，开启多周目！
            </button>
        </div>
    </div>

    <!-- 4.6 桔子勋章特权商店模态框 -->
    <div class="modal-overlay" id="medal-shop-modal">
        <div class="review-card" style="max-width: 650px;">
            <h3 class="review-title" style="color: var(--accent-yellow);"><i class="fa-solid fa-store"></i> 桔子勋章特权商店</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(251,191,36,0.05); border: 1px solid rgba(251,191,36,0.15); border-radius: 10px; padding: 0.75rem 1rem;">
                <span style="font-size: 0.88rem; color: var(--text-secondary);"><i class="fa-solid fa-award"></i> 当前拥有勋章数：</span>
                <span id="shop-owned-medals" style="font-family: var(--font-title); font-size: 1.25rem; font-weight: 900; color: var(--accent-yellow);">0 枚</span>
            </div>
            
            <p class="panel-desc" style="text-align: center; margin-bottom: 0.5rem;">购买强力传承特权，直接加成下一局初始属性（开局购买，单局内永久生效）</p>
            
            <div class="review-list" style="gap: 0.85rem;">
                <!-- 特权一 -->
                <div class="list-item" style="flex-direction: row; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem; cursor: pointer; transition: all 0.3s;" id="perk-row-funds" onclick="togglePerkSelection('fundsBoost', 1)">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div style="font-size: 1.8rem; color: var(--accent-neon); width: 40px; text-align: center;"><i class="fa-solid fa-sack-dollar"></i></div>
                        <div style="display: flex; flex-direction: column; gap: 0.25rem; text-align: left;">
                            <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">天使轮注资 (初始资金提升)</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">开局资金提升至 ¥60,000（额外赠送 ¥25,000）</span>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem;">
                        <span style="font-family: var(--font-title); font-size: 0.85rem; color: var(--accent-yellow); font-weight: 700;">1 勋章</span>
                        <span class="btn-research" id="perk-badge-funds" style="padding: 0.2rem 0.6rem; font-size: 0.7rem; border-color: rgba(255,255,255,0.2); color: var(--text-secondary); pointer-events: none;">未选中</span>
                    </div>
                </div>

                <!-- 特权二 -->
                <div class="list-item" style="flex-direction: row; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem; cursor: pointer; transition: all 0.3s;" id="perk-row-rogue" onclick="togglePerkSelection('roguelikeUnlocked', 2)">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div style="font-size: 1.8rem; color: var(--accent-pink); width: 40px; text-align: center;"><i class="fa-solid fa-skull"></i></div>
                        <div style="display: flex; flex-direction: column; gap: 0.25rem; text-align: left;">
                            <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">技术传承 (初始解锁 Roguelike)</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">无需研究，开局自动解锁高收益游戏类型：“动作地牢”</span>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem;">
                        <span style="font-family: var(--font-title); font-size: 0.85rem; color: var(--accent-yellow); font-weight: 700;">2 勋章</span>
                        <span class="btn-research" id="perk-badge-rogue" style="padding: 0.2rem 0.6rem; font-size: 0.7rem; border-color: rgba(255,255,255,0.2); color: var(--text-secondary); pointer-events: none;">未选中</span>
                    </div>
                </div>

                <!-- 特权三 -->
                <div class="list-item" style="flex-direction: row; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1rem; cursor: pointer; transition: all 0.3s;" id="perk-row-fans" onclick="togglePerkSelection('fansGrowthBoost', 3)">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div style="font-size: 1.8rem; color: var(--accent-yellow); width: 40px; text-align: center;"><i class="fa-solid fa-tower-broadcast"></i></div>
                        <div style="display: flex; flex-direction: column; gap: 0.25rem; text-align: left;">
                            <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">大厂光环 (粉丝自然回流)</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">名气效应加成，游戏公司每天自然吸引 +5 名粉丝</span>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem;">
                        <span style="font-family: var(--font-title); font-size: 0.85rem; color: var(--accent-yellow); font-weight: 700;">3 勋章</span>
                        <span class="btn-research" id="perk-badge-fans" style="padding: 0.2rem 0.6rem; font-size: 0.7rem; border-color: rgba(255,255,255,0.2); color: var(--text-secondary); pointer-events: none;">未选中</span>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.8rem; padding: 0 0.5rem;">
                <span style="color: var(--text-secondary);">结算总扣除勋章：<span id="shop-total-cost" style="color: var(--accent-pink); font-family: var(--font-title); font-weight: 700;">0</span> 枚</span>
                <span style="color: var(--text-secondary);">剩余：<span id="shop-remaining-medals" style="color: var(--accent-neon); font-family: var(--font-title); font-weight: 700;">0</span> 枚</span>
            </div>

            <button class="btn-modal-close" style="margin-top: 1rem; width: 100%; background: linear-gradient(135deg, #00f0ff 0%, #7c3aed 100%);" onclick="applyMedalShopPerksAndStart()">
                签署协议，正式重组启程！
            </button>
        </div>
    </div>
    <!-- 8. 数据分享与存档弹窗 (Custom Share & Save Overlay) -->
    <div id="share-modal" class="modal-overlay">
        <div class="event-card glass-card" style="max-width: 520px; border-color: rgba(0, 240, 255, 0.3); box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 25px rgba(0,240,255,0.15);">
            <h3 class="event-title" style="color: var(--accent-neon);"><i class="fa-solid fa-share-nodes"></i> 数据分享与存档</h3>
            
            <!-- Tab 切换 -->
            <div class="research-tabs" style="margin-bottom: 0.5rem; display: flex; flex-wrap: nowrap; overflow-x: auto;">
                <button class="tab-link active" id="tab-share-achievement" style="flex-shrink: 0;" onclick="switchShareTab('achievement')">🏆 成就分享</button>
                <button class="tab-link" id="tab-share-save" style="flex-shrink: 0;" onclick="switchShareTab('save')">💾 存档传输</button>
            </div>
            
            <!-- 成就分享面板 -->
            <div id="share-panel-achievement" class="share-tab-content">
                <p class="event-desc" style="font-size: 0.88rem; margin-bottom: 0.8rem;">您可以复制下方的专属【工作室成就卡片】，分享给您的好友：</p>
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem; font-size: 0.9rem; line-height: 1.6; color: var(--text-primary); text-align: left; min-height: 100px; white-space: pre-wrap; margin-bottom: 1.25rem;" id="share-achievement-text">
                    正在读取当前进度...
                </div>
                <button class="btn-modal-close" style="width: 100%;" onclick="copyAchievementCard()">
                    一键复制成就卡片
                </button>
            </div>
            
            <!-- 存档传输面板 -->
            <div id="share-panel-save" class="share-tab-content" style="display: none;">
                <p class="event-desc" style="font-size: 0.85rem; margin-bottom: 0.8rem; line-height: 1.4;">
                    <strong>导出</strong>：生成您当前的 Base64 编码存档码以实现数据跨设备传输；<br>
                    <strong>导入</strong>：粘贴存档码即可覆盖本地数据并自动载入新进度。
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.25rem;">
                    <!-- 导出 -->
                    <div>
                        <span style="font-size: 0.8rem; color: var(--accent-neon); font-weight: 700; display: block; margin-bottom: 0.4rem;">【导出】当前设备存档码：</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <textarea id="share-export-code" readonly style="flex: 1; height: 50px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-secondary); font-family: monospace; font-size: 0.75rem; padding: 0.4rem; resize: none; outline: none; word-break: break-all;"></textarea>
                            <button class="btn-research" style="height: 50px; padding: 0 1rem; font-size: 0.85rem;" onclick="copyExportSaveCode()">复制</button>
                        </div>
                    </div>
                    
                    <!-- 导入 -->
                    <div>
                        <span style="font-size: 0.8rem; color: var(--accent-pink); font-weight: 700; display: block; margin-bottom: 0.4rem;">【导入】输入外部存档码：</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <textarea id="share-import-code" placeholder="请在此处粘贴导出的存档码..." style="flex: 1; height: 50px; background: rgba(0,0,0,0.4); border: 1px solid rgba(217,70,239,0.25); border-radius: 8px; color: #fff; font-family: monospace; font-size: 0.75rem; padding: 0.4rem; resize: none; outline: none; word-break: break-all;"></textarea>
                            <button class="btn-research" style="height: 50px; padding: 0 1rem; font-size: 0.85rem; border-color: var(--accent-pink); color: var(--accent-pink);" onclick="importSaveCode()">导入</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <button class="btn-modal-close" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--text-secondary); margin-top: 0.5rem;" onclick="closeShareModal()">
                关闭窗口
            </button>
        </div>
    </div>
    `);
})();
