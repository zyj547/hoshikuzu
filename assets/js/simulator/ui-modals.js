
// ==========================================================================
// 重写 window.alert 弹窗系统 (接管为自定义高科技 Modal 弹窗)
// ==========================================================================
let alertQueue = [];
let isAlertActive = false;

window.alert = function(message, title = "系统提示") {
    return new Promise((resolve) => {
        alertQueue.push({ message, title, resolve });
        processAlertQueue();
    });
};

function processAlertQueue() {
    if (isAlertActive || alertQueue.length === 0) return;
    isAlertActive = true;

    const { message, title, resolve } = alertQueue.shift();

    const modal = document.getElementById("custom-alert-modal");
    const titleEl = document.getElementById("custom-alert-title");
    const msgEl = document.getElementById("custom-alert-message");
    const btn = document.getElementById("custom-alert-confirm-btn");
    const iconEl = modal.querySelector(".custom-alert-icon");

    titleEl.innerText = title;
    msgEl.innerHTML = message; // 允许嵌入一些HTML比如加粗或图标

    // 根据弹窗内容自动分配图标和颜色
    if (message.includes("⚠️") || message.includes("不足") || message.includes("警告")) {
        iconEl.className = "fa-solid fa-triangle-exclamation custom-alert-icon warning";
    } else if (message.includes("恭喜") || message.includes("成功") || message.includes("入职") || message.includes("解除") || message.includes("增加") || message.includes("重组") || message.includes("提升")) {
        iconEl.className = "fa-solid fa-circle-check custom-alert-icon success";
    } else {
        iconEl.className = "fa-solid fa-bell custom-alert-icon info";
    }

    modal.classList.add("active");

    // 播放提示音效 (如果音频引擎已就绪且可用)
    if (typeof playSFX === "function") {
        if (message.includes("不足") || message.includes("⚠️")) {
            playSFX("bug");
        } else if (message.includes("成功") || message.includes("重组") || message.includes("恭喜") || message.includes("提升")) {
            playSFX("success");
        } else {
            playSFX("click");
        }
    }

    const handleClose = () => {
        modal.classList.remove("active");
        btn.removeEventListener("click", handleClose);
        document.removeEventListener("keydown", handleKeydown);
        setTimeout(() => {
            isAlertActive = false;
            resolve();
            processAlertQueue();
        }, 300); // 300ms 渐隐动画结束后执行下一个或 resolve
    };

    const handleKeydown = (e) => {
        if (e.key === "Enter" || e.key === "Escape") {
            e.preventDefault();
            handleClose();
        }
    };

    btn.addEventListener("click", handleClose);
    document.addEventListener("keydown", handleKeydown);
    
    // 给按钮焦点，方便键盘操作
    setTimeout(() => {
        btn.focus();
    }, 50);
}

// ==========================================================================
// 重写 window.confirm 确认弹窗系统 (接管为自定义高科技 Confirm Modal 弹窗)
// ==========================================================================
let confirmQueue = [];
let isConfirmActive = false;

window.confirm = function(message, title = "系统确认") {
    return new Promise((resolve) => {
        confirmQueue.push({ message, title, resolve });
        processConfirmQueue();
    });
};

function processConfirmQueue() {
    if (isConfirmActive || confirmQueue.length === 0) return;
    isConfirmActive = true;

    const { message, title, resolve } = confirmQueue.shift();

    const modal = document.getElementById("custom-confirm-modal");
    const titleEl = document.getElementById("custom-confirm-title");
    const msgEl = document.getElementById("custom-confirm-message");
    const okBtn = document.getElementById("custom-confirm-ok-btn");
    const cancelBtn = document.getElementById("custom-confirm-cancel-btn");
    const iconEl = modal.querySelector(".custom-alert-icon");

    titleEl.innerText = title;
    msgEl.innerHTML = message.replace(/\n/g, "<br>"); // 支持换行转换

    // 根据弹窗内容自动分配图标
    if (message.includes("警告") || message.includes("彻底删除") || message.includes("清除") || message.includes("💀")) {
        iconEl.className = "fa-solid fa-triangle-exclamation custom-alert-icon warning";
    } else {
        iconEl.className = "fa-solid fa-circle-question custom-alert-icon info";
    }

    modal.classList.add("active");

    // 播放音效
    if (typeof playSFX === "function") {
        playSFX("click");
    }

    const cleanUp = () => {
        modal.classList.remove("active");
        okBtn.removeEventListener("click", handleOk);
        cancelBtn.removeEventListener("click", handleCancel);
        document.removeEventListener("keydown", handleKeydown);
    };

    const handleOk = () => {
        cleanUp();
        setTimeout(() => {
            isConfirmActive = false;
            resolve(true);
            processConfirmQueue();
        }, 300);
    };

    const handleCancel = () => {
        cleanUp();
        setTimeout(() => {
            isConfirmActive = false;
            resolve(false);
            processConfirmQueue();
        }, 300);
    };

    const handleKeydown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleOk();
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
        }
    };

    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    document.addEventListener("keydown", handleKeydown);
    
    // 默认聚焦在确定按钮上
    setTimeout(() => {
        okBtn.focus();
    }, 50);
}

