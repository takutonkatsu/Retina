// ▼ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAWQexxxlNCVlG3s-OMHMzDKI-XFL2X-wE",
  authDomain: "rgb-guessr-battle.firebaseapp.com",
  databaseURL: "https://rgb-guessr-battle-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rgb-guessr-battle",
  storageBucket: "rgb-guessr-battle.firebasestorage.app",
  messagingSenderId: "869975017002",
  appId: "1:869975017002:web:3de549898304a2c8e72553"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ▼ App Controller
const AppController = {
    alert: function(msg, callback) {
        document.getElementById('custom-alert-text').innerText = msg;
        const modal = document.getElementById('custom-alert-modal');
        modal.classList.remove('hidden');
        document.getElementById('custom-alert-ok').onclick = () => {
            modal.classList.add('hidden');
            if(callback) callback();
        };
    },

    confirm: function(msg, callback) {
        document.getElementById('custom-confirm-text').innerText = msg;
        const modal = document.getElementById('custom-confirm-modal');
        modal.classList.remove('hidden');
        document.getElementById('custom-confirm-yes').onclick = () => {
            modal.classList.add('hidden');
            callback(true);
        };
        document.getElementById('custom-confirm-no').onclick = () => {
            modal.classList.add('hidden');
            callback(false);
        };
    },

    showScreen: function(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(el => el.classList.remove('active'));
        const target = document.getElementById('screen-' + screenId);
        if(target) target.classList.add('active');
        
        const backBtn = document.getElementById('back-btn');
        if(backBtn) {
            if(screenId === 'menu') {
                backBtn.classList.add('hidden');
                MenuLogic.init(); 
            } else {
                backBtn.classList.remove('hidden');
            }
        }
        window.scrollTo(0, 0);

        if (['origin', 'rush', 'survival', 'versus', 'daily', 'anotherworld', 'menu'].includes(screenId)) {
            localStorage.setItem('current_screen', screenId);
        }
    },

    returnToMenu: function() {
        if(VersusGame.roomId) {
            VersusGame.confirmExit();
        } else {
            if (DailyGame.timerInterval) clearInterval(DailyGame.timerInterval);
            if (RushGame.timerInterval) clearInterval(RushGame.timerInterval);
            this.showScreen('menu');
        }
    },

    showPolicy: function() {
        const modal = document.getElementById('policy-modal');
        if (modal) modal.classList.remove('hidden');
    },

    startGameMode: function(mode) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'level_start', {
                'level_name': mode
            });
        }

        if(mode === 'versus') {
            this.showScreen('versus-menu');
            const savedName = localStorage.getItem("friend_name");
            if(savedName) document.getElementById('versus-name-input').value = savedName;
            return;
        }
        
        this.showScreen(mode);
        
        if(mode === 'origin') OriginGame.initialize();
        if(mode === 'survival') SurvivalGame.initialize();
        if(mode === 'rush') RushGame.initialize();
        if(mode === 'daily') DailyGame.initialize(); 
        if(mode === 'anotherworld') AnotherGame.initialize();
    }
};

// ▼ Utils
const Utils = {
    generateRandomColor: function() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return { r, g, b, hex: this.rgbToHex(r, g, b) };
    },
    rgbToHex: function(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    },
    hexToRgbString: function(hex) {
        let c = hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255].join(', ');
    },
    calculateScoreValue: function(target, input) {
        const index = 2; 
        const sq = (target.r - input.r) ** index + (target.g - input.g) ** index + (target.b - input.b) ** index;
        const base = Math.max((255 - target.r) ** index, target.r ** index) + 
                     Math.max((255 - target.g) ** index, target.g ** index) + 
                     Math.max((255 - target.b) ** index, target.b ** index);
        let accuracy = 1 - (sq / base); 
        if (accuracy < 0) accuracy = 0; 
        return accuracy * 100;
    },
    calculateScore: function(target, input) { 
        return this.calculateScoreValue(target, input).toFixed(2); 
    },
    getTodayString: function() {
        const d = new Date();
        const year = d.getFullYear();
        const month = ('0' + (d.getMonth() + 1)).slice(-2);
        const day = ('0' + d.getDate()).slice(-2);
        return `${year}${month}${day}`;
    },
    getFormattedDate: function() {
        const d = new Date();
        return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
    },
    seededRandom: function(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    },
    generateDailyColor: function(dateStr) {
        let hash = 5381;
        for (let i = 0; i < dateStr.length; i++) {
            hash = ((hash << 5) + hash) + dateStr.charCodeAt(i); 
        }
        const r = Math.floor(Math.abs(this.seededRandom(hash)) * 256);
        const g = Math.floor(Math.abs(this.seededRandom(hash + 1)) * 256);
        const b = Math.floor(Math.abs(this.seededRandom(hash + 2)) * 256);
        return { r, g, b, hex: this.rgbToHex(r, g, b) };
    },
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    escapeHtml: function(str) {
        if (!str) return str;
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
};

const MenuLogic = {
    init: function() {
        const today = new Date();
        const ymd = (today.getFullYear()-2024)*400 + today.getMonth()*31 + today.getDate();
        const savedDate = localStorage.getItem("date_key");
        if(savedDate != ymd) { localStorage.setItem("date_key", ymd); }

        this.displayDualRecord("my_1record", "my_ao5record", "menu-original-record");
        this.displayDualRecord("rush_best", null, "menu-rush-record");
        
        const stageRec = localStorage.getItem("4stage_record");
        const stageElem = document.getElementById("menu-survival-record");
        if(stageElem) { stageElem.innerHTML = stageRec ? `Max Stage: <span>${stageRec}</span>` : "Start: Stage 1"; }

        const ao5Rec = Number(localStorage.getItem("my_ao5record")) || 0;
        const logoEl = document.getElementById("app-logo");
        const iconHtml = `<img src="Retina_icon.png" alt="icon" class="logo-icon" id="source-logo-icon">`;
        
        if(logoEl) {
            let rankClass = ""; 
            if (ao5Rec >= 99.90) rankClass = "logo-rank-rainbow";
            else if (ao5Rec >= 99.50) rankClass = "logo-rank-gold";
            else if (ao5Rec >= 99.00) rankClass = "logo-rank-cyan";
            else if (ao5Rec >= 98.00) rankClass = "logo-rank-purple";
            else if (ao5Rec >= 95.00) rankClass = "logo-rank-red";
            else if (ao5Rec >= 90.00) rankClass = "logo-rank-blue";
            logoEl.innerHTML = `${iconHtml} <span class="logo-text ${rankClass}">Retina</span>`;
        }

        const todayStr = Utils.getTodayString();
        document.getElementById('menu-daily-date').innerText = Utils.getFormattedDate();
        
        const dailyColor = Utils.generateDailyColor(todayStr);
        const previewEl = document.getElementById('menu-daily-color-preview');
        if(previewEl) {
            previewEl.style.backgroundColor = dailyColor.hex;
        }

        const playedScore = localStorage.getItem("daily_score_" + todayStr);
        const statusEl = document.getElementById('menu-daily-status');
        if (playedScore) {
            statusEl.innerText = `SCORE: ${playedScore}%`;
            statusEl.className = "daily-status played";
        } else {
            statusEl.innerText = "PLAY NOW ►";
            statusEl.className = "daily-status";
        }
    },
    displayDualRecord: function(singleKey, ao5Key, elemId) {
        const sRec = localStorage.getItem(singleKey);
        const aRec = ao5Key ? localStorage.getItem(ao5Key) : null;
        const el = document.getElementById(elemId);
        if(el) {
            if(!sRec && !aRec) { el.innerText = "NO RECORD"; } else {
                let html = "";
                if(sRec) html += `Best: <span>${sRec}${ao5Key?"%":""}</span>`;
                if(sRec && aRec) html += " / ";
                if(aRec) html += `Ao5: <span>${aRec}%</span>`;
                el.innerHTML = html;
            }
        }
    }
};

// ▼ Game Modes

// Origin Mode
const OriginGame = {
    questionColor: {},
    initialize: function() {
        this.els = { R: document.getElementById('origin-R'), G: document.getElementById('origin-G'), B: document.getElementById('origin-B'), valR: document.getElementById('origin-val-R'), valG: document.getElementById('origin-val-G'), valB: document.getElementById('origin-val-B'), qColor: document.getElementById('origin-question-color') };
        const update = () => { this.els.valR.innerText = this.els.R.value; this.els.valG.innerText = this.els.G.value; this.els.valB.innerText = this.els.B.value; };
        this.els.R.oninput = update; this.els.G.oninput = update; this.els.B.oninput = update;
        document.getElementById('origin-guess-btn').onclick = () => this.submitGuess();
        document.getElementById('origin-new-record').classList.add('hidden');
        this.startNewRound(); this.updateHistoryLog();
    },
    startNewRound: function() {
        const savedHex = localStorage.getItem("RGB_Temporary_Hex");
        if(savedHex) { const r = Number(localStorage.getItem("RGB_Temporary_R")); const g = Number(localStorage.getItem("RGB_Temporary_G")); const b = Number(localStorage.getItem("RGB_Temporary_B")); this.questionColor = { r, g, b, hex: savedHex }; }
        else { this.questionColor = Utils.generateRandomColor(); localStorage.setItem("RGB_Temporary_Hex", this.questionColor.hex); localStorage.setItem("RGB_Temporary_R", this.questionColor.r); localStorage.setItem("RGB_Temporary_G", this.questionColor.g); localStorage.setItem("RGB_Temporary_B", this.questionColor.b); }
        this.els.qColor.style.backgroundColor = this.questionColor.hex; this.els.R.value = 128; this.els.G.value = 128; this.els.B.value = 128; this.els.R.oninput();
        document.getElementById('origin-new-record').classList.add('hidden');
    },
    proceedToNextColor: function() { localStorage.removeItem("RGB_Temporary_Hex"); this.startNewRound(); AppController.showScreen('origin'); },
    submitGuess: function() {
        const r = parseInt(this.els.R.value); const g = parseInt(this.els.G.value); const b = parseInt(this.els.B.value); const q = this.questionColor;
        const score = Utils.calculateScore(q, {r, g, b});
        let val = Number(localStorage.getItem("index")) || 1;
        localStorage.setItem("score"+val, score); localStorage.setItem("answer_rgb16"+val, q.hex); localStorage.setItem("input_rgb16"+val, Utils.rgbToHex(r,g,b));
        localStorage.setItem("answer_rgb"+val, `(${q.r},${q.g},${q.b})`); localStorage.setItem("input_rgb"+val, `(${r},${g},${b})`);
        
        let isNewRecord = false;
        const pb = Number(localStorage.getItem("my_1record")) || 0; 
        if(Number(score) > pb) { localStorage.setItem("my_1record", score); isNewRecord = true; } 

        if(val >= 5) {
            let scores = []; for(let i=0; i<5; i++) scores.push(Number(localStorage.getItem("score"+(val-i))));
            const max = Math.max(...scores); const min = Math.min(...scores); const sum = scores.reduce((a,b)=>a+b,0); 
            const ao5Val = (sum - max - min) / 3;
            const ao5 = ao5Val.toFixed(2);
            localStorage.setItem("Ao5"+val, ao5); 
            const ao5pb = Number(localStorage.getItem("my_ao5record")) || 0; 
            if(Number(ao5) > ao5pb) { localStorage.setItem("my_ao5record", ao5); isNewRecord = true; }
        }
        const recordEl = document.getElementById('origin-new-record');
        if(isNewRecord) recordEl.classList.remove('hidden'); else recordEl.classList.add('hidden');
        localStorage.setItem("index", val + 1); localStorage.removeItem("RGB_Temporary_Hex");
        this.displayResult(score, q, {r,g,b}); this.updateHistoryLog();
    },
    displayResult: function(score, q, input) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'level_end', {
                'level_name': 'origin',
                'score': score
            });
        }

        AppController.showScreen('result-origin'); 
        document.getElementById('origin-score').innerText = score + "%";
        document.getElementById('origin-ans-color').style.backgroundColor = q.hex; document.getElementById('origin-ans-text').innerText = `${q.r},${q.g},${q.b}`;
        document.getElementById('origin-your-color').style.backgroundColor = Utils.rgbToHex(input.r,input.g,input.b); document.getElementById('origin-your-text').innerText = `${input.r},${input.g},${input.b}`;
    },
    updateHistoryLog: function() {
        const val = Number(localStorage.getItem("index")) || 1; const pb = Number(localStorage.getItem("my_1record")) || 0; const bestAo5 = Number(localStorage.getItem("my_ao5record")) || 0;
        let html = "";
        for(let i = val - 1; i > 0; i--) {
            const sc = localStorage.getItem("score"+i); const ao5 = localStorage.getItem("Ao5"+i);
            const ansHex = localStorage.getItem("answer_rgb16"+i) || '#000'; const myHex = localStorage.getItem("input_rgb16"+i) || '#000';
            const ansTxt = localStorage.getItem("answer_rgb"+i) || ''; const myTxt = localStorage.getItem("input_rgb"+i) || '';
            let ao5Html = ao5 ? `<div class="history-ao5-badge ${Number(ao5)===bestAo5&&bestAo5>0?'highlight':''}">Ao5: ${ao5}%</div>` : `<div class="history-ao5-badge placeholder">Ao5: --.--%</div>`;
            let rowClass = "history-item"; let indexHtml = `<span class="history-index">#${i}</span>`;
            if(Number(sc) === pb && pb > 0) { rowClass += " best-record"; indexHtml = `<span class="history-index">👑</span>`; }
            html += `<div class="${rowClass}">${indexHtml}<div class="history-colors"><div class="color-row"><span class="label-box" style="color:#aaa">TARGET</span><span class="chip-xs" style="background:${ansHex}"></span><span>${ansTxt}</span></div><div class="color-row"><span class="label-box" style="color:#fff">YOU</span><span class="chip-xs" style="background:${myHex}"></span><span>${myTxt}</span></div></div><div class="history-right"><div class="history-score-val">${sc}%</div>${ao5Html}</div></div>`;
        }
        document.getElementById('origin-history').innerHTML = html;
        document.getElementById('origin-pb').innerText = (pb ? pb.toFixed(2) : "--") + "%"; 
        document.getElementById('origin-ao5').innerText = (bestAo5 ? bestAo5.toFixed(2) : "--") + "%";
    },
    clearSaveData: function() { 
        AppController.confirm("Originモードの記録を削除しますか？", (y)=>{ if(y){ const keys = Object.keys(localStorage); keys.forEach(k => { if (k === "index" || k.startsWith("score") || k.startsWith("answer_") || k.startsWith("input_") || k.startsWith("Ao5")) { localStorage.removeItem(k); } }); localStorage.removeItem("my_1record"); localStorage.removeItem("my_ao5record"); localStorage.removeItem("RGB_Temporary_Hex"); location.reload(); } }) 
    },
    
    generateShareImage: function() {
        const canvas = document.getElementById('share-canvas');
        const ctx = canvas.getContext('2d');
        const score = document.getElementById('origin-score').innerText;
        const val = Number(localStorage.getItem("index")) || 1;
        const count = val - 1; 
        
        const currentAo5 = localStorage.getItem("Ao5" + count) || "--";
        const ao5Text = currentAo5 === "--" ? "--" : currentAo5 + "%";
        
        const targetHex = this.questionColor.hex;
        const r = document.getElementById('origin-R').value;
        const g = document.getElementById('origin-G').value;
        const b = document.getElementById('origin-B').value;
        const inputHex = Utils.rgbToHex(Number(r), Number(g), Number(b));

        canvas.width = 1200;
        canvas.height = 800; 

        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);

        const img = document.getElementById('source-logo-icon');
        if (img && img.complete) { ctx.drawImage(img, 50, 50, 100, 100); }
        ctx.font = '900 64px "Inter", sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; 
        ctx.fillText("Retina", 180, 125);
        ctx.font = '700 32px "JetBrains Mono", monospace'; ctx.fillStyle = '#ff4757'; ctx.fillText("ORIGIN MODE", 900, 125);

        ctx.beginPath(); ctx.moveTo(60, 180); ctx.lineTo(1140, 180); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = '32px "JetBrains Mono", monospace'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'left'; ctx.fillText(`Attempt #${count}`, 60, 240);
        ctx.textAlign = 'right'; ctx.fillText(`Ao5: ${ao5Text}`, 1140, 240);

        ctx.font = '900 180px "Inter", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.fillText(score, 600, 440);
        ctx.font = '40px sans-serif'; ctx.fillStyle = '#8b9bb4'; ctx.fillText("SCORE", 600, 280);

        const drawColor = (x, y, color, label) => {
            ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#8b9bb4'; ctx.textAlign = 'center'; ctx.fillText(label, x, y - 110);
            ctx.save(); ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
            ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke(); ctx.restore();
            const rgbStr = Utils.hexToRgbString(color);
            ctx.font = '28px "JetBrains Mono", monospace'; ctx.fillStyle = '#fff'; ctx.fillText(rgbStr, x, y + 120);
        };
        drawColor(400, 620, targetHex, "TARGET");
        drawColor(800, 620, inputHex, "YOU");

        ctx.font = '24px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center'; 
        ctx.fillText("https://takutonkatsu.github.io/Retina/", 600, 770);

        canvas.toBlob(blob => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    'method': 'image',
                    'content_type': 'origin_result' 
                });
            }

            const file = new File([blob], "retina_origin.png", { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                const ao5Str = (currentAo5 === "--") ? "Ao5: --" : `Ao5: ${currentAo5}%`;
                navigator.share({ 
                    files: [file], 
                    title: 'Retina Result', 
                    text: `Retina - Origin Mode #${count}\nScore: ${score}\n${ao5Str}\n\n#Retina #色彩感覚 #RGB`
                }).catch(console.error);
            } else {
                const link = document.createElement('a'); link.download = `retina_origin_${count}.png`; link.href = canvas.toDataURL(); link.click();
            }
        });
    }
};


// Rush Mode (Updated with History & Max Combo Fix)
const RushGame = {
    timerInterval: null, timeLeft: 60, score: 0, 
    combo: 0, maxCombo: 0, // ★追加: 最大コンボ記録用
    questionColor: {}, count: 0, isPlaying: false,

    initialize: function() {
        this.els = { R: document.getElementById('rush-R'), G: document.getElementById('rush-G'), B: document.getElementById('rush-B'), valR: document.getElementById('rush-val-R'), valG: document.getElementById('rush-val-G'), valB: document.getElementById('rush-val-B'), qColor: document.getElementById('rush-question-color'), myColor: document.getElementById('rush-input-color'), timer: document.getElementById('rush-timer'), combo: document.getElementById('rush-combo-display'), currentScore: document.getElementById('rush-current-score') };
        const update = () => this.updateMyColor(); 
        this.els.R.oninput = update; this.els.G.oninput = update; this.els.B.oninput = update;
        document.getElementById('rush-guess-btn').onclick = () => this.submitGuess();
        AppController.showScreen('rush');
        this.startNewGame();
    },

    startNewGame: function() {
        this.isPlaying = true; this.timeLeft = 60; this.score = 0; 
        this.combo = 0; this.maxCombo = 0; // ★リセット
        this.count = 0;
        this.setNextColor(); this.updateUI();
        if(this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isPlaying) return;
            this.timeLeft -= 0.01;
            if (this.timeLeft <= 0) { this.timeLeft = 0; this.endGame(); }
            this.updateUI();
        }, 10);
    },

    setNextColor: function() {
        this.questionColor = Utils.generateRandomColor(); this.els.qColor.style.backgroundColor = this.questionColor.hex;
        this.els.R.value = Math.floor(Math.random() * 256); this.els.G.value = Math.floor(Math.random() * 256); this.els.B.value = Math.floor(Math.random() * 256);
        this.updateMyColor();
    },

    updateMyColor: function() {
        const r = parseInt(this.els.R.value); const g = parseInt(this.els.G.value); const b = parseInt(this.els.B.value);
        this.els.valR.innerText = r; this.els.valG.innerText = g; this.els.valB.innerText = b;
        this.els.myColor.style.backgroundColor = Utils.rgbToHex(r, g, b);
    },

    updateUI: function() {
        this.els.timer.innerText = this.timeLeft.toFixed(2); this.els.currentScore.innerText = Math.floor(this.score);
        if (this.combo > 1) { this.els.combo.classList.remove('hidden'); this.els.combo.innerText = `${this.combo} COMBO`; } else { this.els.combo.classList.add('hidden'); }
    },

    submitGuess: function() {
        if (!this.isPlaying) return;
        const r = parseInt(this.els.R.value); const g = parseInt(this.els.G.value); const b = parseInt(this.els.B.value);
        const acc = Utils.calculateScoreValue(this.questionColor, {r, g, b}); 
        let timeDelta = 0; let isBad = false;
        
        if (acc < 90) { 
            timeDelta = -5; 
            this.combo = 0; 
            isBad = true; 
        } else {
            if (acc >= 99) timeDelta = 5; else if (acc >= 98) timeDelta = 4; else if (acc >= 95) timeDelta = 2; else timeDelta = 0; 
            this.combo++; 
            // ★追加: 最大コンボ更新
            if(this.combo > this.maxCombo) this.maxCombo = this.combo;
            
            this.score += (acc * 10) + (this.combo * 50); 
            this.count++;
        }
        
        if (this.score >= 99999999) { this.score = 99999999; this.endGame(); return; }
        
        this.timeLeft += timeDelta; if (this.timeLeft < 0) this.timeLeft = 0; 
        this.triggerVisualEffect(timeDelta, isBad, acc.toFixed(2)+"%");
        if (this.timeLeft > 0) { this.setNextColor(); } else { this.endGame(); }
    },

    triggerVisualEffect: function(delta, isBad, accStr) {
        const container = document.getElementById('rush-effect-container');
        const el = document.createElement('div'); el.className = 'time-popup';
        let timeText = isBad ? "-5s" : (delta > 0 ? `+${delta}s` : "SAFE");
        let colorClass = isBad ? "bad" : (delta > 0 ? "good" : "safe");
        el.innerHTML = `<span class="popup-acc">${accStr}</span><br><span class="popup-time ${colorClass}">${timeText}</span>`;
        const rndX = (Math.random() - 0.5) * 60; const rndY = (Math.random() - 0.5) * 60;
        el.style.transform = `translate(${rndX}px, ${rndY}px)`;
        container.appendChild(el); setTimeout(() => el.remove(), 800);
    },

    endGame: function() {
        this.isPlaying = false; clearInterval(this.timerInterval);
        
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'level_end', {
                'level_name': 'rush',
                'score': Math.floor(this.score),
                'max_combo': this.maxCombo
            });
        }

        const finalScore = Math.floor(this.score);
        
        // ★追加: 履歴データの保存
        let val = Number(localStorage.getItem("rush_index")) || 1;
        localStorage.setItem("rush_score_" + val, finalScore);
        localStorage.setItem("rush_count_" + val, this.count);
        localStorage.setItem("rush_combo_" + val, this.maxCombo);
        localStorage.setItem("rush_index", val + 1);

        // ハイスコア更新チェック
        const currentBest = Number(localStorage.getItem('rush_best')) || 0;
        let isNewRecord = false;
        if (finalScore > currentBest) { 
            localStorage.setItem('rush_best', finalScore); 
            isNewRecord = true; 
        }

        AppController.showScreen('result-rush');
        document.getElementById('rush-final-score').innerText = finalScore;
        // ★修正: maxComboを表示
        document.getElementById('rush-max-combo').innerText = this.maxCombo; 
        document.getElementById('rush-count').innerText = this.count;
        
        const newRecordEl = document.getElementById('rush-new-record');
        if (isNewRecord) { newRecordEl.classList.remove('hidden'); } else { newRecordEl.classList.add('hidden'); }
        document.getElementById('rush-best').innerText = localStorage.getItem('rush_best') || 0;

        // ★追加: 履歴の表示更新
        this.updateHistoryLog();
    },

    // ★追加: 履歴ログ表示関数
    updateHistoryLog: function() {
        const list = document.getElementById('rush-history');
        if(!list) return;
        
        const val = Number(localStorage.getItem("rush_index")) || 1;
        const best = Number(localStorage.getItem('rush_best')) || 0;
        let html = "";
        
        // 新しい順に表示
        for(let i = val - 1; i > 0; i--) {
            const sc = Number(localStorage.getItem("rush_score_"+i));
            const cnt = localStorage.getItem("rush_count_"+i);
            const cmb = localStorage.getItem("rush_combo_"+i);
            
            let rowClass = "rush-history-item";
            let indexHtml = `<span class="history-index">#${i}</span>`;
            
            // ベストスコアの行をハイライト
            if(sc === best && best > 0) {
                rowClass += " best-record";
                indexHtml = `<span class="history-index">👑</span>`;
            }

            html += `
            <div class="${rowClass}">
                ${indexHtml}
                <div class="rush-stat-col">
                    <span class="rush-stat-label">CORRECT</span>
                    <span class="rush-stat-val">${cnt}</span>
                </div>
                <div class="rush-stat-col">
                    <span class="rush-stat-label">MAX COMBO</span>
                    <span class="rush-stat-val">${cmb}</span>
                </div>
                <div class="rush-stat-col">
                    <span class="rush-stat-val rush-score-val">${sc}</span>
                </div>
            </div>`;
        }
        list.innerHTML = html;
    },

    clearSaveData: function() { 
        AppController.confirm("Reset Rush Records?", (y) => { 
            if(y) { 
                // ★修正: 履歴データも全消去
                const val = Number(localStorage.getItem("rush_index")) || 1;
                for(let i=1; i<val; i++) {
                    localStorage.removeItem("rush_score_"+i);
                    localStorage.removeItem("rush_count_"+i);
                    localStorage.removeItem("rush_combo_"+i);
                }
                localStorage.removeItem("rush_index");
                localStorage.removeItem('rush_best'); 
                location.reload(); 
            } 
        }); 
    }
};

// Survival Mode (Unchanged)
const SurvivalGame = {
    aimScores: ["50.00", "60.00", "70.00", "75.00", "80.00", "85.00", "88.00", "90.00", "91.00", "92.00", "93.00", "94.00", "95.00", "95.50", "96.00", "96.50", "97.00", "97.50", "98.00", "98.50", "99.00", "99.30", "99.60", "99.90", "100.00"],
    currentStage: 1, questionColor: {},
    initialize: function() {
        this.els = { R: document.getElementById('survival-R'), G: document.getElementById('survival-G'), B: document.getElementById('survival-B'), valR: document.getElementById('survival-val-R'), valG: document.getElementById('survival-val-G'), valB: document.getElementById('survival-val-B'), sample: document.getElementById('survival-sample'), nextBtn: document.getElementById('survival-next-btn') };
        const update = () => { this.els.valR.innerText = this.els.R.value; this.els.valG.innerText = this.els.G.value; this.els.valB.innerText = this.els.B.value; };
        this.els.R.oninput = update; this.els.G.oninput = update; this.els.B.oninput = update;
        document.getElementById('survival-guess-btn').onclick = () => this.submitGuess();
        const savedStage = localStorage.getItem("4stage_number"); this.currentStage = savedStage ? Number(savedStage) : 1;
        document.getElementById('survival-new-record').classList.add('hidden');
        this.prepareStage(); this.updateHistoryLog();
    },
    prepareStage: function() {
        const stageStr = this.currentStage.toString().padStart(2, '0'); document.getElementById('survival-stage-num').innerText = stageStr; 
        document.getElementById('survival-aim-score').innerText = this.aimScores[this.currentStage - 1] + "%";
        const savedHex = localStorage.getItem("4RGB_Temporary_Hex");
        if(savedHex) { const r = Number(localStorage.getItem("4RGB_Temporary_R")); const g = Number(localStorage.getItem("4RGB_Temporary_G")); const b = Number(localStorage.getItem("4RGB_Temporary_B")); this.questionColor = { r,g,b, hex: savedHex }; }
        else { this.questionColor = Utils.generateRandomColor(); localStorage.setItem("4RGB_Temporary_Hex", this.questionColor.hex); localStorage.setItem("4RGB_Temporary_R", this.questionColor.r); localStorage.setItem("4RGB_Temporary_G", this.questionColor.g); localStorage.setItem("4RGB_Temporary_B", this.questionColor.b); }
        this.els.sample.style.backgroundColor = this.questionColor.hex; this.els.R.value = 128; this.els.G.value = 128; this.els.B.value = 128; this.els.R.oninput();
        document.getElementById('survival-new-record').classList.add('hidden');
    },
    submitGuess: function() {
        const r = parseInt(this.els.R.value); const g = parseInt(this.els.G.value); const b = parseInt(this.els.B.value); const q = this.questionColor;
        const score = Utils.calculateScore(q, {r, g, b});
        const target = this.aimScores[this.currentStage - 1]; 
        const isClear = Number(score) >= Number(target);
        
        AppController.showScreen('result-survival');
        const scoreText = document.getElementById('survival-score-text'); scoreText.innerText = isClear ? "Clear!" : "FAILED"; scoreText.style.color = isClear ? "var(--accent-green)" : "var(--accent-red)";
        document.getElementById('survival-result-score').innerText = score + "%"; document.getElementById('survival-result-goal').innerText = target + "%";
        document.getElementById('survival-ans-color').style.backgroundColor = q.hex; document.getElementById('survival-ans-text').innerText = `${q.r},${q.g},${q.b}`;
        document.getElementById('survival-your-color').style.backgroundColor = Utils.rgbToHex(r,g,b); document.getElementById('survival-your-text').innerText = `${r},${g},${b}`;
        localStorage.setItem("4answer_rgb16_"+this.currentStage, q.hex); localStorage.setItem("4input_rgb16_"+this.currentStage, Utils.rgbToHex(r,g,b));
        localStorage.setItem("4answer_rgb_"+this.currentStage, `(${q.r},${q.g},${q.b})`); localStorage.setItem("4input_rgb_"+this.currentStage, `(${r},${g},${b})`);
        
        const maxStage = Number(localStorage.getItem("4stage_record")) || 0;
        const recordEl = document.getElementById('survival-new-record');
        if(isClear && this.currentStage > maxStage) { recordEl.classList.remove('hidden'); } else { recordEl.classList.add('hidden'); }

        if(isClear) {
            this.els.nextBtn.innerHTML = '<span class="btn-icon">▶</span> NEXT STAGE';
            this.els.nextBtn.onclick = () => this.advanceStage();
            localStorage.setItem("4stage_number" + this.currentStage, score);
            if(this.currentStage > maxStage) { localStorage.setItem("4stage_record", this.currentStage); }
            this.currentStage++; localStorage.setItem("4stage_number", this.currentStage); localStorage.removeItem("4RGB_Temporary_Hex");
        } else {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'level_end', {
                    'level_name': 'survival',
                    'success': false,
                    'stage': this.currentStage
                });
            }
            this.els.nextBtn.innerHTML = '<span class="btn-icon">↻</span> RESTART';
            this.els.nextBtn.onclick = () => this.restartGame();
        }
        this.updateHistoryLog();
    },
    advanceStage: function() { 
        if(this.currentStage > 25) { 
            if (typeof gtag !== 'undefined') {
                gtag('event', 'level_end', {
                    'level_name': 'survival',
                    'success': true,
                    'stage': 25
                });
            }
        AppController.alert("ALL CLEAR! CONGRATULATIONS!", ()=>this.clearSaveData()); 
        return; 
    } this.prepareStage(); AppController.showScreen('survival'); },
    restartGame: function() {
        for(let i=1; i<=26; i++) { localStorage.removeItem("4stage_number"+i); localStorage.removeItem("4answer_rgb16_"+i); localStorage.removeItem("4input_rgb16_"+i); localStorage.removeItem("4answer_rgb_"+i); localStorage.removeItem("4input_rgb_"+i); }
        localStorage.setItem("4stage_number", 1); localStorage.removeItem("4RGB_Temporary_Hex"); this.currentStage = 1; this.prepareStage(); this.updateHistoryLog(); AppController.showScreen('survival');
    },
    updateHistoryLog: function() {
        const pb = localStorage.getItem("4stage_record"); document.getElementById('survival-pb').innerText = pb ? `${pb}` : "1";
        let html = "";
        for(let i = this.currentStage - 1; i >= 1; i--) {
            const sc = localStorage.getItem("4stage_number"+i); const goal = this.aimScores[i-1];
            const ansHex = localStorage.getItem("4answer_rgb16_"+i) || '#000'; const myHex = localStorage.getItem("4input_rgb16_"+i) || '#000';
            const ansTxt = localStorage.getItem("4answer_rgb_"+i) || ''; const myTxt = localStorage.getItem("4input_rgb_"+i) || '';
            if(sc) {
                const stNum = i.toString().padStart(2, '0');
                html += `<div class="history-item"><div class="history-index" style="width:auto; min-width:30px;"><span class="stage-badge-history">${stNum}</span></div><div class="history-colors"><div class="color-row"><span class="label-box" style="color:#aaa">TARGET</span><span class="chip-xs" style="background:${ansHex}"></span><span>${ansTxt}</span></div><div class="color-row"><span class="label-box" style="color:#fff">YOU</span><span class="chip-xs" style="background:${myHex}"></span><span>${myTxt}</span></div></div><div class="history-right"><div class="history-score-val">${sc}%</div><div class="history-goal-text">GOAL ${goal}%</div></div></div>`;
            }
        }
        document.getElementById('survival-history').innerHTML = html;
    },
    clearSaveData: function() { 
        AppController.confirm("Survivalモードの記録をリセットしますか？", (y)=>{ if(y) { this.restartGame(); localStorage.removeItem("4stage_record"); } }) 
    }
};

// Another World (Color Storage)
const AnotherGame = {
    initialize: function() {
        this.els = { R: document.getElementById('another-R'), G: document.getElementById('another-G'), B: document.getElementById('another-B'), valR: document.getElementById('another-val-R'), valG: document.getElementById('another-val-G'), valB: document.getElementById('another-val-B'), myColor: document.getElementById('another-input-color') };
        const update = () => this.updateMyColor(); 
        this.els.R.oninput = update; this.els.G.oninput = update; this.els.B.oninput = update;
        this.els.R.value = 128; this.els.G.value = 128; this.els.B.value = 128; 
        this.updateMyColor(); this.updateHistoryLog();
    },
    updateMyColor: function() {
        const r = parseInt(this.els.R.value); const g = parseInt(this.els.G.value); const b = parseInt(this.els.B.value);
        this.els.valR.innerText = r; this.els.valG.innerText = g; this.els.valB.innerText = b;
        this.els.myColor.style.backgroundColor = Utils.rgbToHex(r, g, b);
    },
    saveColorToStorage: function() {
        const r = parseInt(this.els.R.value); const g = parseInt(this.els.G.value); const b = parseInt(this.els.B.value);
        const hex = Utils.rgbToHex(r, g, b);
        let val = Number(localStorage.getItem("3index")) || 1;
        localStorage.setItem("3input_rgb16"+val, hex);
        localStorage.setItem("3input_rgb"+val, `(${r},${g},${b})`);
        localStorage.setItem("3date"+val, new Date().toLocaleString());
        localStorage.setItem("3index", val + 1);
        this.updateHistoryLog();
    },
// AnotherGame.updateHistoryLog の修正
    updateHistoryLog: function() {
        const list = document.getElementById('another-history'); 
        const val = Number(localStorage.getItem("3index")) || 1;
        let html = "";
        for(let i = val - 1; i > 0; i--) {
            const hex = localStorage.getItem("3input_rgb16"+i) || '#000'; 
            const txt = localStorage.getItem("3input_rgb"+i) || ''; 
            const date = localStorage.getItem("3date"+i) || '';
            // 変更: class="history-item storage-item" にして専用グリッドを適用
            html += `<div class="history-item storage-item">
                <span class="history-index">#${i}</span>
                <div class="history-colors">
                    <div class="color-row">
                        <span class="chip-xs" style="background:${hex}; width:20px; height:20px;"></span>
                        <span style="font-size:1rem; font-weight:bold; color:#fff;">${txt}</span>
                    </div>
                    <div style="font-size:0.7rem; color:#666; margin-top:2px;">${date}</div>
                </div>
                <button class="btn-share-icon" onclick="AnotherGame.shareSingleItem(${i})">📤</button>
                <button class="btn-delete" onclick="AnotherGame.deleteSingleItem(${i})">✕</button>
            </div>`;
        }
        list.innerHTML = html;
    },
    deleteSingleItem: function(targetIdx) {
        AppController.confirm("Delete this color?", (y) => {
            if(y) {
                const max = Number(localStorage.getItem("3index")) || 1;
                let items = [];
                for(let i=1; i<max; i++) {
                    if(i !== targetIdx) {
                        items.push({
                            hex: localStorage.getItem("3input_rgb16"+i),
                            txt: localStorage.getItem("3input_rgb"+i),
                            date: localStorage.getItem("3date"+i)
                        });
                    }
                }
                for(let i=1; i<max; i++) { localStorage.removeItem("3input_rgb16"+i); localStorage.removeItem("3input_rgb"+i); localStorage.removeItem("3date"+i); }
                items.forEach((item, idx) => {
                    let newIdx = idx + 1;
                    localStorage.setItem("3input_rgb16"+newIdx, item.hex);
                    localStorage.setItem("3input_rgb"+newIdx, item.txt);
                    localStorage.setItem("3date"+newIdx, item.date);
                });
                localStorage.setItem("3index", items.length + 1);
                this.updateHistoryLog();
            }
        });
    },
    
    shareSingleItem: function(index) {
        const hex = localStorage.getItem("3input_rgb16" + index);
        const rgbTxt = localStorage.getItem("3input_rgb" + index);
        const date = localStorage.getItem("3date" + index);
        
        if (!hex) return;

        const canvas = document.getElementById('share-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1200;
        canvas.height = 800;

        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);

        const img = document.getElementById('source-logo-icon');
        if (img && img.complete) { ctx.drawImage(img, 50, 50, 100, 100); }
        ctx.font = '900 64px "Inter", sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; 
        ctx.fillText("Retina", 180, 125); 
        ctx.font = '700 32px "JetBrains Mono", monospace'; ctx.fillStyle = '#8b9bb4'; ctx.fillText("COLOR STORAGE", 880, 125);

        ctx.beginPath(); ctx.moveTo(60, 180); ctx.lineTo(1140, 180); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.font = '32px "JetBrains Mono", monospace'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'left'; 
        ctx.fillText(`No. ${index}`, 60, 240);
        ctx.textAlign = 'right'; 
        ctx.fillText(date, 1140, 240);

        const centerX = 600;
        const centerY = 480; 
        ctx.save();
        ctx.beginPath(); 
        ctx.arc(centerX, centerY, 180, 0, Math.PI * 2); 
        ctx.fillStyle = hex; 
        ctx.fill();
        ctx.lineWidth = 10; 
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; 
        ctx.stroke(); 
        ctx.restore();

        // ★修正箇所: カンマの後にスペースを追加
        const rgbClean = rgbTxt.replace(/[()]/g, '').replace(/,/g, ', '); 
        ctx.font = '900 60px "Inter", sans-serif'; 
        ctx.fillStyle = '#ffffff'; 
        ctx.textAlign = 'center'; 
        ctx.fillText(rgbClean, centerX, centerY + 250); 

        ctx.font = '24px sans-serif'; 
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; 
        ctx.textAlign = 'center'; 
        ctx.fillText("https://takutonkatsu.github.io/Retina/", 600, 770);

        canvas.toBlob(blob => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    'method': 'image',
                    'content_type': 'color_storage_single'
                });
            }
            const file = new File([blob], `retina_color_${index}.png`, { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ 
                    files: [file], 
                    title: 'Retina Saved Color',
                    text: `Retina - Color Storage\nSaved Color: ${hex}\n\n#Retina #色彩感覚 #RGB`
                }).catch(console.error);
            } else {
                const link = document.createElement('a'); 
                link.download = `retina_color_${index}.png`; 
                link.href = canvas.toDataURL(); 
                link.click();
            }
        });
    },

    // RushGame に generateShareImage を追加
    generateShareImage: function() {
        const canvas = document.getElementById('share-canvas');
        const ctx = canvas.getContext('2d');
        const score = document.getElementById('rush-final-score').innerText;
        const count = document.getElementById('rush-count').innerText;
        const maxCombo = document.getElementById('rush-max-combo').innerText;
        
        // 試行回数（履歴インデックス）を取得
        const val = Number(localStorage.getItem("rush_index")) || 1;
        const attemptNum = val - 1; 

        canvas.width = 1200;
        canvas.height = 800; 

        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);

        const img = document.getElementById('source-logo-icon');
        if (img && img.complete) { ctx.drawImage(img, 50, 50, 100, 100); }
        ctx.font = '900 64px "Inter", sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; 
        ctx.fillText("Retina", 180, 125);
        
        // RUSH MODE (Green)
        ctx.font = '700 32px "JetBrains Mono", monospace'; ctx.fillStyle = '#2ed573'; ctx.fillText("RUSH MODE", 940, 125);

        ctx.beginPath(); ctx.moveTo(60, 180); ctx.lineTo(1140, 180); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.font = '32px "JetBrains Mono", monospace'; ctx.fillStyle = '#aaa'; ctx.textAlign = 'left'; ctx.fillText(`Attempt #${attemptNum}`, 60, 240);

        // SCORE
        ctx.font = '900 180px "Inter", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.fillText(score, 600, 440);
        ctx.font = '40px sans-serif'; ctx.fillStyle = '#8b9bb4'; ctx.fillText("SCORE", 600, 280);

        // Sub Stats (Correct / Combo)
        const drawStat = (x, label, val) => {
            ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#8b9bb4'; ctx.textAlign = 'center'; ctx.fillText(label, x, 560);
            ctx.font = 'bold 60px "JetBrains Mono", monospace'; ctx.fillStyle = '#fff'; ctx.fillText(val, x, 630);
        };
        drawStat(400, "CORRECT", count);
        drawStat(800, "MAX COMBO", maxCombo);

        ctx.font = '24px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center'; 
        ctx.fillText("https://takutonkatsu.github.io/Retina/", 600, 770);

        canvas.toBlob(blob => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    'method': 'image',
                    'content_type': 'rush_result' 
                });
            }

            const file = new File([blob], "retina_rush.png", { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ 
                    files: [file], 
                    title: 'Retina Rush Result', 
                    text: `Retina - Rush Mode #${attemptNum}\nScore: ${score}\n\n#Retina #色彩感覚 #RGB`
                }).catch(console.error);
            } else {
                const link = document.createElement('a'); link.download = `retina_rush_${attemptNum}.png`; link.href = canvas.toDataURL(); link.click();
            }
        });
    },
    clearSaveData: function() { 
        AppController.confirm("保存した色をすべて消去しますか？", (y)=>{ 
            if(y){ 
                const val = Number(localStorage.getItem("3index")) || 1;
                for(let i=1; i<val; i++) { localStorage.removeItem("3input_rgb16"+i); localStorage.removeItem("3input_rgb"+i); localStorage.removeItem("3date"+i); }
                localStorage.removeItem("3index");
                this.updateHistoryLog();
            } 
        });
    }
};

// Daily Game Mode
const DailyGame = {
    targetColor: {}, dateStr: "", timerInterval: null, els:{},
    initialize: function() {
        if(this.timerInterval) clearInterval(this.timerInterval);
        this.els = { R: document.getElementById('daily-R'), G: document.getElementById('daily-G'), B: document.getElementById('daily-B'), valR: document.getElementById('daily-val-R'), valG: document.getElementById('daily-val-G'), valB: document.getElementById('daily-val-B'), qColor: document.getElementById('daily-question-color') };
        
        const guessBtn = document.getElementById('daily-guess-btn');
        if(guessBtn) guessBtn.onclick = () => this.submitGuess();

        this.dateStr = Utils.getTodayString();
        this.targetColor = Utils.generateDailyColor(this.dateStr);
        
        const playedScore = localStorage.getItem("daily_score_" + this.dateStr);
        if (playedScore) {
            const savedInputHex = localStorage.getItem("daily_input_hex_" + this.dateStr) || "#000000";
            this.displayResult(playedScore, this.targetColor, savedInputHex);
            return;
        }

        const update = () => { this.els.valR.innerText = this.els.R.value; this.els.valG.innerText = this.els.G.value; this.els.valB.innerText = this.els.B.value; };
        this.els.R.oninput = update; this.els.G.oninput = update; this.els.B.oninput = update;
        
        this.els.R.value = 128; this.els.G.value = 128; this.els.B.value = 128; 
        update();
        document.getElementById('daily-date-display').innerText = Utils.getFormattedDate();
        this.els.qColor.style.backgroundColor = this.targetColor.hex;
    },

    submitGuess: function() {
        const r = parseInt(this.els.R.value); const g = parseInt(this.els.G.value); const b = parseInt(this.els.B.value);
        const score = Utils.calculateScore(this.targetColor, {r, g, b});
        localStorage.setItem("daily_score_" + this.dateStr, score);
        localStorage.setItem("daily_input_hex_" + this.dateStr, Utils.rgbToHex(r, g, b));
        this.displayResult(score, this.targetColor, Utils.rgbToHex(r, g, b));
    },

    displayResult: function(score, target, inputHex) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'level_end', {
                'level_name': 'daily',
                'score': score
            });
        }

        if(this.timerInterval) clearInterval(this.timerInterval);
        AppController.showScreen('result-daily');
        document.getElementById('daily-res-date').innerText = Utils.getFormattedDate();
        document.getElementById('daily-score').innerText = score + "%";
        document.getElementById('daily-ans-color').style.backgroundColor = target.hex;
        document.getElementById('daily-ans-text').innerText = `${target.r}, ${target.g}, ${target.b}`; 
        document.getElementById('daily-your-color').style.backgroundColor = inputHex;
        document.getElementById('daily-your-text').innerText = Utils.hexToRgbString(inputHex);
        this.startTimer();
    },

    startTimer: function() {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const diff = tomorrow - now;
            if (diff <= 0) { document.getElementById('daily-next-timer').innerText = "Refresh to Play!"; return; }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            const timerEl = document.getElementById('daily-next-timer');
            if(timerEl) timerEl.innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        };
        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    },

    generateShareImage: function() {
        const canvas = document.getElementById('share-canvas');
        const ctx = canvas.getContext('2d');
        const dateText = Utils.getFormattedDate();
        const score = document.getElementById('daily-score').innerText;
        const targetHex = this.targetColor.hex;
        const savedInputHex = localStorage.getItem("daily_input_hex_" + this.dateStr) || "#000000";
        
        canvas.width = 1200;
        canvas.height = 800;

        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);

        const img = document.getElementById('source-logo-icon');
        if (img && img.complete) { ctx.drawImage(img, 50, 50, 100, 100); }
        ctx.font = '900 64px "Inter", sans-serif'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; 
        ctx.fillText("Retina", 180, 125); 
        
        ctx.font = '700 32px "JetBrains Mono", monospace'; ctx.fillStyle = '#ffd700'; 
        ctx.textAlign = 'right';
        ctx.fillText("DAILY COLOR", 1140, 125);

        ctx.beginPath(); ctx.moveTo(60, 180); ctx.lineTo(1140, 180); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.font = '700 48px "JetBrains Mono", monospace'; 
        ctx.fillStyle = '#eee'; 
        ctx.textAlign = 'center'; 
        ctx.fillText(dateText, 600, 260); 

        ctx.font = '900 180px "Inter", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.fillText(score, 600, 440);
        
        const drawColor = (x, y, color, label) => {
            ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#8b9bb4'; ctx.textAlign = 'center'; ctx.fillText(label, x, y - 110);
            ctx.save(); ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
            ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke(); ctx.restore();
        };
        drawColor(400, 620, targetHex, "TARGET");
        drawColor(800, 620, savedInputHex, "YOU");

        ctx.font = '24px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center'; 
        ctx.fillText("https://takutonkatsu.github.io/Retina/", 600, 770);

        canvas.toBlob(blob => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'share', {
                    'method': 'image',
                    'content_type': 'daily_result' 
                });
            }
            const file = new File([blob], "retina_daily.png", { type: "image/png" });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ 
                    files: [file], 
                    title: 'Retina Daily Result', 
                    text: `Retina - Daily Color ${dateText}\nScore: ${score}\n\n#Retina #色彩感覚 #RGB` 
                }).catch(console.error);
            } else {
                const link = document.createElement('a'); link.download = `retina_daily_${dateText}.png`; link.href = canvas.toDataURL(); link.click();
            }
        });
    }
};


// ▼ Utils (Add ID generator)
Utils.generateId = function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ▼ VERSUS MODE (Unified 2-4 Players) - Fixed Logic
const VersusGame = {
    roomId: null, role: null, roomRef: null,
    myName: "Player", currentRound: 0, inviteRoomId: null,
    resultData: null, 
    cachedPlayers: {}, 
    myId: null,

    createRoom: function() {
        const name = document.getElementById('versus-name-input').value.trim();
        if(!name) return AppController.alert("Please enter your name.");
        
        let maxWins = parseInt(document.getElementById('versus-goal-input').value);
        
        // ★修正: 1未満や無効な値は「5」に、99超は「99」に強制
        if (isNaN(maxWins) || maxWins < 1) maxWins = 5;
        if (maxWins > 99) maxWins = 99;

        localStorage.setItem("friend_name", name);
        this.myName = name; 
        this.role = 'p1';
        this.myId = Utils.generateId();
        this.currentRound = 0;
        this.resultData = null; 
        this.cachedPlayers = {}; 
        
        this.tryCreateUniqueRoom(maxWins);
    },

    tryCreateUniqueRoom: function(maxWins) {
        const tempId = Math.floor(1000 + Math.random() * 9000).toString();
        db.ref('rooms_versus/' + tempId).once('value').then(snapshot => {
            if (snapshot.exists()) {
                // ID conflict, retry
                this.tryCreateUniqueRoom(maxWins);
            } else {
                // Available
                this.roomId = tempId;
                this.roomRef = db.ref('rooms_versus/' + this.roomId);
                this.setupNewRoom(maxWins);
            }
        });
    },

    setupNewRoom: function(maxWins) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'level_start', {
                'level_name': 'versus_create'
            });
        }

        this.roomRef.set({
            state: 'waiting', question: Utils.generateRandomColor(), round: 1, maxWins: maxWins, 
            players: {
                p1: { name: this.myName, score: 0, status: 'waiting', id: this.myId },
                p2: { name: '', score: 0, status: 'empty' },
                p3: { name: '', score: 0, status: 'empty' },
                p4: { name: '', score: 0, status: 'empty' }
            },
            winner: null
        });
        
        this.roomRef.child('players/p1').onDisconnect().update({ name: '', score: 0, status: 'empty' });
        
        this.listenToRoom();
        document.getElementById('versus-room-id-display').innerText = this.roomId;
        AppController.showScreen('versus-lobby');
    },

    displayJoinScreen: function() {
        const name = document.getElementById('versus-name-input').value.trim();
        if(!name) return AppController.alert("Please enter your name.");
        localStorage.setItem("friend_name", name); this.myName = name;
        AppController.showScreen('versus-join');
        
        if (this.inviteRoomId) {
            document.getElementById('versus-room-input').value = this.inviteRoomId;
            this.inviteRoomId = null;
        }
    },

    joinRoom: function() {
        const inputEl = document.getElementById('versus-room-input');
        const inputId = inputEl.value;
        if(!/^\d{4}$/.test(inputId)) return AppController.alert("Enter 4-digit ID");
        
        const joinBtn = document.querySelector('#screen-versus-join .main-action-btn');
        joinBtn.disabled = true;

        this.roomId = inputId;
        this.roomRef = db.ref('rooms_versus/' + this.roomId);
        this.currentRound = 0;
        this.resultData = null; 
        this.cachedPlayers = {}; 
        this.myId = Utils.generateId();

        AppController.showScreen('versus-lobby');
        document.getElementById('versus-room-id-display').innerText = this.roomId;
        document.getElementById('versus-status-text').innerText = "Connecting...";
        
        this.roomRef.once('value').then(snapshot => {
            if(snapshot.exists()) {
                const data = snapshot.val();

                const activeCount = Object.values(data.players).filter(p => p.status !== 'empty').length;
                if (activeCount === 0) {
                    this.roomRef.remove();
                    AppController.alert("Room expired.", () => { AppController.showScreen('versus-menu'); });
                    joinBtn.disabled = false;
                    return;
                }
                
                if (data.state !== 'waiting') {
                    AppController.alert("Game already started!", () => { AppController.showScreen('versus-join'); });
                    joinBtn.disabled = false;
                    return;
                }

                if (data.players.p2.status === 'empty') this.role = 'p2';
                else if (data.players.p3.status === 'empty') this.role = 'p3';
                else if (data.players.p4.status === 'empty') this.role = 'p4';
                else {
                    AppController.alert("Room is full (4/4)", () => { AppController.showScreen('versus-join'); });
                    joinBtn.disabled = false;
                    return;
                }
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'join_group', {
                        'group_id': this.roomId
                    });
                }

                this.roomRef.child(`players/${this.role}`).update({ name: this.myName, score: 0, status: 'waiting', id: this.myId });
                this.roomRef.child(`players/${this.role}`).onDisconnect().update({ name: '', score: 0, status: 'empty' });
                this.listenToRoom();
                joinBtn.disabled = false;
            } else { 
                AppController.alert("Room not found", () => { AppController.showScreen('versus-join'); });
                joinBtn.disabled = false;
            }
        }).catch(() => {
            AppController.alert("Connection Error", () => { AppController.showScreen('versus-join'); });
            joinBtn.disabled = false;
        });
    },

    listenToRoom: function() {
        this.roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if(!data) { AppController.alert("Connection lost / Room closed", () => { this.exitRoom(true); }); return; }

            if (data.players) {
                const mySlot = Object.keys(data.players).find(k => data.players[k].id === this.myId);
                if (mySlot && mySlot !== this.role) {
                    this.roomRef.child(`players/${this.role}`).onDisconnect().cancel();
                    
                    this.role = mySlot;
                    
                    this.roomRef.child(`players/${this.role}`).onDisconnect().update({ name: '', score: 0, status: 'empty' });
                }
            }

            if (data.players) {
                Object.keys(data.players).forEach(key => {
                    const p = data.players[key];
                    if (p.status !== 'empty' && p.name) {
                        this.cachedPlayers[key] = JSON.parse(JSON.stringify(p));
                    }
                });
            }
            
            const activeKeys = Object.keys(data.players).filter(k => data.players[k].status !== 'empty');
            const leaderKey = activeKeys[0]; 
            
            if (data.state === 'waiting' && this.role === leaderKey) {
                const correctOrderKeys = ['p1', 'p2', 'p3', 'p4'];
                let needsUpdate = false;
                let updates = {};

                const currentActivePlayers = correctOrderKeys
                    .map(k => data.players[k])
                    .filter(p => p.status !== 'empty');

                correctOrderKeys.forEach((key, index) => {
                    if (index < currentActivePlayers.length) {
                        const shouldBeHere = currentActivePlayers[index];
                        if (data.players[key].id !== shouldBeHere.id) {
                            updates[`players/${key}`] = shouldBeHere;
                            needsUpdate = true;
                        }
                    } else {
                        if (data.players[key].status !== 'empty') {
                            updates[`players/${key}`] = { name: '', score: 0, status: 'empty' };
                            needsUpdate = true;
                        }
                    }
                });

                if (needsUpdate) {
                    this.roomRef.update(updates);
                    return; 
                }
            }

            if (data.state === 'finished') {
                
                if (!this.resultData) {
                    let finalData = JSON.parse(JSON.stringify(data));
                    this.resultData = finalData;
                }
                this.showResult(this.resultData, data); 
                return;
            } else {
                this.resultData = null;
            }

            let activeCount = activeKeys.length;

            const goal = data.maxWins || 5;
            const isGameSet = Object.values(data.players).some(p => p.score >= goal && p.status !== 'empty');

            if (!isGameSet && data.state !== 'waiting' && activeCount < 2) {
                AppController.alert("Everyone left the game...", () => { this.exitRoom(); });
                return;
            }
            
            if (data.state === 'waiting' && document.getElementById('screen-versus-result').classList.contains('active')) {
                 AppController.showScreen('versus-lobby');
            }

            // ★修正: エンドレスモードの分岐を削除し、常に勝利数を表示
            const goalText = `First to ${data.maxWins} Wins`;
            document.getElementById('versus-lobby-goal').innerText = `GOAL: ${goalText}`;

            ['p1', 'p2', 'p3', 'p4'].forEach((key, i) => {
                const el = document.getElementById(`versus-${key}-name`);
                const p = data.players[key];
                let label = (key === 'p1') ? "Host" : `Guest ${parseInt(key.charAt(1)) - 1}`;
                if (key === 'p1') label = "Host";
                
                if (p.status !== 'empty') {
                    el.innerText = `${label}: ${p.name}`;
                    el.style.color = "#fff";
                } else {
                    el.innerText = `${label}: ---`;
                    el.style.color = "#666";
                }
            });

            document.getElementById('versus-status-text').innerText = `Waiting for players (${activeCount}/4)...`;

            const startArea = document.getElementById('host-start-area');
            if (this.role === 'p1' && data.state === 'waiting') {
                if (activeCount >= 2) startArea.classList.remove('hidden');
                else startArea.classList.add('hidden');
            } else {
                startArea.classList.add('hidden');
            }

            if (data.state === 'playing') {
                if(!document.getElementById('screen-versus-battle').classList.contains('active')) {
                    this.startRound(data);
                } else if (this.currentRound !== data.round) {
                    this.startRound(data);
                }

                let waitingCount = 0;
                activeKeys.forEach(k => {
                    if (data.players[k].status !== 'guessed') waitingCount++;
                });
                
                const statusEl = document.getElementById('versus-opponent-status');
                if (waitingCount === 0) {
                    statusEl.innerText = "All players answered!";
                    statusEl.style.background = "rgba(255, 71, 87, 0.2)"; 
                    statusEl.style.color = "#ff4757";
                } else {
                    statusEl.innerText = `${waitingCount} player(s) thinking...`;
                    statusEl.style.background = "rgba(156, 136, 255, 0.1)"; 
                    statusEl.style.color = "var(--primary-multi)";
                }

                if (this.role === leaderKey && waitingCount === 0) {
                    this.calcResult(data);
                }
            }
        });
    },

    hostStartGame: function() { 
        this.roomRef.update({ state: 'playing' }); 
    },

    startRound: function(data) {
        if (this.currentRound === data.round && document.getElementById('screen-versus-battle').classList.contains('active')) return;
        AppController.showScreen('versus-battle');
        document.getElementById('versus-wait-msg').classList.add('hidden');
        document.getElementById('versus-guess-btn').classList.remove('hidden');
        const update = () => this.updateColor();
        document.getElementById('versus-R').oninput = update; document.getElementById('versus-G').oninput = update; document.getElementById('versus-B').oninput = update;
        this.currentRound = data.round;
        const q = data.question;
        document.getElementById('versus-R').value = 128; document.getElementById('versus-G').value = 128; document.getElementById('versus-B').value = 128;
        this.updateColor();
        document.getElementById('versus-round-display').innerText = "Round " + data.round;
        document.getElementById('versus-question-color').style.backgroundColor = q.hex; 
    },
    updateColor: function() {
        const r = document.getElementById('versus-R').value; const g = document.getElementById('versus-G').value; const b = document.getElementById('versus-B').value;
        document.getElementById('versus-val-R').innerText = r; document.getElementById('versus-val-G').innerText = g; document.getElementById('versus-val-B').innerText = b;
    },
    submitGuess: function() {
        const r = parseInt(document.getElementById('versus-R').value); const g = parseInt(document.getElementById('versus-G').value); const b = parseInt(document.getElementById('versus-B').value);
        this.roomRef.child(`players/${this.role}`).update({ color: {r, g, b, hex: Utils.rgbToHex(r,g,b)}, status: 'guessed' });
        document.getElementById('versus-guess-btn').classList.add('hidden');
        document.getElementById('versus-wait-msg').classList.remove('hidden');
    },
    calcResult: function(data) {
        const q = data.question; let updates = {}; let scores = [];
        Object.keys(data.players).forEach(key => {
            const p = data.players[key];
            if (p.status !== 'empty') {
                const roundScore = Utils.calculateScoreValue(q, p.color);
                scores.push({ key: key, score: roundScore });
                updates[`players/${key}/lastScore`] = roundScore.toFixed(2);
            }
        });
        if (scores.length > 0) {
            scores.sort((a, b) => b.score - a.score); const maxScore = scores[0].score;
            scores.forEach(s => { if (s.score === maxScore) { const currentWins = data.players[s.key].score || 0; updates[`players/${s.key}/score`] = currentWins + 1; } });
        }
        updates['state'] = 'finished';
        this.roomRef.update(updates);
    },
    
    shareInviteLink: function() {
        if (!this.roomId) return;
        const url = new URL(window.location.href);
        url.searchParams.set('room', this.roomId);
        
        const shareData = {
            title: 'Retina Versus',
            text: 'Join my Retina Versus Room!',
            url: url.toString()
        };

        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            navigator.clipboard.writeText(url.toString()).then(() => {
                AppController.alert("Invite link copied!");
            });
        }
    },
    
    voteContinue: function() { 
        const btn = document.getElementById('versus-continue-btn'); 
        btn.disabled = true; 
        btn.innerText = "WAITING..."; 
        btn.style.background = "#555"; 
        btn.style.opacity = "0.7"; 
        this.roomRef.child(`players/${this.role}`).update({ status: 'ready' }); 
    },

    nextRound: function(nextRoundNum) { 
        this.roomRef.once('value').then(snap => { 
            const d = snap.val(); 
            let updates = {}; 
            updates['question'] = Utils.generateRandomColor(); 
            updates['round'] = nextRoundNum; 
            updates['state'] = 'playing'; 
            Object.keys(d.players).forEach(key => { 
                if (d.players[key].status !== 'empty') { updates[`players/${key}/status`] = 'thinking'; } 
            }); 
            this.roomRef.update(updates); 
        }); 
    },

    confirmExit: function() { AppController.confirm("Exit Room?", (y) => { if(y) this.exitRoom(); }); },
    exitRoom: function(isPassive) { 
        if(this.roomRef && !isPassive) { 
            this.roomRef.off(); 
            if (this.role) { 
                this.roomRef.child(`players/${this.role}`).update({ name: '', score: 0, status: 'empty' }); 
            } 
        } 
        this.roomId = null; 
        AppController.showScreen('menu'); 
    },

    showResult: function(data, liveData) { 
        if(!document.getElementById('screen-versus-result').classList.contains('active')) { AppController.showScreen('versus-result'); }
        
        const logicData = liveData || data; 
        const q = data.question; 
        const myKey = this.role;
        const goal = data.maxWins || 5;

        const isGameSet = Object.values(data.players).some(p => p.score >= goal);
        
        let activePlayers = [];
        Object.keys(data.players).forEach(key => {
            const p = data.players[key];
            const liveP = logicData.players ? logicData.players[key] : null;

            if (p.name) {
                if (!isGameSet && (!liveP || liveP.status === 'empty')) {
                    return;
                }

                activePlayers.push({ 
                    key: key, 
                    name: p.name, 
                    score: p.lastScore || "0.00", 
                    wins: p.score, 
                    color: p.color || {r:0,g:0,b:0,hex:'#000'}, 
                    me: (key === myKey) 
                });
            }
        });
        activePlayers.sort((a, b) => Number(b.score) - Number(a.score));

        let currentRank = 1;
        for (let i = 0; i < activePlayers.length; i++) {
            if (i > 0 && Number(activePlayers[i].score) < Number(activePlayers[i-1].score)) {
                currentRank = i + 1;
            }
            activePlayers[i].rank = currentRank;
        }

        const resultContainer = document.getElementById('versus-result-container');
        let html = `<div class="res-grid-container players-${activePlayers.length}">`;
        activePlayers.forEach((p) => {
            let rankClass = p.rank === 1 ? 'rank-1st' : (p.rank === 2 ? 'rank-2nd' : (p.rank === 3 ? 'rank-3rd' : ''));
            let rankText = p.rank === 1 ? '1st' : (p.rank === 2 ? '2nd' : (p.rank === 3 ? '3rd' : p.rank+'th'));
            html += `<div class="res-grid-box"><span class="res-grid-rank ${rankClass}">${rankText}</span><span class="res-grid-score">${p.score}%</span><span class="res-grid-name">${Utils.escapeHtml(p.name)}</span>${p.me ? '<span class="res-you-badge">(YOU)</span>' : ''}<div class="res-win-badge"><span style="font-size:0.7rem; color:#aaa;">WINS</span><span style="font-size:1.2rem; color:#fff; font-weight:bold;">${p.wins}</span></div></div>`;
        });
        html += '</div>';
        resultContainer.innerHTML = html;
        
        const title = document.getElementById('versus-result-title');
        const myData = activePlayers.find(p => p.me);
        if (myData) {
            if (myData.rank === 1) { title.innerText = "WINNER!"; title.style.color = "var(--accent-gold)"; }
            else if (myData.rank === 2) { title.innerText = "2nd PLACE"; title.style.color = "#c0c0c0"; }
            else if (myData.rank === 3) { title.innerText = "3rd PLACE"; title.style.color = "#cd7f32"; }
            else { title.innerText = myData.rank + "th PLACE"; title.style.color = "#fff"; }
        }

        // ★修正: ∞表示のロジックを削除
        document.getElementById('versus-goal-val').innerText = goal;
        document.getElementById('versus-ans-color').style.backgroundColor = q.hex; 
        document.getElementById('versus-ans-text').innerText = `${q.r}, ${q.g}, ${q.b}`;
        
        const playersCompContainer = document.getElementById('versus-players-compare');
        playersCompContainer.className = "multi-players-wrapper flex-row"; 

        let compareHtml = ''; 
        let sortedByKey = [...activePlayers].sort((a, b) => a.key.localeCompare(b.key));
        sortedByKey.forEach(p => { 
            compareHtml += `<div class="multi-compare-item"><p class="multi-compare-label">${Utils.escapeHtml(p.name)}</p><div class="mini-box" style="background:${p.color.hex}"></div><span class="rgb-value-text">${p.color.r},${p.color.g},${p.color.b}</span></div>`; 
        });
        playersCompContainer.innerHTML = compareHtml;
        
        let champions = [];
        if (goal > 0) {
            const goalReachers = activePlayers.filter(p => p.wins >= goal);
            if (goalReachers.length > 0) {
                const maxWins = Math.max(...goalReachers.map(p => p.wins));
                champions = goalReachers.filter(p => p.wins === maxWins);
            }
        }

        const winDeclare = document.getElementById('versus-final-winner');
        const btn = document.getElementById('versus-continue-btn'); 
        const exitBtn = document.getElementById('versus-exit-btn');
        const contMsg = document.getElementById('versus-continue-status');

        if (champions.length > 0) {
            winDeclare.classList.remove('hidden'); 
            const names = champions.map(p => p.name).join(" & ");
            winDeclare.innerText = `🏆 ${names} WIN THE GAME! 🏆`; 
            title.innerText = "GAME SET"; title.style.color = "#fff";
            
            btn.innerHTML = 'RETURN TO MENU';
            btn.disabled = false;
            btn.className = "btn-primary btn-return";
            btn.style.background = ""; 
            btn.onclick = () => this.exitRoom();
            
            if(exitBtn) exitBtn.classList.add('hidden');
            
            contMsg.innerText = "Thanks for playing!";
        } else {
            winDeclare.classList.add('hidden'); 
            if(exitBtn) exitBtn.classList.remove('hidden');

            btn.innerHTML = '<span class="btn-icon">▶</span> CONTINUE';
            btn.className = "btn-primary"; 
            btn.style.background = "";
            btn.onclick = () => this.voteContinue();

            if (logicData.players[this.role].status === 'ready') { 
                btn.disabled = true; 
                btn.innerText = "WAITING..."; 
                btn.style.background = "#555"; 
                btn.style.opacity = "0.7"; 
            } else { 
                btn.disabled = false; 
                btn.innerText = "CONTINUE"; 
                btn.style.background = "var(--primary-multi)"; 
                btn.style.opacity = "1"; 
            }
            
            let readyCount = 0; 
            let currentRoomMembers = 0;
             Object.keys(logicData.players).forEach(key => {
                if (logicData.players[key].status !== 'empty') {
                    currentRoomMembers++;
                    if (logicData.players[key].status === 'ready') readyCount++;
                }
            });
            
            if(readyCount === currentRoomMembers && currentRoomMembers > 0) contMsg.innerText = "Starting next round..."; 
            else contMsg.innerText = `Waiting for players (${readyCount}/${currentRoomMembers} ready)...`;
            
            const leaderKey = Object.keys(logicData.players).find(k => logicData.players[k].status !== 'empty');
            if (this.role === leaderKey && readyCount === currentRoomMembers && currentRoomMembers > 0) { 
                this.nextRound(logicData.round + 1); 
            }
        }
    }
};

document.getElementById('versus-room-input').addEventListener('input', function(e) { this.value = this.value.replace(/[^0-9]/g, ''); });

document.getElementById('versus-goal-input').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
    // ★修正: 0始まりを防ぐための簡易チェック（空でなければ数値化して範囲確認）
    if (this.value !== '') {
        let val = parseInt(this.value);
        if (val > 99) this.value = 99;
        // 入力中は0を許容しないと打ちにくい場合があるため、blur(フォーカス外れ)で最小値を確定させるのが一般的ですが、
        // ここではcreateRoom時に厳密にチェックするため、上限のみ制限しておきます。
    }
});
// フォーカスが外れた時に1未満なら1にする処理を追加しても良いですが、
// CreateRoom関数内で `maxWins < 1` なら `5` にリセットする安全策を入れているのでそのままでOKです。

// ★修正: 究極のチュートリアル
const Tutorial = {
    overlay: document.getElementById('tutorial-overlay'),
    phase1: document.getElementById('tut-phase-1'),
    phase2: document.getElementById('tut-phase-2'),
    phase3: document.getElementById('tut-phase-3'),
    
    targetBox: document.getElementById('tut-target-box'),
    userBox: document.getElementById('tut-user-box'),
    guideText: document.getElementById('tut-guide-text'),
    
    rangeR: document.getElementById('tut-range-r'),
    rangeG: document.getElementById('tut-range-g'),
    rangeB: document.getElementById('tut-range-b'),
    valR: document.getElementById('tut-val-r'),
    valG: document.getElementById('tut-val-g'),
    valB: document.getElementById('tut-val-b'),

    currentStage: 0,

    start: function() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'tutorial_begin');
        }

        this.overlay.classList.remove('hidden');
        this.overlay.style.opacity = '1';
        
        this.phase1.classList.remove('hidden');
        this.phase1.style.opacity = '1';
        
        this.phase2.classList.add('hidden');
        this.phase3.classList.add('hidden');

        setTimeout(() => {
            this.phase1.style.opacity = '0';
            this.phase1.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                this.phase1.classList.add('hidden');
                this.startDemoPhase();
            }, 500);
        }, 2000);
    },

    skip: function() {
        this.overlay.style.opacity = '0';
        this.overlay.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            this.overlay.classList.add('hidden');
            localStorage.setItem('visited', 'true');
        }, 300);
    },

    startDemoPhase: function() {
        this.phase2.classList.remove('hidden');
        this.startStage1();
    },

    // --- Stage 1: RED ---
    startStage1: function() {
        this.currentStage = 1;
        this.guideText.innerText = ""; 
        this.setTargetColor(255, 0, 0);
        this.setUserColor(0, 0, 0);
        this.setupSlider(this.rangeR, this.valR, 0, false); 
        this.setupSlider(this.rangeG, this.valG, 0, true);  
        this.setupSlider(this.rangeB, this.valB, 0, true);  

        this.rangeR.oninput = (e) => {
            const val = parseInt(e.target.value);
            this.valR.innerText = val;
            this.setUserColor(val, 0, 0);
            if (val === 255) this.stageClear(this.startStage2.bind(this));
        };
    },

    // --- Stage 2: ORANGE ---
    startStage2: function() {
        this.currentStage = 2;
        this.guideText.innerText = "";
        this.setTargetColor(255, 128, 0);
        this.setupSlider(this.rangeR, this.valR, 255, true); 
        this.setupSlider(this.rangeG, this.valG, 0, false); 
        this.setupSlider(this.rangeB, this.valB, 0, true);

        this.rangeG.oninput = (e) => {
            const val = parseInt(e.target.value);
            this.valG.innerText = val;
            this.setUserColor(255, val, 0);
            if (val === 128) this.stageClear(this.startStage3.bind(this));
        };
    },

    // --- Stage 3: PINK ---
    startStage3: function() {
        this.currentStage = 3;
        this.guideText.innerText = "";
        this.setTargetColor(255, 128, 255);
        this.setupSlider(this.rangeR, this.valR, 255, true);
        this.setupSlider(this.rangeG, this.valG, 128, true);
        this.setupSlider(this.rangeB, this.valB, 0, false); 

        this.rangeB.oninput = (e) => {
            const val = parseInt(e.target.value);
            this.valB.innerText = val;
            this.setUserColor(255, 128, val);
            if (val === 255) this.stageClear(this.showFinale.bind(this));
        };
    },

    setTargetColor: function(r, g, b) {
        this.targetBox.style.backgroundColor = `rgb(${r},${g},${b})`;
    },
    setUserColor: function(r, g, b) {
        this.userBox.style.backgroundColor = `rgb(${r},${g},${b})`;
    },
    setupSlider: function(el, valEl, val, disabled) {
        el.value = val;
        el.disabled = disabled;
        valEl.innerText = val;
        el.oninput = null; // Clear previous listener
    },
    stageClear: function(nextCallback) {
        if(this.currentStage === 1) this.rangeR.disabled = true;
        if(this.currentStage === 2) this.rangeG.disabled = true;
        if(this.currentStage === 3) this.rangeB.disabled = true;

        this.guideText.className = "tut-perfect";
        this.guideText.innerText = "PERFECT";
        
        setTimeout(() => {
            this.guideText.className = "tut-guide"; 
            this.guideText.innerText = "";
            nextCallback();
        }, 1200);
    },

    showFinale: function() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'tutorial_complete');
        }
        this.phase2.classList.add('hidden');
        this.phase3.classList.remove('hidden');
        setTimeout(() => { this.skip(); }, 2500);
    }
};

// ▼ Initialize App
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    MenuLogic.init();

    if (!localStorage.getItem('visited')) { 
        Tutorial.start(); 
    }

    if (roomParam) {
        const savedName = localStorage.getItem("friend_name");
        if (savedName) {
            VersusGame.inviteRoomId = roomParam;
            VersusGame.myName = savedName;
            AppController.showScreen('versus-join');
            document.getElementById('versus-room-input').value = roomParam;
            VersusGame.joinRoom();
        } else {
            VersusGame.inviteRoomId = roomParam;
            AppController.showScreen('versus-menu');
        }
    } else {
        const savedScreen = localStorage.getItem('current_screen');
        if (savedScreen && savedScreen !== 'menu') {
            
            if (savedScreen === 'daily') {
                const todayStr = Utils.getTodayString();
                if (localStorage.getItem("daily_score_" + todayStr)) {
                    AppController.showScreen('menu');
                    return;
                }
            }

            if (savedScreen === 'origin') OriginGame.initialize();
            else if (savedScreen === 'rush') RushGame.initialize();
            else if (savedScreen === 'survival') SurvivalGame.initialize();
            else if (savedScreen === 'daily') DailyGame.initialize();
            else if (savedScreen === 'anotherworld') AnotherGame.initialize();
            AppController.showScreen(savedScreen);
        } else { 
            AppController.showScreen('menu'); 
        }
    }
};