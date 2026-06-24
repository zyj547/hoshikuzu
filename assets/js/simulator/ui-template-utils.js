// ==========================================================================
// 静态 UI 模板挂载工具：让 simulator.html 只保留骨架和挂载点
// ==========================================================================
(function (root, factory) {
    const api = factory(root);
    if (typeof window !== "undefined") Object.assign(window, api);
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    function mountSimulatorTemplate(html, targetId = "modal-root") {
        if (typeof document === "undefined") return;
        const target = document.getElementById(targetId) || document.body;
        target.insertAdjacentHTML("beforeend", html);
    }

    return { mountSimulatorTemplate };
});
