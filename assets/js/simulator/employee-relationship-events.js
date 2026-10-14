// ==========================================================================
// Employee relationship events: pair story beats for trust, rivalry and repair.
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

    function call(name, ...args) {
        const fn = root[name];
        if (typeof fn === "function") return fn(...args);
        return undefined;
    }

    function ensure(emp) {
        if (root.ensureEmployeeVitals) root.ensureEmployeeVitals(emp);
        if (root.ensureEmployeePsychology) root.ensureEmployeePsychology(emp);
        if (!emp.relations || typeof emp.relations !== "object" || Array.isArray(emp.relations)) emp.relations = {};
        if (!emp.storyFlags || typeof emp.storyFlags !== "object" || Array.isArray(emp.storyFlags)) emp.storyFlags = {};
        return emp;
    }

    function relationKey(emp, index) {
        return emp.id || emp.name || `emp_${index}`;
    }

    function playableEmployees(gameState) {
        if (!gameState || !Array.isArray(gameState.employees)) return [];
        return gameState.employees.filter(emp => emp && emp.id !== "player");
    }

    function pairKeys(gameState, a, b) {
        const members = playableEmployees(gameState);
        return {
            aToB: relationKey(b, members.indexOf(b)),
            bToA: relationKey(a, members.indexOf(a))
        };
    }

    function relationFor(gameState, a, b) {
        if (root.ensureEmployeeRelationships) root.ensureEmployeeRelationships(gameState);
        const keys = pairKeys(gameState, a, b);
        return {
            keys,
            aRel: ensure(a).relations[keys.aToB],
            bRel: ensure(b).relations[keys.bToA]
        };
    }

    function eventFlag(type, a, b) {
        const names = [a.name || "a", b.name || "b"].sort().join("_");
        return `rel_event_${type}_${names}`;
    }

    function hasPairEvent(type, a, b) {
        const flag = eventFlag(type, a, b);
        return Boolean(ensure(a).storyFlags[flag] || ensure(b).storyFlags[flag]);
    }

    function markPairEvent(type, a, b) {
        const flag = eventFlag(type, a, b);
        ensure(a).storyFlags[flag] = true;
        ensure(b).storyFlags[flag] = true;
    }

    function pairEventMarked(type, a, b) {
        return hasPairEvent(type, a, b);
    }

    function markFollowUpSeed(pair, choiceIndex) {
        const key = {
            friction_repair: choiceIndex === 2 ? "repair_avoid" : choiceIndex === 0 ? "repair_good" : "repair_boundary",
            mentor_pact: choiceIndex === 0 ? "mentor_formal" : choiceIndex === 1 ? "mentor_soft" : "mentor_split",
            duo_spark: choiceIndex === 0 ? "duo_proto" : choiceIndex === 1 ? "duo_method_seed" : "duo_parked"
        }[pair.type];
        if (key) markPairEvent(`followup_seed_${key}`, pair.a, pair.b);
    }

    function adjustRelation(gameState, a, b, delta) {
        const rels = relationFor(gameState, a, b);
        [rels.aRel, rels.bRel].filter(Boolean).forEach(rel => {
            rel.affinity = clamp((rel.affinity == null ? 50 : rel.affinity) + (delta.affinity || 0));
            rel.respect = clamp((rel.respect == null ? 50 : rel.respect) + (delta.respect || 0));
            rel.tension = clamp((rel.tension == null ? 20 : rel.tension) + (delta.tension || 0));
            rel.momentum = clamp((rel.affinity + rel.respect - rel.tension) / 2, -50, 100);
        });
    }

    function rememberPair(a, b, text, gameState) {
        if (root.addEmployeeMemory) {
            root.addEmployeeMemory(a, text.replace(/\{other\}/g, b.name || "同事"), gameState);
            root.addEmployeeMemory(b, text.replace(/\{other\}/g, a.name || "同事"), gameState);
        }
    }

    function finish(gameState) {
        call("saveGame");
        call("updateStatsUI");
        call("loadOfficeDesks");
        if (typeof root.renderOfficeTheater === "function") root.renderOfficeTheater(gameState);
    }

    const RELATIONSHIP_EVENT_DEFS = {
        friction_repair: {
            type: "friction_repair",
            icon: "fa-solid fa-handshake-angle",
            title: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 的边界复盘`,
            scene: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 在白板前停了很久。争论本身并不激烈，真正危险的是两个人都开始用“算了”结束对话。你能感觉到，如果这次不处理，摩擦会变成长期默认值。`,
            focus: "这不是判断谁对谁错，而是把模糊的不满翻译成协作边界。",
            choices: [
                {
                    text: "主持一次不追责复盘",
                    relation: { affinity: 7, respect: 8, tension: -18 },
                    a: { satisfaction: 5, loyalty: 2, fatigue: -5 },
                    b: { satisfaction: 5, loyalty: 2, fatigue: -5 },
                    memory: "你主持了一次不追责复盘，TA 和 {other} 终于把真正卡住的边界说出口。",
                    chronicle: (a, b) => `🧩 ${a.name} 和 ${b.name} 通过一次复盘把摩擦拆成了可处理的边界。`
                },
                {
                    text: "重新划分职责，先减少交叉",
                    relation: { affinity: 2, respect: 4, tension: -12 },
                    a: { satisfaction: 3, fatigue: -7 },
                    b: { satisfaction: 3, fatigue: -7 },
                    memory: "你暂时减少了 TA 和 {other} 的职责交叉，关系没有立刻升温，但火药味淡了。",
                    chronicle: (a, b) => `🧭 ${a.name} 和 ${b.name} 被重新划清职责边界，协作压力下降。`
                },
                {
                    text: "先不介入，让他们自己消化",
                    relation: { affinity: -5, respect: -4, tension: 10 },
                    a: { satisfaction: -5, fatigue: 4 },
                    b: { satisfaction: -5, fatigue: 4 },
                    memory: "你选择暂时不介入，TA 和 {other} 表面照常配合，但话明显变少了。",
                    chronicle: (a, b) => `⚡ ${a.name} 和 ${b.name} 的摩擦被暂时压了下去，但没有真正解决。`
                }
            ]
        },
        mentor_pact: {
            type: "mentor_pact",
            icon: "fa-solid fa-seedling",
            title: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 的带教约定`,
            scene: (a, b) => `${safe(a.name)} 最近总会把问题带给 ${safe(b.name)}，而 ${safe(b.name)} 虽然嘴上嫌麻烦，却会把坑点讲得很细。这个关系如果被好好承认，可能会成为团队第一条真正的传承线。`,
            focus: "把自然发生的帮助变成轻量带教，不要让其中一方被过度消耗。",
            choices: [
                {
                    text: "正式设为每周一次带教",
                    relation: { affinity: 8, respect: 10, tension: -6 },
                    a: { satisfaction: 7, loyalty: 4, xp: 14 },
                    b: { satisfaction: 4, loyalty: 3, fatigue: 3, xp: 8 },
                    memory: "你把 TA 和 {other} 的互助正式设成每周带教，很多经验第一次被认真传下去。",
                    chronicle: (a, b) => `🌱 ${a.name} 和 ${b.name} 建立了固定带教节奏。`
                },
                {
                    text: "让他们继续自然合作",
                    relation: { affinity: 5, respect: 5, tension: -4 },
                    a: { satisfaction: 4, xp: 8 },
                    b: { satisfaction: 2, xp: 4 },
                    memory: "你没有把关系制度化，只是给 TA 和 {other} 留出自然合作的空间。",
                    chronicle: (a, b) => `🤝 ${a.name} 和 ${b.name} 的自然互助继续升温。`
                },
                {
                    text: "担心依赖，先拆开他们",
                    relation: { affinity: -5, respect: -2, tension: 8 },
                    a: { satisfaction: -4, fatigue: 3 },
                    b: { satisfaction: -3 },
                    memory: "你担心 TA 过度依赖 {other}，于是拆开了两人的协作节奏。",
                    chronicle: (a, b) => `🪢 ${a.name} 和 ${b.name} 的带教苗头被暂时打断。`
                }
            ]
        },
        duo_spark: {
            type: "duo_spark",
            icon: "fa-solid fa-wand-magic-sparkles",
            title: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 的双人火花`,
            scene: (a, b) => `${safe(a.name)} 刚开口，${safe(b.name)} 已经把后半句写在白板上。两个人的默契开始变得明显，甚至有点危险：如果给他们一小块空间，可能会冒出团队平时想不到的东西。`,
            focus: "给默契组合一次小范围试作机会，同时留下可复用的方法。",
            choices: [
                {
                    text: "给他们一周做联合原型",
                    relation: { affinity: 10, respect: 8, tension: -5 },
                    a: { satisfaction: 8, loyalty: 3, xp: 10 },
                    b: { satisfaction: 8, loyalty: 3, xp: 10 },
                    rp: 4,
                    memory: "你给 TA 和 {other} 一周做联合原型，两个人像突然找到了同频频道。",
                    chronicle: (a, b) => `✨ ${a.name} 和 ${b.name} 做出了一版让团队眼前一亮的小原型。`
                },
                {
                    text: "让他们总结一套协作方法",
                    relation: { affinity: 6, respect: 9, tension: -4 },
                    a: { satisfaction: 5, xp: 8 },
                    b: { satisfaction: 5, xp: 8 },
                    rp: 2,
                    memory: "你让 TA 和 {other} 把默契整理成方法，团队以后也能复用。",
                    chronicle: (a, b) => `📒 ${a.name} 和 ${b.name} 总结出一套可复用的协作方法。`
                },
                {
                    text: "先把他们拉回常规任务",
                    relation: { affinity: -3, respect: 0, tension: 4 },
                    a: { satisfaction: -4 },
                    b: { satisfaction: -4 },
                    memory: "你把 TA 和 {other} 拉回常规任务，那股火花没有消失，只是暂时暗了下去。",
                    chronicle: (a, b) => `🧊 ${a.name} 和 ${b.name} 的双人火花被暂时按回排期。`
                }
            ]
        }
    };

    const RELATIONSHIP_FOLLOWUP_DEFS = {
        followup_repair_good: {
            seed: "followup_seed_repair_good",
            can: pair => (pair.relation.tension || 0) <= 62,
            icon: "fa-solid fa-bridge",
            title: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 的复盘回声`,
            scene: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 这周没有再绕开彼此。上次复盘留下的那张边界清单被贴在白板角落，偶尔有人路过会补上一行。那不是奇迹，但它真的让团队少了一点猜测。`,
            focus: "把一次好的复盘沉淀成团队习惯，而不是只解决当下的争执。",
            choices: [
                {
                    text: "把边界清单固化为协作模板",
                    relation: { affinity: 4, respect: 8, tension: -6 },
                    a: { satisfaction: 4, xp: 8 },
                    b: { satisfaction: 4, xp: 8 },
                    rp: 2,
                    memory: "上次复盘没有停在嘴上，你把 TA 和 {other} 的边界清单沉淀成了团队模板。",
                    chronicle: (a, b) => `📌 ${a.name} 和 ${b.name} 的复盘经验被整理成团队协作模板。`
                },
                {
                    text: "只保留给他们两人使用",
                    relation: { affinity: 5, respect: 4, tension: -4 },
                    a: { satisfaction: 3 },
                    b: { satisfaction: 3 },
                    memory: "你让 TA 和 {other} 保留自己的协作约定，关系开始稳定下来。",
                    chronicle: (a, b) => `🤝 ${a.name} 和 ${b.name} 保留了一套只属于他们的协作约定。`
                }
            ]
        },
        followup_repair_avoid: {
            seed: "followup_seed_repair_avoid",
            can: pair => (pair.relation.tension || 0) >= 62,
            icon: "fa-solid fa-triangle-exclamation",
            title: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 的冷场升级`,
            scene: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 终于没有吵起来，但这反而更糟。两个人开始用最短的话交接任务，像是在把协作降级成机械接口。上次被搁置的问题回来了，而且更沉。`,
            focus: "继续回避会让摩擦变成团队成本，现在必须选一种处理方式。",
            choices: [
                {
                    text: "安排一次强制调停",
                    relation: { affinity: 3, respect: 6, tension: -15 },
                    a: { satisfaction: 2, fatigue: -4 },
                    b: { satisfaction: 2, fatigue: -4 },
                    memory: "你安排了一次强制调停，TA 和 {other} 不算愉快，但终于重新开始说具体问题。",
                    chronicle: (a, b) => `🛠️ ${a.name} 和 ${b.name} 的冷场被强制拉回到问题本身。`
                },
                {
                    text: "彻底拆分他们的协作线",
                    relation: { affinity: -4, respect: 1, tension: -8 },
                    a: { satisfaction: 1, fatigue: -6 },
                    b: { satisfaction: 1, fatigue: -6 },
                    memory: "你彻底拆分了 TA 和 {other} 的协作线，效率恢复了一些，但关系也停在原地。",
                    chronicle: (a, b) => `🧱 ${a.name} 和 ${b.name} 被拆到不同协作线上，摩擦暂时降温。`
                }
            ]
        },
        followup_mentor_formal: {
            seed: "followup_seed_mentor_formal",
            can: pair => (pair.relation.respect || 0) >= 66,
            icon: "fa-solid fa-user-graduate",
            title: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 的第一次传承`,
            scene: (a, b) => `${safe(a.name)} 开始用 ${safe(b.name)} 的口吻提醒别人避坑，甚至连停顿都学得很像。带教已经不只是答疑，而是在团队里长出第二个能托底的人。`,
            focus: "把个人经验变成可传承能力，让新人获得长期成长标签。",
            choices: [
                {
                    text: "让新人主持一次内部分享",
                    relation: { affinity: 5, respect: 9, tension: -4 },
                    a: { satisfaction: 6, loyalty: 4, xp: 18 },
                    b: { satisfaction: 5, loyalty: 3, xp: 8 },
                    rp: 3,
                    tag: "开始能带人",
                    memory: "你让 TA 基于 {other} 的带教做了一次内部分享，TA 第一次像真正的骨干那样站在白板前。",
                    chronicle: (a, b) => `🎓 ${a.name} 从 ${b.name} 的带教里长出了自己的判断。`
                }
            ]
        },
        followup_duo_proto: {
            seed: "followup_seed_duo_proto",
            can: pair => (pair.relation.affinity || 0) >= 76,
            icon: "fa-solid fa-flask",
            title: (a, b) => `${safe(a.name)} 和 ${safe(b.name)} 的原型余温`,
            scene: (a, b) => `联合原型已经结束，但 ${safe(a.name)} 和 ${safe(b.name)} 还在偷偷讨论那套玩法能不能变成未来项目的底层方法。它不一定马上赚钱，却让团队看到了一种新的工作方式。`,
            focus: "决定这次火花只是一次灵感，还是成为团队长期资产。",
            choices: [
                {
                    text: "沉淀为团队方法论",
                    relation: { affinity: 6, respect: 8, tension: -4 },
                    a: { satisfaction: 5, loyalty: 3, xp: 10 },
                    b: { satisfaction: 5, loyalty: 3, xp: 10 },
                    rp: 5,
                    tag: "组合方法论",
                    memory: "你把 TA 和 {other} 的联合原型沉淀成团队方法论，这次火花没有白白散掉。",
                    chronicle: (a, b) => `🧪 ${a.name} 和 ${b.name} 的联合原型被沉淀成团队方法论。`
                }
            ]
        }
    };

    function eventTypeFor(pair) {
        const rel = pair.relation || {};
        if ((rel.tension || 0) >= 68) return "friction_repair";
        if ((rel.role || "").includes("师") || (rel.role || "").includes("甯")) {
            if ((rel.respect || 0) >= 60) return "mentor_pact";
        }
        if ((rel.affinity || 0) >= 74 && (rel.respect || 0) >= 62) return "duo_spark";
        return null;
    }

    function employeeRelationshipEventCandidates(gameState) {
        const highlights = typeof root.teamRelationshipHighlights === "function"
            ? root.teamRelationshipHighlights(gameState)
            : [];
        const followUps = highlights
            .flatMap(pair => Object.keys(RELATIONSHIP_FOLLOWUP_DEFS).map(type => {
                const def = RELATIONSHIP_FOLLOWUP_DEFS[type];
                if (!pairEventMarked(def.seed, pair.a, pair.b) || pairEventMarked(type, pair.a, pair.b)) return null;
                if (typeof def.can === "function" && !def.can(pair)) return null;
                const rel = pair.relation || {};
                return {
                    ...pair,
                    type,
                    followUp: true,
                    score: Math.round(96 + Math.max(rel.affinity || 0, rel.respect || 0, rel.tension || 0) * 0.1)
                };
            }))
            .filter(Boolean);
        const starters = highlights
            .map(pair => {
                const type = eventTypeFor(pair);
                if (!type || hasPairEvent(type, pair.a, pair.b)) return null;
                const rel = pair.relation || {};
                const score = type === "friction_repair"
                    ? (rel.tension || 0) + Math.max(0, 60 - (rel.affinity || 50))
                    : (rel.affinity || 0) + (rel.respect || 0) * 0.6 - (rel.tension || 0) * 0.4;
                return { ...pair, type, score: Math.round(score) };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);
        if (followUps.length) return followUps.sort((a, b) => b.score - a.score);
        return starters;
    }

    function addGrowthTag(emp, tag) {
        if (!tag) return;
        ensure(emp);
        const psychology = emp.psychology || {};
        const tags = Array.isArray(psychology.growthTags) ? psychology.growthTags : [];
        if (!tags.includes(tag)) tags.push(tag);
        psychology.growthTags = tags.slice(-8);
        emp.psychology = psychology;
    }

    function applyEmployeeRelationshipEventChoice(gameState, pair, choice, choiceIndex) {
        const a = ensure(pair.a);
        const b = ensure(pair.b);
        adjustRelation(gameState, a, b, choice.relation || {});
        [
            [a, choice.a || {}],
            [b, choice.b || {}]
        ].forEach(([emp, delta]) => {
            emp.satisfaction = clamp((emp.satisfaction == null ? emp.morale || 70 : emp.satisfaction) + (delta.satisfaction || 0));
            emp.loyalty = clamp((emp.loyalty == null ? 55 : emp.loyalty) + (delta.loyalty || 0));
            emp.fatigue = clamp((emp.fatigue || 0) + (delta.fatigue || 0));
            emp.xp = Math.max(0, (emp.xp || 0) + (delta.xp || 0));
            if (delta.xp && typeof root.addEmployeeCareerXp === "function") {
                root.addEmployeeCareerXp(emp, delta.xp, "关系事件带来的职业成长", gameState);
            }
            emp.morale = clamp(Math.round((emp.satisfaction + emp.loyalty) / 2));
            if (root.setEmployeeStatus && delta.satisfaction != null) {
                root.setEmployeeStatus(emp, delta.satisfaction >= 0 ? "和同事重新对上节奏" : "把话咽回工作里", delta.satisfaction >= 0 ? "good" : "warn");
            }
        });
        if (choice.rp) gameState.rp = Math.max(0, (gameState.rp || 0) + choice.rp);
        if (choice.tag) {
            addGrowthTag(a, choice.tag);
            addGrowthTag(b, choice.tag);
        }
        if (choice.memory) rememberPair(a, b, choice.memory, gameState);
        markPairEvent(pair.type, a, b);
        if (!pair.followUp) markFollowUpSeed(pair, choiceIndex || 0);
        if (choice.chronicle) call("addChronicleEntry", choice.chronicle(a, b));
        finish(gameState);
    }

    function maybeTriggerEmployeeRelationshipEvent(gameState, rng) {
        if (!gameState || typeof root.showChoiceEvent !== "function") return false;
        const candidates = employeeRelationshipEventCandidates(gameState);
        if (!candidates.length) return false;
        const pair = candidates[0];
        const rand = typeof rng === "function" ? rng : Math.random;
        if (pair.score < 82 && rand() > 0.28) return false;
        const def = RELATIONSHIP_EVENT_DEFS[pair.type] || RELATIONSHIP_FOLLOWUP_DEFS[pair.type];
        if (!def) return false;
        const desc = `
            <div class="employee-relationship-event">
                <p>${def.scene(pair.a, pair.b)}</p>
                <div class="employee-relationship-focus">
                    <b>${safe(pair.relation.role || "同事关系")}</b>
                    <span>${safe(def.focus)}</span>
                </div>
            </div>
        `;
        root.showChoiceEvent(
            `<i class="${def.icon}"></i> ${def.title(pair.a, pair.b)}`,
            desc,
            def.choices.map((choice, index) => ({
                text: choice.text,
                action: () => applyEmployeeRelationshipEventChoice(gameState, pair, choice, index)
            }))
        );
        return true;
    }

    return {
        RELATIONSHIP_EVENT_DEFS,
        RELATIONSHIP_FOLLOWUP_DEFS,
        employeeRelationshipEventCandidates,
        maybeTriggerEmployeeRelationshipEvent,
        applyEmployeeRelationshipEventChoice
    };
});
