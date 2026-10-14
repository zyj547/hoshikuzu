// ==========================================================================
// Employee counseling: story-first heart-knot conversations during quiet weeks.
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
        if (!emp) return emp;
        if (root.ensureEmployeeVitals) root.ensureEmployeeVitals(emp);
        if (root.ensureEmployeePsychology) root.ensureEmployeePsychology(emp);
        if (!emp.storyFlags || typeof emp.storyFlags !== "object" || Array.isArray(emp.storyFlags)) emp.storyFlags = {};
        return emp;
    }

    function addMemory(emp, text, gameState) {
        if (root.addEmployeeMemory) root.addEmployeeMemory(emp, text, gameState);
    }

    function addGrowthTag(emp, tag) {
        ensure(emp);
        const tags = emp.psychology.growthTags || [];
        if (!tags.includes(tag)) tags.push(tag);
        emp.psychology.growthTags = tags.slice(-4);
    }

    function counselingKey(emp) {
        ensure(emp);
        return `counsel_${emp.psychology.knotKey || "default"}`;
    }

    function hasCounseled(emp) {
        return Boolean(ensure(emp).storyFlags[counselingKey(emp)]);
    }

    function markCounseled(emp) {
        ensure(emp).storyFlags[counselingKey(emp)] = true;
    }

    function finishCounseling(gameState) {
        call("saveGame");
        call("updateStatsUI");
        call("loadOfficeDesks");
        if (typeof root.renderOfficeTheater === "function") root.renderOfficeTheater(gameState);
    }

    const COUNSELING_EVENTS = {
        prove_self: {
            title: emp => `<i class="fa-solid fa-comments"></i> ${safe(emp.name)} 想证明自己`,
            scene: emp => `${safe(emp.name)} 把一份改了三遍的方案放在桌上，语速比平时快。你听得出来，真正让 TA 紧张的不是方案本身，而是那句没说出口的话：“我是不是还不够格？”`,
            focus: "给一个可完成的小责任，并在复盘时点名具体成长。",
            choices: [
                { text: "拆出一块小任务，让 TA 独立负责", trust: 10, loyalty: 8, satisfaction: 9, fatigue: -8, burnout: -18, tag: "被认真托付", memory: "你把一个小但完整的责任交给 TA，并约好复盘时只谈具体成长。" },
                { text: "先肯定努力，再一起收窄目标", trust: 7, loyalty: 5, satisfaction: 7, fatigue: -6, burnout: -14, tag: "目标变清楚", memory: "你没有急着评价好坏，而是陪 TA 把目标收窄成能落地的一步。" },
                { text: "告诉 TA 现在还不是时候", trust: -7, loyalty: -4, satisfaction: -7, fatigue: 4, burnout: 8, tag: "被按下暂停", memory: "你让 TA 先别想太多，方案被收回去后，TA 一整天都很安静。" }
            ]
        },
        old_project_shadow: {
            title: emp => `<i class="fa-solid fa-shield-heart"></i> ${safe(emp.name)} 对风险过度警觉`,
            scene: emp => `${safe(emp.name)} 又在会议后留下来，把上线清单、回滚方案和预算风险排成一列。TA 像是在防备一个还没发生的失败，也像是在跟过去某个失控项目较劲。`,
            focus: "不要空泛安慰，给清晰边界、备选方案和复盘权。",
            choices: [
                { text: "让 TA 主导一次风险复盘", trust: 9, loyalty: 7, satisfaction: 6, fatigue: -5, burnout: -16, tag: "风险有出口", memory: "你把风险复盘权交给 TA，TA 第一次没有把所有担心都憋在自己身上。" },
                { text: "共同写一份上线边界清单", trust: 7, loyalty: 4, satisfaction: 5, fatigue: -7, burnout: -13, tag: "边界感恢复", memory: "你和 TA 一起写下上线边界，很多焦虑终于变成了可执行的条目。" },
                { text: "让 TA 别总想最坏情况", trust: -8, loyalty: -5, satisfaction: -6, fatigue: 6, burnout: 10, tag: "担心被轻视", memory: "你让 TA 放轻松，但 TA 听见的是：那些预警又一次没人当回事。" }
            ]
        },
        unseen_effort: {
            title: emp => `<i class="fa-solid fa-eye"></i> ${safe(emp.name)} 不想再白费力气`,
            scene: emp => `${safe(emp.name)} 看起来漫不经心，却把别人随手提到的小问题都补上了。被问起时 TA 只说“顺手”，但那种语气更像是在试探：这次会有人看见吗？`,
            focus: "先承认真实贡献，再给明确目标把 TA 从躲闪里拉出来。",
            choices: [
                { text: "当众点名 TA 补上的关键缺口", trust: 8, loyalty: 8, satisfaction: 10, fatigue: -6, burnout: -18, tag: "努力被看见", memory: "你当众说出了 TA 补上的关键缺口，TA 嘴上嫌夸张，下午却主动接了新任务。" },
                { text: "私下感谢，并给一个清晰收尾目标", trust: 7, loyalty: 5, satisfaction: 7, fatigue: -8, burnout: -15, tag: "愿意再认真", memory: "你私下感谢了 TA 的补位，并给了一个很清楚的收尾目标。" },
                { text: "默认这是 TA 应该做的", trust: -7, loyalty: -5, satisfaction: -8, fatigue: 5, burnout: 9, tag: "继续装作无所谓", memory: "TA 没再解释那些额外工作，只是把聊天头像换成了一个更冷的表情。" }
            ]
        },
        broken_promises: {
            title: emp => `<i class="fa-solid fa-file-signature"></i> ${safe(emp.name)} 不再相信口头承诺`,
            scene: emp => `${safe(emp.name)} 没有吵，只是把你刚说的“以后会补”重复了一遍，然后问：“具体是哪一周？”这一刻你意识到，TA 不是难沟通，是太熟悉落空的承诺。`,
            focus: "少讲愿景，多给可兑现的数字、期限和规则。",
            choices: [
                { text: "写下明确期限和兑现规则", trust: 11, loyalty: 7, satisfaction: 7, fatigue: -5, burnout: -18, tag: "承诺可兑现", memory: "你把承诺写成了明确期限和规则，TA 没有笑，但把那张纸收好了。" },
                { text: "坦诚公司现金流，不画饼", trust: 8, loyalty: 5, satisfaction: 5, fatigue: -4, burnout: -12, tag: "听见真话", memory: "你没有包装现状，而是把现金流和限制讲清楚，TA 反而松了一口气。" },
                { text: "继续用愿景稳定情绪", trust: -10, loyalty: -7, satisfaction: -7, fatigue: 4, burnout: 10, tag: "拒绝被画饼", memory: "你试着讲愿景，TA 点了点头，但眼神已经从会议里退出去了。" }
            ]
        },
        sellout_fear: {
            title: emp => `<i class="fa-solid fa-palette"></i> ${safe(emp.name)} 害怕作品变味`,
            scene: emp => `${safe(emp.name)} 指着需求表里新增的商业点沉默很久。TA 不是不懂收入压力，只是担心团队慢慢习惯把表达让给热词、把锋芒让给留存曲线。`,
            focus: "保留创作自留地，让 TA 知道妥协不是投降。",
            choices: [
                { text: "保留一块不被热词污染的设计空间", trust: 9, loyalty: 6, satisfaction: 9, fatigue: -5, burnout: -16, tag: "表达被保留", memory: "你为作品保留了一块创作自留地，TA 开始重新愿意谈那些锋利的想法。" },
                { text: "把商业目标翻译成创作约束", trust: 7, loyalty: 5, satisfaction: 6, fatigue: -5, burnout: -12, tag: "妥协有尊严", memory: "你把商业目标翻译成创作约束，而不是命令，TA 接受得比想象中快。" },
                { text: "要求 TA 先服从市场", trust: -8, loyalty: -6, satisfaction: -9, fatigue: 5, burnout: 10, tag: "表达被挤压", memory: "你要求 TA 先服从市场，TA 没反驳，但之后的方案明显安全了很多。" }
            ]
        },
        stability_hunger: {
            title: emp => `<i class="fa-solid fa-house-chimney-heart"></i> ${safe(emp.name)} 需要确定感`,
            scene: emp => `${safe(emp.name)} 一直盯着资金和排期。TA 不怕忙，也不怕难，只怕团队每天靠热血撑过去，最后连工资、计划和明天要做什么都说不清。`,
            focus: "透明说明现金流和排期，别把风险包装成热血。",
            choices: [
                { text: "公开现金流和三周排期", trust: 10, loyalty: 7, satisfaction: 6, fatigue: -6, burnout: -17, tag: "稳定感回升", memory: "你公开了现金流和三周排期，TA 终于不用靠猜测判断公司能撑多久。" },
                { text: "给 TA 一个固定节奏的工作边界", trust: 7, loyalty: 5, satisfaction: 7, fatigue: -8, burnout: -14, tag: "节奏被保护", memory: "你为 TA 划出固定节奏和边界，TA 的状态肉眼可见地稳了下来。" },
                { text: "用一句“相信我”带过", trust: -9, loyalty: -6, satisfaction: -6, fatigue: 6, burnout: 10, tag: "缺少安全感", memory: "你让 TA 相信你，但 TA 真正需要的是能被检查的安排。" }
            ]
        },
        freedom_anxiety: {
            title: emp => `<i class="fa-solid fa-route"></i> ${safe(emp.name)} 害怕被固定住`,
            scene: emp => `${safe(emp.name)} 最近完成任务很快，却总在被安排到固定流程时走神。TA 不是不负责，而是害怕自己被卡成一颗螺丝，从此只剩下被分配。`,
            focus: "给清晰交付边界，同时保留一点自主空间。",
            choices: [
                { text: "约定交付边界，留一小块自由探索", trust: 9, loyalty: 6, satisfaction: 8, fatigue: -6, burnout: -16, tag: "自由有边界", memory: "你给了清晰交付边界，也留了一小块自由探索空间，TA 明显重新有了兴致。" },
                { text: "让 TA 选择本周最想优化的一处", trust: 7, loyalty: 4, satisfaction: 7, fatigue: -5, burnout: -12, tag: "重新有选择", memory: "你让 TA 选择本周最想优化的一处，TA 很快拿出一个漂亮的小改动。" },
                { text: "把 TA 固定到最缺人的流水线", trust: -8, loyalty: -5, satisfaction: -8, fatigue: 7, burnout: 11, tag: "自由被收走", memory: "你把 TA 固定到流水线，TA 仍然完成了任务，但再也不主动多说一句。" }
            ]
        },
        control_anxiety: {
            title: emp => `<i class="fa-solid fa-list-check"></i> ${safe(emp.name)} 被不确定性困住`,
            scene: emp => `${safe(emp.name)} 对着 Bug 列表反复刷新，像在等某个看不见的东西爆炸。TA 真正需要的不是更多催促，而是把混沌切成能掌控的格子。`,
            focus: "给可追踪的问题清单，而不是一句“你看着办”。",
            choices: [
                { text: "把问题拆成可追踪清单", trust: 9, loyalty: 6, satisfaction: 7, fatigue: -9, burnout: -18, tag: "混沌被拆开", memory: "你和 TA 把问题拆成可追踪清单，TA 终于停止反复刷新同一个页面。" },
                { text: "指定一个明确验收口径", trust: 7, loyalty: 4, satisfaction: 5, fatigue: -6, burnout: -13, tag: "验收更清晰", memory: "你给出明确验收口径，TA 的焦虑从一团雾变成了几条任务。" },
                { text: "让 TA 自己看着办", trust: -9, loyalty: -4, satisfaction: -7, fatigue: 8, burnout: 12, tag: "被丢进混沌", memory: "你让 TA 自己看着办，TA 点头接下，却把每个小问题都看成潜在事故。" }
            ]
        },
        default: {
            title: emp => `<i class="fa-solid fa-heart-pulse"></i> ${safe(emp.name)} 有话想说`,
            scene: emp => `${safe(emp.name)} 在下班前停住脚步，像是把一句话在心里排练了很久。TA 不一定需要你立刻解决什么，只是想确认自己不是被工作吞掉的一行数值。`,
            focus: "认真听完，再把模糊情绪落到一个能执行的小改变上。",
            choices: [
                { text: "认真听完，并承诺一个小改变", trust: 8, loyalty: 5, satisfaction: 8, fatigue: -6, burnout: -15, tag: "被认真听见", memory: "你认真听完了 TA 的担心，并把它落成一个小但真实的改变。" },
                { text: "陪 TA 一起梳理当前压力", trust: 6, loyalty: 4, satisfaction: 6, fatigue: -8, burnout: -12, tag: "压力被说清", memory: "你陪 TA 梳理了当前压力，至少那些情绪不再全压在心口。" },
                { text: "让 TA 先把工作做完", trust: -7, loyalty: -4, satisfaction: -7, fatigue: 5, burnout: 9, tag: "情绪被搁置", memory: "你让 TA 先把工作做完，TA 把话咽了回去。" }
            ]
        }
    };

    function eventFor(emp) {
        ensure(emp);
        return COUNSELING_EVENTS[emp.psychology.knotKey] || COUNSELING_EVENTS.default;
    }

    function counselingScore(emp) {
        ensure(emp);
        const p = emp.psychology || {};
        return Math.round(
            (p.burnoutRisk || 0) +
            Math.max(0, 58 - (p.trustInFounder || 50)) * 1.35 +
            Math.max(0, 55 - (emp.satisfaction || 70)) * 1.1 +
            Math.max(0, 55 - (emp.loyalty || 70)) * 0.9 +
            Math.max(0, (emp.fatigue || 0) - 45) * 0.5
        );
    }

    function employeeCounselingCandidates(gameState) {
        if (!gameState || !Array.isArray(gameState.employees)) return [];
        return gameState.employees
            .filter(emp => emp && emp.id !== "player")
            .map(emp => {
                ensure(emp);
                return { emp, score: counselingScore(emp) };
            })
            .filter(item => item.score >= 52 && !hasCounseled(item.emp))
            .sort((a, b) => b.score - a.score);
    }

    function applyCounselingChoice(emp, gameState, choice) {
        ensure(emp);
        const p = emp.psychology || {};
        p.trustInFounder = clamp((p.trustInFounder || 50) + (choice.trust || 0));
        p.burnoutRisk = clamp((p.burnoutRisk || 0) + (choice.burnout || 0));
        emp.loyalty = clamp((emp.loyalty || 50) + (choice.loyalty || 0));
        emp.satisfaction = clamp((emp.satisfaction || emp.morale || 70) + (choice.satisfaction || 0));
        emp.fatigue = clamp((emp.fatigue || 0) + (choice.fatigue || 0));
        emp.morale = clamp(Math.round((emp.satisfaction + emp.loyalty) / 2));
        if (choice.tag) addGrowthTag(emp, choice.tag);
        if (choice.memory) addMemory(emp, choice.memory, gameState);
        if (root.setEmployeeStatus) root.setEmployeeStatus(emp, choice.tag || "整理自己的心情", choice.trust >= 0 ? "good" : "risk");
        markCounseled(emp);
        if (root.updateDynamicPsychology) root.updateDynamicPsychology(emp);
        call("addChronicleEntry", `💬 ${emp.name} 和你进行了一次关于「${(root.employeeHeartKnot && root.employeeHeartKnot(emp).title) || "心结"}」的谈话。`);
        finishCounseling(gameState);
    }

    function counselingChoices(emp, gameState, event) {
        return event.choices.map(choice => ({
            text: choice.text,
            action: () => applyCounselingChoice(emp, gameState, choice)
        }));
    }

    function maybeTriggerEmployeeCounseling(gameState, rng) {
        if (!gameState || typeof root.showChoiceEvent !== "function") return false;
        const candidates = employeeCounselingCandidates(gameState);
        if (!candidates.length) return false;
        const top = candidates[0];
        const rand = typeof rng === "function" ? rng : Math.random;
        if (top.score < 72 && rand() > 0.35) return false;
        const emp = top.emp;
        const event = eventFor(emp);
        const knot = root.employeeHeartKnot ? root.employeeHeartKnot(emp) : { title: "心结", need: event.focus };
        const desc = `
            <div class="employee-counseling-event">
                <p>${event.scene(emp)}</p>
                <div class="employee-counseling-focus">
                    <b>${safe(knot.title || "心结")}</b>
                    <span>${safe(knot.need || event.focus)}</span>
                </div>
            </div>
        `;
        root.showChoiceEvent(event.title(emp), desc, counselingChoices(emp, gameState, event));
        return true;
    }

    return {
        COUNSELING_EVENTS,
        employeeCounselingCandidates,
        maybeTriggerEmployeeCounseling,
        applyCounselingChoice
    };
});
