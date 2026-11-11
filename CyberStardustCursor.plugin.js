/**
 * @name CyberStardustCursor
 * @author Liebe
 * @authorLink https://github.com/Liebezx
 * @version 1.2.0
 * @description Adds an interactive Cyber Stardust particle trail following your cursor, with a built-in live preview editor.
 * @source https://github.com/Liebezx/CyberStardustCursor
 * @updateUrl https://raw.githubusercontent.com/Liebezx/CyberStardustCursor/main/CyberStardustCursor.plugin.js
 */

const DEFAULT_SETTINGS = {
    trailLength: 5,       // 1..10
    maxParticles: 36,     // 10..120
    particleSize: 1.0,    // 0.4..2.5
    glowBlur: 8,          // 0..24
    spread: 1.0,          // 0.3..2.5
    opacity: 1.0,         // 0.2..1.0
    shape: "circle",      // "circle" | "star" | "diamond"
    glowColor: "#ff2a44",
    colors: [
        { hex: "#ff2a44", enabled: true },
        { hex: "#ff5a73", enabled: true },
        { hex: "#fbbf24", enabled: true },
        { hex: "#fecdd3", enabled: true }
    ]
};

const I18N = {
    ru: {
        previewHint: "Предпросмотр: проведи здесь курсором",
        autoDemoOn: "Авто-демо: ВКЛ",
        autoDemoOff: "Авто-демо: ВЫКЛ",
        presetsTitle: "Быстрые пресеты",
        presetCrimson: "Cyber Crimson (Оригинал)",
        presetGold: "Liebe Mono & Gold",
        presetEmerald: "Cyber Emerald",
        presetCyan: "Neon Cyan & Violet",
        behaviorTitle: "Геометрия и поведение следа",
        trailLength: "Длина следа",
        maxParticles: "Макс. частиц",
        particleSize: "Размер искр",
        glowBlur: "Свечение (Glow)",
        spread: "Разброс",
        opacity: "Яркость",
        shapeLabel: "Форма частиц:",
        shapeCircle: "Искры (круги)",
        shapeStar: "Звёздочки",
        shapeDiamond: "Кристаллы",
        paletteTitle: "Палитра искр и свечение",
        colorSlotTitle: "Цвет",
        glowLabel: "Свечение:",
        autoSaveNote: "Изменения применяются и сохраняются автоматически",
        resetBtn: "Сбросить по умолчанию"
    },
    en: {
        previewHint: "Preview: move your cursor here",
        autoDemoOn: "Auto-Demo: ON",
        autoDemoOff: "Auto-Demo: OFF",
        presetsTitle: "Quick Presets",
        presetCrimson: "Cyber Crimson (Original)",
        presetGold: "Liebe Mono & Gold",
        presetEmerald: "Cyber Emerald",
        presetCyan: "Neon Cyan & Violet",
        behaviorTitle: "Trail Geometry & Physics",
        trailLength: "Trail Length",
        maxParticles: "Max Particles",
        particleSize: "Spark Size",
        glowBlur: "Glow Blur",
        spread: "Spread",
        opacity: "Opacity",
        shapeLabel: "Particle Shape:",
        shapeCircle: "Sparks (Circles)",
        shapeStar: "Stars",
        shapeDiamond: "Diamonds",
        paletteTitle: "Spark Palette & Glow",
        colorSlotTitle: "Color",
        glowLabel: "Glow:",
        autoSaveNote: "Changes apply live and save automatically",
        resetBtn: "Reset to Defaults"
    }
};

const PRESETS = [
    {
        key: "presetCrimson",
        glowColor: "#ff2a44",
        colors: [
            { hex: "#ff2a44", enabled: true },
            { hex: "#ff5a73", enabled: true },
            { hex: "#fbbf24", enabled: true },
            { hex: "#fecdd3", enabled: true }
        ]
    },
    {
        key: "presetGold",
        glowColor: "#e5c17b",
        colors: [
            { hex: "#ffffff", enabled: true },
            { hex: "#e5c17b", enabled: true },
            { hex: "#cbd5e1", enabled: true },
            { hex: "#fef3c7", enabled: true }
        ]
    },
    {
        key: "presetEmerald",
        glowColor: "#10b981",
        colors: [
            { hex: "#10b981", enabled: true },
            { hex: "#34d399", enabled: true },
            { hex: "#a7f3d0", enabled: true },
            { hex: "#fde047", enabled: true }
        ]
    },
    {
        key: "presetCyan",
        glowColor: "#22d3ee",
        colors: [
            { hex: "#22d3ee", enabled: true },
            { hex: "#818cf8", enabled: true },
            { hex: "#e879f9", enabled: true },
            { hex: "#f0f9ff", enabled: true }
        ]
    }
];

function hexToRgbTuple(hex) {
    const clean = String(hex || "#ffffff").replace("#", "");
    const full = clean.length === 3
        ? clean.split("").map(c => c + c).join("")
        : clean.padEnd(6, "f").slice(0, 6);
    const num = parseInt(full, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `${r}, ${g}, ${b}`;
}

function cloneSettings(src) {
    return {
        ...DEFAULT_SETTINGS,
        ...src,
        colors: (src?.colors || DEFAULT_SETTINGS.colors).map(c => ({
            hex: c.hex || "#ffffff",
            enabled: c.enabled !== false
        }))
    };
}

function drawParticle(ctx, p, settings) {
    ctx.save();
    const alpha = Math.max(0, Math.min(1, p.alpha * settings.opacity));
    ctx.fillStyle = `rgba(${p.rgb}, ${alpha})`;
    if (settings.glowBlur > 0) {
        ctx.shadowColor = settings.glowColor;
        ctx.shadowBlur = settings.glowBlur;
    }

    ctx.beginPath();
    if (settings.shape === "diamond") {
        const s = p.size * 1.35;
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s, p.y);
        ctx.closePath();
    } else if (settings.shape === "star") {
        const outer = p.size * 1.5;
        const inner = p.size * 0.55;
        for (let i = 0; i < 8; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const angle = (i * Math.PI) / 4;
            const px = p.x + Math.cos(angle) * r;
            const py = p.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    } else {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
}

function spawnParticlesAt(particles, x, y, dx, dy, settings) {
    const activeColors = settings.colors.filter(c => c.enabled);
    const palette = activeColors.length > 0 ? activeColors : [{ hex: "#ffffff" }];
    const dist = Math.hypot(dx, dy);
    const count = Math.min(3, Math.floor(dist / 14) + 1);

    const decayScale = 1.9 - (settings.trailLength - 1) * 0.16;

    for (let i = 0; i < count; i++) {
        if (particles.length >= settings.maxParticles) break;
        const picked = palette[Math.floor(Math.random() * palette.length)];
        particles.push({
            x: x + (Math.random() - 0.5) * 8 * settings.spread,
            y: y + (Math.random() - 0.5) * 8 * settings.spread,
            vx: (Math.random() - 0.5) * 1.6 * settings.spread,
            vy: ((Math.random() - 0.5) * 1.6 - 0.4) * settings.spread,
            size: (Math.random() * 2.5 + 1.2) * settings.particleSize,
            rgb: hexToRgbTuple(picked.hex),
            alpha: 1.0,
            decay: (Math.random() * 0.035 + 0.02) * decayScale
        });
    }
}

function stepParticles(ctx, width, height, particles, settings) {
    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size = Math.max(0.2, p.size * 0.96);

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }
        drawParticle(ctx, p, settings);
    }
}

module.exports = class CyberStardustCursor {
    constructor(meta) {
        this.pluginName = meta?.name || "CyberStardustCursor";
        this.settings = this.loadSettings();
        this.canvas = null;
        this.ctx = null;
        this.rafId = null;
        this.particles = [];
        this.lastX = 0;
        this.lastY = 0;
        this.width = 0;
        this.height = 0;
        this._onResize = null;
        this._onMouseMove = null;
        this._render = null;
    }

    loadSettings() {
        try {
            const saved = BdApi.Data.load(this.pluginName, "settings");
            return cloneSettings(saved || {});
        } catch {
            return cloneSettings({});
        }
    }

    saveSettings() {
        try {
            BdApi.Data.save(this.pluginName, "settings", this.settings);
        } catch (err) {
            console.error(`[${this.pluginName}] Failed to save settings:`, err);
        }
    }

    start() {
        this.stop();
        this.settings = this.loadSettings();

        const canvas = document.createElement("canvas");
        canvas.id = "liebe-fx-canvas";
        canvas.style.cssText = [
            "position: fixed",
            "inset: 0",
            "width: 100vw",
            "height: 100vh",
            "pointer-events: none",
            "z-index: 999999"
        ].join(";");
        document.body.appendChild(canvas);

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;
        this.particles = [];

        const scheduleRender = () => {
            if (this.rafId === null) {
                this.rafId = requestAnimationFrame(this._render);
            }
        };

        this._onResize = () => {
            if (!this.canvas) return;
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        };

        this._onMouseMove = (e) => {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            if (Math.hypot(dx, dy) > 5) {
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                spawnParticlesAt(this.particles, e.clientX, e.clientY, dx, dy, this.settings);
                scheduleRender();
            }
        };

        this._render = () => {
            this.rafId = null;
            if (!this.ctx || !this.canvas) return;
            stepParticles(this.ctx, this.width, this.height, this.particles, this.settings);
            if (this.particles.length > 0) {
                scheduleRender();
            }
        };

        window.addEventListener("resize", this._onResize);
        window.addEventListener("mousemove", this._onMouseMove);
    }

    stop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this._onResize) {
            window.removeEventListener("resize", this._onResize);
            this._onResize = null;
        }
        if (this._onMouseMove) {
            window.removeEventListener("mousemove", this._onMouseMove);
            this._onMouseMove = null;
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
    }

    getSettingsPanel() {
        let lang = (document.documentElement.lang || navigator.language || "en")
            .toLowerCase()
            .startsWith("ru") ? "ru" : "en";
        let autoDemo = true;

        const panel = document.createElement("div");
        panel.className = "liebe-stardust-editor";
        panel.innerHTML = `
            <style>
                .liebe-stardust-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    color: #f3f4f6;
                    font-size: 13px;
                    padding: 4px 2px;
                }
                .lse-preview-wrap {
                    position: relative;
                    height: 150px;
                    border-radius: 10px;
                    overflow: hidden;
                    background: radial-gradient(circle at 20% 20%, rgba(255, 42, 68, 0.08), transparent 55%),
                                linear-gradient(135deg, #0b0b0f 0%, #141118 100%);
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    cursor: crosshair;
                }
                .lse-preview-canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                .lse-preview-bar {
                    position: absolute;
                    top: 8px;
                    left: 10px;
                    right: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 6px;
                    pointer-events: none;
                }
                .lse-bar-right {
                    display: flex;
                    gap: 6px;
                    pointer-events: auto;
                }
                .lse-badge {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.75);
                    background: rgba(0, 0, 0, 0.55);
                    padding: 3px 8px;
                    border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .lse-pill-btn {
                    pointer-events: auto;
                    cursor: pointer;
                    font-size: 11px;
                    color: #fff;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 999px;
                    padding: 3px 10px;
                    transition: background 0.15s;
                }
                .lse-pill-btn:hover { background: rgba(255, 255, 255, 0.2); }
                .lse-pill-btn.active {
                    background: rgba(255, 42, 68, 0.35);
                    border-color: rgba(255, 42, 68, 0.7);
                }
                .lse-card {
                    background: rgba(0, 0, 0, 0.32);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 10px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .lse-title {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #9ca3af;
                    font-weight: 700;
                }
                .lse-presets {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                .lse-btn {
                    cursor: pointer;
                    padding: 6px 10px;
                    border-radius: 7px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    background: rgba(255, 255, 255, 0.06);
                    color: #f3f4f6;
                    font-size: 12px;
                    transition: background 0.15s, border-color 0.15s;
                }
                .lse-btn:hover {
                    background: rgba(255, 255, 255, 0.14);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                .lse-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px 14px;
                }
                .lse-field {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .lse-field-head {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                }
                .lse-val {
                    color: #fbbf24;
                    font-weight: 600;
                    font-variant-numeric: tabular-nums;
                }
                .lse-range {
                    width: 100%;
                    accent-color: #ff2a44;
                    cursor: pointer;
                }
                .lse-colors-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 10px;
                }
                .lse-color-slot {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 4px 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .lse-color-input {
                    width: 28px;
                    height: 22px;
                    border: none;
                    background: transparent;
                    padding: 0;
                    cursor: pointer;
                }
                .lse-select {
                    background: rgba(20, 20, 26, 0.95);
                    color: #f3f4f6;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: 6px;
                    padding: 5px 8px;
                    font-size: 12px;
                }
                .lse-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
            </style>

            <div class="lse-preview-wrap">
                <canvas class="lse-preview-canvas"></canvas>
                <div class="lse-preview-bar">
                    <span class="lse-badge" data-i18n="previewHint"></span>
                    <div class="lse-bar-right">
                        <button type="button" class="lse-pill-btn" data-lang-toggle></button>
                        <button type="button" class="lse-pill-btn active" data-demo-toggle></button>
                    </div>
                </div>
            </div>

            <div class="lse-card">
                <div class="lse-title" data-i18n="presetsTitle"></div>
                <div class="lse-presets" data-presets></div>
            </div>

            <div class="lse-card">
                <div class="lse-title" data-i18n="behaviorTitle"></div>
                <div class="lse-grid">
                    <label class="lse-field">
                        <span class="lse-field-head"><span data-i18n="trailLength"></span><span class="lse-val" data-val="trailLength"></span></span>
                        <input class="lse-range" type="range" min="1" max="10" step="1" data-key="trailLength">
                    </label>
                    <label class="lse-field">
                        <span class="lse-field-head"><span data-i18n="maxParticles"></span><span class="lse-val" data-val="maxParticles"></span></span>
                        <input class="lse-range" type="range" min="10" max="120" step="2" data-key="maxParticles">
                    </label>
                    <label class="lse-field">
                        <span class="lse-field-head"><span data-i18n="particleSize"></span><span class="lse-val" data-val="particleSize"></span></span>
                        <input class="lse-range" type="range" min="0.4" max="2.5" step="0.1" data-key="particleSize">
                    </label>
                    <label class="lse-field">
                        <span class="lse-field-head"><span data-i18n="glowBlur"></span><span class="lse-val" data-val="glowBlur"></span></span>
                        <input class="lse-range" type="range" min="0" max="24" step="1" data-key="glowBlur">
                    </label>
                    <label class="lse-field">
                        <span class="lse-field-head"><span data-i18n="spread"></span><span class="lse-val" data-val="spread"></span></span>
                        <input class="lse-range" type="range" min="0.3" max="2.5" step="0.1" data-key="spread">
                    </label>
                    <label class="lse-field">
                        <span class="lse-field-head"><span data-i18n="opacity"></span><span class="lse-val" data-val="opacity"></span></span>
                        <input class="lse-range" type="range" min="0.2" max="1.0" step="0.05" data-key="opacity">
                    </label>
                </div>
                <div class="lse-colors-row">
                    <span style="font-size: 12px; color: #d1d5db;" data-i18n="shapeLabel"></span>
                    <select class="lse-select" data-shape>
                        <option value="circle" data-i18n="shapeCircle"></option>
                        <option value="star" data-i18n="shapeStar"></option>
                        <option value="diamond" data-i18n="shapeDiamond"></option>
                    </select>
                </div>
            </div>

            <div class="lse-card">
                <div class="lse-title" data-i18n="paletteTitle"></div>
                <div class="lse-colors-row" data-colors></div>
            </div>

            <div class="lse-footer">
                <span style="font-size: 11px; color: #9ca3af;" data-i18n="autoSaveNote"></span>
                <button type="button" class="lse-btn" data-reset data-i18n="resetBtn"></button>
            </div>
        `;

        const formatValue = (key, val) => {
            if (key === "particleSize" || key === "spread") return `${Number(val).toFixed(1)}x`;
            if (key === "opacity") return `${Math.round(Number(val) * 100)}%`;
            if (key === "glowBlur") return `${val}px`;
            return String(val);
        };

        const presetsContainer = panel.querySelector("[data-presets]");
        const colorsContainer = panel.querySelector("[data-colors]");
        const demoBtn = panel.querySelector("[data-demo-toggle]");
        const langBtn = panel.querySelector("[data-lang-toggle]");
        const shapeSelect = panel.querySelector("[data-shape]");

        const applyChange = () => {
            this.saveSettings();
        };

        const renderPresets = () => {
            const t = I18N[lang];
            presetsContainer.innerHTML = "";
            PRESETS.forEach(preset => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "lse-btn";
                btn.textContent = t[preset.key];
                btn.addEventListener("click", () => {
                    this.settings.glowColor = preset.glowColor;
                    this.settings.colors = preset.colors.map(c => ({ ...c }));
                    syncControlsFromSettings();
                    applyChange();
                });
                presetsContainer.appendChild(btn);
            });
        };

        const renderColorSlots = () => {
            const t = I18N[lang];
            colorsContainer.innerHTML = "";
            this.settings.colors.forEach((slot, idx) => {
                const wrap = document.createElement("label");
                wrap.className = "lse-color-slot";
                wrap.title = `${t.colorSlotTitle} ${idx + 1}`;

                const cb = document.createElement("input");
                cb.type = "checkbox";
                cb.checked = slot.enabled;
                cb.addEventListener("change", () => {
                    slot.enabled = cb.checked;
                    applyChange();
                });

                const picker = document.createElement("input");
                picker.type = "color";
                picker.className = "lse-color-input";
                picker.value = slot.hex;
                picker.addEventListener("input", () => {
                    slot.hex = picker.value;
                    applyChange();
                });

                wrap.append(cb, picker);
                colorsContainer.appendChild(wrap);
            });

            const glowWrap = document.createElement("label");
            glowWrap.className = "lse-color-slot";
            const glowSpan = document.createElement("span");
            glowSpan.style.fontSize = "12px";
            glowSpan.textContent = t.glowLabel;
            const glowPicker = document.createElement("input");
            glowPicker.type = "color";
            glowPicker.className = "lse-color-input";
            glowPicker.value = this.settings.glowColor;
            glowPicker.addEventListener("input", () => {
                this.settings.glowColor = glowPicker.value;
                applyChange();
            });
            glowWrap.append(glowSpan, glowPicker);
            colorsContainer.appendChild(glowWrap);
        };

        const applyLanguage = () => {
            const t = I18N[lang];
            panel.querySelectorAll("[data-i18n]").forEach(el => {
                const key = el.dataset.i18n;
                if (t[key]) el.textContent = t[key];
            });
            demoBtn.textContent = autoDemo ? t.autoDemoOn : t.autoDemoOff;
            langBtn.textContent = lang === "ru" ? "EN" : "RU";
            renderPresets();
            renderColorSlots();
        };

        const syncControlsFromSettings = () => {
            panel.querySelectorAll("[data-key]").forEach(input => {
                const key = input.dataset.key;
                input.value = this.settings[key];
                const label = panel.querySelector(`[data-val="${key}"]`);
                if (label) label.textContent = formatValue(key, this.settings[key]);
            });
            if (shapeSelect) shapeSelect.value = this.settings.shape;
            renderColorSlots();
        };

        panel.querySelectorAll("[data-key]").forEach(input => {
            input.addEventListener("input", () => {
                const key = input.dataset.key;
                this.settings[key] = parseFloat(input.value);
                const label = panel.querySelector(`[data-val="${key}"]`);
                if (label) label.textContent = formatValue(key, this.settings[key]);
                applyChange();
            });
        });

        shapeSelect.addEventListener("change", () => {
            this.settings.shape = shapeSelect.value;
            applyChange();
        });

        langBtn.addEventListener("click", () => {
            lang = lang === "ru" ? "en" : "ru";
            applyLanguage();
        });

        panel.querySelector("[data-reset]").addEventListener("click", () => {
            this.settings = cloneSettings(DEFAULT_SETTINGS);
            syncControlsFromSettings();
            applyChange();
        });

        applyLanguage();
        syncControlsFromSettings();

        // Live Preview Canvas inside settings modal
        const previewWrap = panel.querySelector(".lse-preview-wrap");
        const previewCanvas = panel.querySelector(".lse-preview-canvas");
        const previewCtx = previewCanvas.getContext("2d");

        let hoveringPreview = false;
        const previewParticles = [];
        let pLastX = 0;
        let pLastY = 0;
        let demoT = 0;
        let demoLastX = 0;
        let demoLastY = 0;
        let mountedOnce = false;

        demoBtn.addEventListener("click", () => {
            autoDemo = !autoDemo;
            demoBtn.classList.toggle("active", autoDemo);
            demoBtn.textContent = autoDemo ? I18N[lang].autoDemoOn : I18N[lang].autoDemoOff;
        });

        previewWrap.addEventListener("mouseenter", () => { hoveringPreview = true; });
        previewWrap.addEventListener("mouseleave", () => { hoveringPreview = false; });
        previewWrap.addEventListener("mousemove", (e) => {
            const rect = previewCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const dx = x - pLastX;
            const dy = y - pLastY;
            if (Math.hypot(dx, dy) > 4) {
                pLastX = x;
                pLastY = y;
                spawnParticlesAt(previewParticles, x, y, dx, dy, this.settings);
            }
        });

        const renderPreview = () => {
            if (previewCanvas.isConnected) {
                mountedOnce = true;
            } else if (mountedOnce) {
                return;
            }

            const rect = previewCanvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                if (previewCanvas.width !== Math.round(rect.width) || previewCanvas.height !== Math.round(rect.height)) {
                    previewCanvas.width = Math.round(rect.width);
                    previewCanvas.height = Math.round(rect.height);
                }

                if (autoDemo && !hoveringPreview) {
                    demoT += 0.045;
                    const cx = previewCanvas.width * 0.5 + Math.sin(demoT) * (previewCanvas.width * 0.32);
                    const cy = previewCanvas.height * 0.54 + Math.sin(demoT * 2) * (previewCanvas.height * 0.22);
                    const dx = cx - demoLastX;
                    const dy = cy - demoLastY;
                    if (Math.hypot(dx, dy) > 5) {
                        demoLastX = cx;
                        demoLastY = cy;
                        spawnParticlesAt(previewParticles, cx, cy, dx, dy, this.settings);
                    }
                }

                stepParticles(previewCtx, previewCanvas.width, previewCanvas.height, previewParticles, this.settings);
            }

            requestAnimationFrame(renderPreview);
        };

        requestAnimationFrame(renderPreview);
        return panel;
    }
};
