// ==========================================================================
// 情境化事件引擎（浏览器 classic script + Node 双模）
// 纯函数，不读取模块外全局；真实状态由 ctx.gameState 传入。
// ==========================================================================
(function (root, factory) {
    const api = factory();
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(this, function () {

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function matchCondition(state, cond) {
        if (!cond) return true;
        if (cond.minTeam != null && state.team < cond.minTeam) return false;
        if (cond.maxTeam != null && state.team > cond.maxTeam) return false;
        if (cond.requiresRole != null && !((state.roles[cond.requiresRole] || 0) >= 1)) return false;
        if (cond.minFunds != null && state.funds < cond.minFunds) return false;
        if (cond.maxFunds != null && state.funds > cond.maxFunds) return false;
        if (cond.minFans != null && state.fans < cond.minFans) return false;
        if (cond.maxFans != null && state.fans > cond.maxFans) return false;
        if (cond.background != null && state.background !== cond.background) return false;
        if (cond.minStage != null && state.stage < cond.minStage) return false;
        if (cond.maxStage != null && state.stage > cond.maxStage) return false;
        return true;
    }

    function eligibleEvents(events, state) {
        return events.filter(e => matchCondition(state, e.cond));
    }

    function pickWeighted(list, rng) {
        const rand = typeof rng === "function" ? rng : Math.random;
        const total = list.reduce((s, e) => s + (e.weight || 1), 0);
        if (total <= 0) return list[0] || null;
        let r = rand() * total;
        for (const e of list) {
            r -= (e.weight || 1);
            if (r < 0) return e;
        }
        return list[list.length - 1] || null;
    }

    const ROLE_TOKENS = ["artist", "programmer", "designer"];

    function pickMember(state, role, rng) {
        const rand = typeof rng === "function" ? rng : Math.random;
        const pool = (state.employees || []).filter(emp => emp.role === role);
        if (!pool.length) return null;
        return pool[Math.floor(rand() * pool.length)];
    }

    function selectTargets(event, state, rng) {
        const text = JSON.stringify([event.title, event.desc, event.choices]);
        const byRole = {};
        ROLE_TOKENS.forEach(role => {
            if (text.indexOf("{" + role + "}") !== -1) byRole[role] = pickMember(state, role, rng);
        });
        const targetRole = event.target || (event.cond && event.cond.requiresRole) || null;
        let target = null;
        if (targetRole) {
            target = (byRole[targetRole] !== undefined) ? byRole[targetRole] : pickMember(state, targetRole, rng);
        }
        return { byRole, target };
    }

    function resolveTokens(text, ctx) {
        if (!text) return text;
        return text.replace(/\{(\w+)\}/g, function (m, key) {
            if (key === "target") return (ctx.target && ctx.target.name) || "团队成员";
            if (ctx.byRole && ctx.byRole[key]) return ctx.byRole[key].name;
            return "团队成员";
        });
    }

    function applyEffects(effects, ctx, rng) {
        if (!effects) return;
        const rand = typeof rng === "function" ? rng : Math.random;
        const gs = ctx.gameState;
        if (effects.funds != null) gs.funds += effects.funds;
        if (effects.fans != null) gs.fans = Math.max(0, gs.fans + effects.fans);
        if (effects.rp != null) gs.rp = Math.max(0, gs.rp + effects.rp);
        if (effects.moraleAll != null) (gs.employees || []).forEach(e => { e.morale = clamp((e.morale == null ? 75 : e.morale) + effects.moraleAll, 0, 100); });
        if (effects.fatigueAll != null) (gs.employees || []).forEach(e => { e.fatigue = clamp((e.fatigue || 0) + effects.fatigueAll, 0, 100); });
        if (ctx.target) {
            if (effects.targetMorale != null) ctx.target.morale = clamp((ctx.target.morale == null ? 75 : ctx.target.morale) + effects.targetMorale, 0, 100);
            if (effects.targetFatigue != null) ctx.target.fatigue = clamp((ctx.target.fatigue || 0) + effects.targetFatigue, 0, 100);
            if (effects.targetStat && ctx.target.stats) {
                Object.keys(effects.targetStat).forEach(k => {
                    if (ctx.target.stats[k] != null) ctx.target.stats[k] = Math.max(1, ctx.target.stats[k] + effects.targetStat[k]);
                });
            }
        }
        if (effects.chance) {
            const c = effects.chance;
            if (rand() < c.p) applyEffects(c.then, ctx, rng);
            else applyEffects(c.else, ctx, rng);
        }
    }

    function buildEventState(gameState) {
        const emps = gameState.employees || [];
        const roles = { artist: 0, programmer: 0, designer: 0 };
        emps.forEach(e => { if (roles[e.role] != null) roles[e.role]++; });
        return {
            team: emps.length,
            roles: roles,
            funds: gameState.funds,
            fans: gameState.fans,
            background: gameState.founderBackground,
            stage: gameState.companyStage || 0,
            employees: emps
        };
    }

    return { matchCondition, eligibleEvents, pickWeighted, pickMember, selectTargets, resolveTokens, applyEffects, buildEventState };
});
