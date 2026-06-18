// ==========================================================================
// 面试 / 谈薪 / 计薪 纯计算（浏览器 classic script + Node 双模）
// 注意：本文件不依赖任何 DOM 或全局 gameState，便于测试。
// ==========================================================================
(function (root, factory) {
    const api = factory();
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(this, function () {

    function proratedWage(salary, weeks) {
        const w = Math.max(0, Math.min(4, weeks || 0));
        return Math.round((salary || 0) / 4 * w);
    }

    function archetypeExpect(baseSalary, archetype) {
        const expectedSalary = Math.round(baseSalary * archetype.expectMult);
        const salaryFloor = Math.round(expectedSalary * archetype.floorRatio);
        return { expectedSalary, salaryFloor };
    }

    function evaluateOffer(candidate, offer, rng) {
        const rand = typeof rng === "function" ? rng : Math.random;
        const { expectedSalary, salaryFloor, concession } = candidate;
        const impression = candidate.impression || 0;

        if (offer >= expectedSalary) return { result: "accept" };

        if (offer >= salaryFloor) {
            const acceptP = Math.min(0.95, 0.45 + impression * 0.03 + (offer - salaryFloor) / Math.max(1, expectedSalary - salaryFloor) * 0.3);
            if (rand() < acceptP) return { result: "accept" };
            const counterOffer = Math.round(offer + (expectedSalary - offer) * (1 - concession));
            return { result: "counter", counterOffer: Math.max(offer + 1, Math.min(expectedSalary, counterOffer)) };
        }

        const walkP = Math.max(0, Math.min(1, candidate.walkChance - impression * 0.04));
        if (rand() < walkP) return { result: "walk" };
        const counterOffer = Math.round(salaryFloor + (expectedSalary - salaryFloor) * 0.5);
        return { result: "counter", counterOffer };
    }

    function getInterviewFee(candidate, year) {
        const rarityMult = candidate.rarity === "SSR" ? 2.4 : candidate.rarity === "SR" ? 1.6 : 1;
        const y = Math.max(1, year || 1);
        return Math.round((800 + (y - 1) * 250) * rarityMult);
    }

    return { proratedWage, archetypeExpect, evaluateOffer, getInterviewFee };
});
