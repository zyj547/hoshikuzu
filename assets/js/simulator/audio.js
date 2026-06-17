// ==========================================================================
// 4. Web Audio API 8-bit 背景音乐与复古音效合成器 (BGM/SFX Engine)
// ==========================================================================
let bgmEnabled = false;
let sfxEnabled = true;
let synthAudioCtx = null;
let bgmInterval = null;
let bgmBeatIndex = 0;

function initSynthAudio() {
    if (!synthAudioCtx) {
        synthAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (synthAudioCtx.state === "suspended") {
        synthAudioCtx.resume();
    }
}

// Web Audio 复古音效播放
function playSFX(type) {
    if (!sfxEnabled) return;
    initSynthAudio();
    const now = synthAudioCtx.currentTime;

    if (type === "click") {
        const osc = synthAudioCtx.createOscillator();
        const gain = synthAudioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.connect(gain); gain.connect(synthAudioCtx.destination);
        osc.start(); osc.stop(now + 0.08);
    } 
    else if (type === "point") {
        const osc = synthAudioCtx.createOscillator();
        const gain = synthAudioCtx.createGain();
        osc.type = "sine";
        // 产生欢快的短音
        osc.frequency.setValueAtTime(1200 + Math.random()*200, now);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain); gain.connect(synthAudioCtx.destination);
        osc.start(); osc.stop(now + 0.05);
    } 
    else if (type === "bug") {
        const osc = synthAudioCtx.createOscillator();
        const gain = synthAudioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(180, now + 0.08);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(gain); gain.connect(synthAudioCtx.destination);
        osc.start(); osc.stop(now + 0.15);
    } 
    else if (type === "success") {
        // 复古琶音 C5-E5-G5-C6
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
            const osc = synthAudioCtx.createOscillator();
            const gain = synthAudioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.03, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.15);
            osc.connect(gain); gain.connect(synthAudioCtx.destination);
            osc.start(now + idx * 0.06); osc.stop(now + idx * 0.06 + 0.15);
        });
    } 
    else if (type === "upgrade") {
        // 连贯向上滑音
        const osc = synthAudioCtx.createOscillator();
        const gain = synthAudioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.25);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(gain); gain.connect(synthAudioCtx.destination);
        osc.start(); osc.stop(now + 0.25);
    } 
    else if (type === "bankruptcy") {
        // 悲凉降音
        const osc = synthAudioCtx.createOscillator();
        const gain = synthAudioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.8);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc.connect(gain); gain.connect(synthAudioCtx.destination);
        osc.start(); osc.stop(now + 0.8);
    }
    else if (type === "zap") {
        // 灭虫打击音：短促方波高频下扫，给点击 bug 反馈打击感
        const osc = synthAudioCtx.createOscillator();
        const gain = synthAudioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(gain); gain.connect(synthAudioCtx.destination);
        osc.start(); osc.stop(now + 0.07);
    }
}

// Web Audio 8-bit 背景音乐合成调度
// 弹奏简单的经典 8-bit 和弦旋律（C - G - Am - F）
function playBGMBeat() {
    if (!bgmEnabled) return;
    const now = synthAudioCtx.currentTime;

    // 和弦对应根音音阶 (C3, G3, A3, F3)
    const chords = [130.81, 97.99, 110.00, 87.31];
    // 简单主调旋律
    const melody = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

    const currentChord = chords[Math.floor(bgmBeatIndex / 8) % chords.length];
    
    // 1. 低音节奏器 (Oscillator 1)
    const bassOsc = synthAudioCtx.createOscillator();
    const bassGain = synthAudioCtx.createGain();
    bassOsc.type = "triangle";
    
    // 拍点低音 (8分音符节奏)
    const isOffBeat = bgmBeatIndex % 2 === 1;
    bassOsc.frequency.setValueAtTime(isOffBeat ? currentChord * 1.5 : currentChord, now);
    
    bassGain.gain.setValueAtTime(0.008, now); // 音量控制在极其微弱以防杂音
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    bassOsc.connect(bassGain); bassGain.connect(synthAudioCtx.destination);
    bassOsc.start(); bassOsc.stop(now + 0.25);

    // 2. 琶音器/主调音符 (Oscillator 2)
    if (bgmBeatIndex % 4 === 0 || bgmBeatIndex % 4 === 2) {
        const leadOsc = synthAudioCtx.createOscillator();
        const leadGain = synthAudioCtx.createGain();
        leadOsc.type = "sine";

        // 随机选择主调音阶中的符合和弦的音符
        const note = melody[Math.floor(Math.random() * melody.length)];
        leadOsc.frequency.setValueAtTime(note, now);
        
        leadGain.gain.setValueAtTime(0.005, now);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        leadOsc.connect(leadGain); leadGain.connect(synthAudioCtx.destination);
        leadOsc.start(); leadOsc.stop(now + 0.35);
    }

    bgmBeatIndex = (bgmBeatIndex + 1) % 32;
}

function toggleBGM(e) {
    if (e) e.stopPropagation();
    bgmEnabled = !bgmEnabled;
    initSynthAudio();
    
    const btn = document.getElementById("btn-bgm");
    if (bgmEnabled) {
        btn.classList.add("active");
        btn.innerHTML = `<i class="fa-solid fa-music"></i> 音乐: 开`;
        // 每拍 300 毫秒
        bgmBeatIndex = 0;
        bgmInterval = setInterval(playBGMBeat, 300);
        playSFX("click");
    } else {
        btn.classList.remove("active");
        btn.innerHTML = `<i class="fa-solid fa-music"></i> 音乐: 关`;
        if (bgmInterval) {
            clearInterval(bgmInterval);
            bgmInterval = null;
        }
    }
}

function toggleSFX(e) {
    if (e) e.stopPropagation();
    sfxEnabled = !sfxEnabled;
    
    const btn = document.getElementById("btn-sfx");
    if (sfxEnabled) {
        btn.classList.add("active");
        btn.innerHTML = `<i class="fa-solid fa-volume-high"></i> 音效: 开`;
        playSFX("click");
    } else {
        btn.classList.remove("active");
        btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i> 音效: 关`;
    }
}

