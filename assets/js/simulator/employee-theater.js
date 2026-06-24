// ==========================================================================
// 员工办公室小剧场：根据状态生成办公室动态、对话和行为片段
// ==========================================================================
(function (root, factory) {
    const api = factory(root);
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
    function ensure(emp) {
        return root.ensureEmployeeVitals ? root.ensureEmployeeVitals(emp) : emp;
    }

    function getName(emp) {
        return (emp && emp.name) || "员工";
    }

    function avatarSceneIcon(emp) {
        ensure(emp);
        if (emp.trait === "debug") return "fa-solid fa-bug";
        if (emp.trait === "lazy") return "fa-solid fa-mug-hot";
        if (emp.trait === "idea") return "fa-solid fa-lightbulb";
        if (emp.trait === "multi") return "fa-solid fa-wand-magic-sparkles";
        if (emp.trait === "salary") return "fa-solid fa-file-invoice-dollar";
        if (emp.role === "artist") return "fa-solid fa-palette";
        if (emp.role === "designer") return "fa-solid fa-diagram-project";
        return "fa-solid fa-code";
    }

    function officeBubbleText(emp) {
        ensure(emp);
        const name = getName(emp);
        if (emp.fatigue >= 80) return `${name} 正靠着椅背硬撑，杯子旁又多了一张便签。`;
        if (emp.satisfaction <= 35) return `${name} 今天话很少，像是在和屏幕冷战。`;
        if (emp.trait === "debug") return `${name} 盯着日志念念有词，像在审问一段可疑代码。`;
        if (emp.trait === "lazy") return `${name} 桌上零食很多，但任务清单居然也在一点点变短。`;
        if (emp.trait === "idea") return `${name} 在白板角落画了个箭头，旁边写着“也许能行”。`;
        if (emp.trait === "multi") return `${name} 在两个工位之间来回穿梭，顺手补了几个小洞。`;
        if (emp.archetype === "veteran") return `${name} 端着杯子看窗外，像在回忆某个踩过的坑。`;
        if (emp.archetype === "fresh") return `${name} 坐得很直，鼠标旁摊着一页密密麻麻的笔记。`;
        if (emp.satisfaction >= 82) return `${name} 今天状态很好，连敲键盘都带着节奏。`;
        return `${name} 正在安静推进手头任务。`;
    }

    function roleLabel(emp) {
        if (emp.role === "artist") return "美术";
        if (emp.role === "designer") return "策划";
        if (emp.role === "programmer") return "程序";
        return "伙伴";
    }

    function isDeveloping(gameState) {
        return !!(gameState && gameState.currentProject && gameState.currentProject.state === "developing");
    }

    function dateSeed(gameState) {
        const date = (gameState && gameState.date) || {};
        return (date.year || 1) * 100 + (date.month || 1) * 10 + (date.week || 1);
    }

    function firstMember(members, predicate) {
        return members.find(emp => {
            ensure(emp);
            return predicate(emp);
        });
    }

    function firstPair(members, predicate) {
        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                ensure(members[i]);
                ensure(members[j]);
                if (predicate(members[i], members[j])) return [members[i], members[j]];
                if (predicate(members[j], members[i])) return [members[j], members[i]];
            }
        }
        return null;
    }

    function makeDialogue(title, tone, icon, people, lines, meta) {
        return { type: "dialogue", title, tone, icon, people, lines, meta };
    }

    function makeAction(title, tone, icon, people, text, meta) {
        return { type: "action", title, tone, icon, people, text, meta };
    }

    function makeSolo(emp) {
        ensure(emp);
        return {
            type: "solo",
            title: getName(emp),
            tone: emp.statusTone || "neutral",
            icon: avatarSceneIcon(emp),
            people: [emp],
            text: officeBubbleText(emp),
            meta: emp.statusText || "整理任务"
        };
    }

    function buildOfficeTheaterBeats(gameState) {
        if (!gameState || !Array.isArray(gameState.employees)) return [];
        if (root.ensureEmployeeEcosystem) root.ensureEmployeeEcosystem(gameState);
        const members = gameState.employees.filter(emp => emp.id !== "player");
        const beats = [];
        const developing = isDeveloping(gameState);
        const projectName = gameState.currentProject && gameState.currentProject.name;

        const tired = firstMember(members, emp => emp.fatigue >= 76);
        if (tired) {
            beats.push(makeAction(
                "灯还亮着",
                "risk",
                "fa-solid fa-moon",
                [tired],
                `${getName(tired)} 把第三杯咖啡推远，小声说：“我不是想硬撑，只是不想把坑留给明天。”`,
                "疲劳偏高"
            ));
        }

        const unhappy = firstMember(members, emp => emp.satisfaction <= 38);
        if (unhappy) {
            beats.push(makeAction(
                "沉默的一角",
                "warn",
                "fa-solid fa-cloud",
                [unhappy],
                `${getName(unhappy)} 今天只回了一个“嗯”。旁边的任务板被擦了又写，像是在等一句真正有用的话。`,
                "心情低落"
            ));
        }

        const debugPair = developing ? firstPair(members, (a, b) => a.trait === "debug" && b.trait !== "debug") : null;
        if (debugPair) {
            const [debuggerEmp, mate] = debugPair;
            beats.push(makeDialogue(
                projectName ? `围着《${projectName}》查案` : "围着异常查案",
                "debug",
                "fa-solid fa-magnifying-glass-chart",
                debugPair,
                [
                    { emp: debuggerEmp, text: "这不是玄学，是复现路径没写清。" },
                    { emp: mate, text: "你说这话的时候，眼睛怎么在发光？" }
                ],
                "Bug 追踪"
            ));
        }

        const ideaVeteran = firstPair(members, (a, b) => a.trait === "idea" && b.archetype === "veteran");
        if (ideaVeteran) {
            const [idea, veteran] = ideaVeteran;
            beats.push(makeDialogue(
                "白板前的拉扯",
                "idea",
                "fa-solid fa-chalkboard-user",
                ideaVeteran,
                [
                    { emp: idea, text: "如果把这个系统反过来做，玩家会不会更有记忆点？" },
                    { emp: veteran, text: "可以，但先写下会炸的三种情况。别让灵感替我们背锅。" }
                ],
                "创意校准"
            ));
        }

        const lazyPair = firstPair(members, (a, b) => a.trait === "lazy" && b.trait !== "lazy");
        if (lazyPair) {
            const [lazy, mate] = lazyPair;
            beats.push(makeDialogue(
                "沙发区短会",
                "good",
                "fa-solid fa-couch",
                lazyPair,
                [
                    { emp: lazy, text: "我不是摸鱼，我是在等脑子缓存。" },
                    { emp: mate, text: "缓存满了记得提交，别只提交零食包装。" }
                ],
                "轻松协作"
            ));
        }

        const artDesign = firstPair(members, (a, b) =>
            (a.role === "artist" && b.role === "designer") ||
            (a.role === "designer" && b.role === "artist")
        );
        if (artDesign) {
            const [one, two] = artDesign;
            beats.push(makeDialogue(
                "风格与手感",
                "idea",
                "fa-solid fa-layer-group",
                artDesign,
                [
                    { emp: one, text: "这个按钮看起来很酷，但玩家第一眼会知道该点哪吗？" },
                    { emp: two, text: "那就让它既像奖励，也像答案。" }
                ],
                `${roleLabel(one)} × ${roleLabel(two)}`
            ));
        }

        const freshVeteran = firstPair(members, (a, b) => a.archetype === "fresh" && b.archetype === "veteran");
        if (freshVeteran) {
            const [fresh, veteran] = freshVeteran;
            beats.push(makeDialogue(
                "新人笔记",
                "good",
                "fa-solid fa-book-open",
                freshVeteran,
                [
                    { emp: fresh, text: "我把今天踩到的坑都记下来了，明天是不是就不会再掉进去？" },
                    { emp: veteran, text: "会。但你会摔得更有方向。" }
                ],
                "经验传递"
            ));
        }

        const salary = firstMember(members, emp => emp.trait === "salary" || emp.loyalty <= 34);
        if (salary) {
            beats.push(makeAction(
                "桌角的薪资报告",
                salary.loyalty <= 34 ? "warn" : "neutral",
                "fa-solid fa-file-signature",
                [salary],
                `${getName(salary)} 把一份行业薪资报告压在键盘旁，没说话，但所有人都看见了。`,
                "留任信号"
            ));
        }

        const happyPair = firstPair(members, (a, b) => a.satisfaction >= 82 && b.satisfaction >= 82);
        if (happyPair) {
            const [a, b] = happyPair;
            beats.push(makeDialogue(
                "小胜利",
                "good",
                "fa-solid fa-hand-sparkles",
                happyPair,
                [
                    { emp: a, text: "刚才那个版本，好像终于有点像游戏了。" },
                    { emp: b, text: "先别截图发群里，等我把最丑的那个角落藏起来。" }
                ],
                "士气上升"
            ));
        }

        members.slice(0, 4).forEach(emp => beats.push(makeSolo(emp)));
        const seed = dateSeed(gameState);
        return beats
            .map((beat, index) => ({ beat, score: ((index + 1) * 17 + seed) % 97 }))
            .sort((a, b) => a.score - b.score)
            .map(item => item.beat)
            .slice(0, 4);
    }

    function employeeIndex(gameState, emp) {
        return gameState && Array.isArray(gameState.employees) ? gameState.employees.indexOf(emp) : -1;
    }

    function renderOfficeTheaterBeat(beat, gameState, safe) {
        const first = beat.people && beat.people[0];
        const idx = employeeIndex(gameState, first);
        const click = idx >= 0 ? ` onclick="openEmployeeMemory(${idx})"` : "";
        const icon = beat.icon || (first ? avatarSceneIcon(first) : "fa-solid fa-comments");
        const meta = beat.meta ? `<span>${safe(beat.meta)}</span>` : "";
        const body = beat.type === "dialogue"
            ? `<div class="office-theater-dialogue">${beat.lines.map(line => `
                <div class="office-dialogue-line">
                    <b>${safe(getName(line.emp))}</b>
                    <span>${safe(line.text)}</span>
                </div>
            `).join("")}</div>`
            : `<p>${safe(beat.text)}</p>`;
        return `
            <div class="office-theater-row ${safe(beat.tone || "neutral")} ${safe(beat.type || "solo")}"${click}>
                <div class="office-theater-icon"><i class="${safe(icon)}"></i></div>
                <div class="office-theater-copy">
                    <div class="office-theater-name">${safe(beat.title || "办公室动态")}${meta}</div>
                    ${body}
                </div>
            </div>
        `;
    }

    function renderOfficeTheater(gameState) {
        const box = typeof document !== "undefined" ? document.getElementById("office-theater-list") : null;
        if (!box || !gameState || !Array.isArray(gameState.employees)) return;
        const safe = typeof escapeHtml === "function" ? escapeHtml : (s) => String(s == null ? "" : s);
        const beats = buildOfficeTheaterBeats(gameState);
        if (!beats.length) {
            box.innerHTML = `<div class="office-theater-empty">团队还很安静。招到第一位伙伴后，这里会出现办公室日常。</div>`;
            return;
        }
        box.innerHTML = beats.map(beat => renderOfficeTheaterBeat(beat, gameState, safe)).join("");
    }

    return {
        avatarSceneIcon,
        officeBubbleText,
        buildOfficeTheaterBeats,
        renderOfficeTheaterBeat,
        renderOfficeTheater
    };
});
