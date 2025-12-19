// ---------- PANEL CREATOR ----------
function createPanel(ref, maxNumber) {
    return {
        maxNum: maxNumber,
        num1: 0,
        num2: 0,
        answer: 0,
        timer: null,
        startTime: 0,
        totalSeconds: 0,
        count: 0,
        marks: 0,
        progress: 0,

        qElem: document.querySelector(`#${ref} .question`),
        resultElem: document.querySelector(`#${ref} .answerResult`),
        inputElem: document.querySelector(`#${ref} .answerField`),
        tElem: document.querySelector(`#${ref} .timer`),
        sElem: document.querySelector(`#${ref} .status`),
        marksElem: document.querySelector(`#${ref} .marks`),
        totalTimeElem: document.querySelector(`#${ref} .totalTime`),
        aElem: document.querySelector(`#${ref} .answerResult`),

        progressElem: document.getElementById(ref === "panel1" ? "p1_progress" : "p2_progress")
    };
}

let isSinglePlayer = false;
let panel1 = createPanel("panel1", 70);
let panel2 = createPanel("panel2", 99);

// ---------- TIME FORMAT ----------
function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
}

// ---------- NEW QUESTION ----------
function newQuestion(panel) {
    panel.num1 = Math.floor(Math.random() * panel.maxNum) + 1;
    panel.num2 = Math.floor(Math.random() * panel.maxNum) + 1;
    panel.answer = panel.num1 + panel.num2;

    panel.count++;
    panel.qElem.textContent = `${panel.num1} + ${panel.num2}`;
    panel.aElem.textContent = "";
    panel.aElem.style.color = "black";
    panel.sElem.textContent = `Question ${panel.count}`;

    resetTimer(panel);
}

// ---------- RESET TIMER ----------
function resetTimer(panel) {
    clearInterval(panel.timer);
    panel.startTime = Date.now();
    panel.timer = setInterval(() => updateTimer(panel), 1000);
}

function updateTimer(panel) {
    const elapsed = Math.floor((Date.now() - panel.startTime) / 1000);
    panel.tElem.textContent = formatTime(elapsed);
}

// ---------- SHOW ANSWER ----------
function showAnswer(panel) {
    clearInterval(panel.timer);

    const elapsed = Math.floor((Date.now() - panel.startTime) / 1000);
panel.totalSeconds += elapsed;
panel.totalTimeElem.textContent = panel.totalSeconds < 3600 ? 
    formatTime(panel.totalSeconds) : 
    `${Math.floor(panel.totalSeconds / 3600)}:${formatTime(panel.totalSeconds % 3600)}`;

    panel.aElem.textContent = panel.answer;
    panel.aElem.style.color = "green";

    panel.marks++;
    panel.marksElem.textContent = panel.marks;

    panel.progress = Math.min(100, panel.progress + 10);
    panel.progressElem.style.width = panel.progress + "%";

    updateLeaderboard();
}

// ---------- LEADERBOARD ----------
function updateLeaderboard() {
    const board = document.getElementById("boardContent");

    if (isSinglePlayer) {
        board.innerHTML = `
            <p>Player 1 → Marks: ${panel1.marks} | Time: ${formatTime(panel1.totalSeconds)}</p>
            <hr>
            <h3>Keep Going!</h3>
        `;
    } else {
        const kid1Score = panel1.marks;
        const kid2Score = panel2.marks;

        board.innerHTML = `
            <p>Kid 1 → Marks: ${panel1.marks} | Time: ${formatTime(panel1.totalSeconds)}</p>
            <p>Kid 2 → Marks: ${panel2.marks} | Time: ${formatTime(panel2.totalSeconds)}</p>
            <hr>
            <h3>Ranking:</h3>
            <p>${
                kid1Score > kid2Score
                    ? "🥇 Kid 1 is Winning!"
                    : kid2Score > kid1Score
                    ? "🥇 Kid 2 is Winning!"
                    : "🤝 Tie!"
            }</p>
        `;
    }
}

// ---------- MODE TOGGLE ----------
document.getElementById("modeToggle").onclick = () => {
    isSinglePlayer = !isSinglePlayer;
    document.body.classList.toggle("single-player-mode");
    
    const btn = document.getElementById("modeToggle");
    const h2 = document.querySelector("#panel1 h2");
    
    if (isSinglePlayer) {
        btn.textContent = "👥 2 Players";
        h2.innerHTML = `Player 1 - Marks: <span class="marks">${panel1.marks}</span> | Time: <span class="totalTime">${formatTime(panel1.totalSeconds)}</span>`;
    } else {
        btn.textContent = "👤 1 Player";
        h2.innerHTML = `Kid 1 - Marks: <span class="marks">${panel1.marks}</span> | Time: <span class="totalTime">${formatTime(panel1.totalSeconds)}</span>`;
    }
    
    // Re-bind elements for panel1 because innerHTML overwrite destroyed previous references
    panel1.marksElem = h2.querySelector(".marks");
    panel1.totalTimeElem = h2.querySelector(".totalTime");
    
    updateLeaderboard();
};

// ---------- DARK MODE ----------
document.getElementById("darkToggle").onclick = () => {
    document.body.classList.toggle("dark-mode");
};

// ---------- CUSTOM KEY MAPPING ----------
let keys = {
    k1new: "a",
    k1ans: "s",
    k2new: "l",
    k2ans: ";"
};

function saveKeyMappings() {
    keys = {
        k1new: document.getElementById("k1_new").value.trim().toLowerCase() || 'a',
        k1ans: document.getElementById("k1_ans").value.trim().toLowerCase() || 's',
        k2new: document.getElementById("k2_new").value.trim().toLowerCase() || 'l',
        k2ans: document.getElementById("k2_ans").value.trim().toLowerCase() || ';'
    };
    localStorage.keys = JSON.stringify(keys);
    showToast('Key mappings saved successfully!');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Load saved keys
if (localStorage.keys) {
    keys = JSON.parse(localStorage.keys);
}

document.getElementById("k1_new").value = keys.k1new;
document.getElementById("k1_ans").value = keys.k1ans;
document.getElementById("k2_new").value = keys.k2new;
document.getElementById("k2_ans").value = keys.k2ans;

document.getElementById("saveKeys").onclick = () => {
    keys.k1new = document.getElementById("k1_new").value;
    keys.k1ans = document.getElementById("k1_ans").value;
    keys.k2new = document.getElementById("k2_new").value;
    keys.k2ans = document.getElementById("k2_ans").value;

    localStorage.keys = JSON.stringify(keys);
};

// ---------- KEYBOARD HANDLING ----------
document.addEventListener("keydown", (e) => {
    // Find Mode Shortcut (Shift + .)
    if (e.shiftKey && e.key === '.') {
        panel1.inputElem.focus();
        return;
    }
    
    // Handlers for speech2 code (direct select)
    if (e.key === keys.k1new) newQuestion(panel1);
    if (e.key === keys.k1ans) showAnswer(panel1);
    
    if (!isSinglePlayer) {
        if (e.key === keys.k2new) newQuestion(panel2);
        if (e.key === keys.k2ans) showAnswer(panel2);
    }
});

// Enter key submission handlers
panel1.inputElem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createAnswerHandler('panel1')();
});

panel2.inputElem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createAnswerHandler('panel2')();
});

// Add answer submission handlers
function createAnswerHandler(panelId) {
    const panel = panelId === 'panel1' ? panel1 : panel2;
    const resultElem = document.querySelector(`#${panelId} .answerResult`);
    const inputElem = document.querySelector(`#${panelId} .answerField`);
    
    return function() {
        const userAnswer = parseFloat(inputElem.value);
        
        if (userAnswer === panel.answer) {
            panel.marks++;
            panel.marksElem.textContent = panel.marks;
            resultElem.style.color = 'green';
            resultElem.textContent = '✓ Correct! +1 point';
            updateLeaderboard();
        } else {
            resultElem.style.color = 'red';
            resultElem.textContent = `✗ Incorrect! Correct answer: ${panel.answer}`;
        }
        
        inputElem.value = '';
        setTimeout(() => resultElem.textContent = '', 3000);
    };
}

document.querySelector('#panel1 .submitBtn').addEventListener('click', createAnswerHandler('panel1'));
document.querySelector('#panel2 .submitBtn').addEventListener('click', createAnswerHandler('panel2'));
// SETTINGS MODAL
const modal = document.getElementById("settingsModal");
document.getElementById("settingsBtn").onclick = () => modal.style.display = "flex";
document.getElementById("closeModal").onclick = () => modal.style.display = "none";
