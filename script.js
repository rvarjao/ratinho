'use strict';
// [x,y] das peças: ratinho 2x2; 4 peças 1x2; 1 peça 2x1; 4 peças 1x1.
const LEVELS = [
    [
        [2, 3],
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
        [0, 3],
        [0, 4],
        [1, 0],
        [1, 4],
        [2, 0]
    ],
    [
        [2, 3],
        [0, 1],
        [1, 1],
        [2, 0],
        [3, 0],
        [0, 3],
        [0, 0],
        [0, 4],
        [1, 0],
        [1, 4]
    ],
    [
        [2, 2],
        [0, 1],
        [1, 1],
        [2, 0],
        [3, 0],
        [0, 4],
        [0, 0],
        [1, 0],
        [2, 4],
        [3, 4]
    ],
    [
        [1, 2],
        [0, 0],
        [0, 2],
        [2, 0],
        [3, 0],
        [0, 4],
        [1, 0],
        [1, 1],
        [2, 4],
        [3, 4]
    ],
    [
        [1, 2],
        [0, 2],
        [1, 0],
        [3, 0],
        [3, 2],
        [0, 4],
        [2, 0],
        [2, 1],
        [2, 4],
        [3, 4]
    ],
    [
        [0, 2],
        [0, 0],
        [1, 0],
        [3, 1],
        [3, 3],
        [0, 4],
        [2, 0],
        [2, 1],
        [2, 3],
        [2, 4]
    ],
    [
        [1, 2],
        [0, 2],
        [1, 0],
        [3, 1],
        [3, 3],
        [0, 4],
        [2, 0],
        [2, 1],
        [2, 4],
        [3, 0]
    ],
    [
        [1, 1],
        [0, 0],
        [0, 2],
        [2, 3],
        [3, 2],
        [0, 4],
        [1, 0],
        [1, 3],
        [2, 0],
        [3, 0]
    ],
    [
        [2, 1],
        [0, 0],
        [0, 2],
        [2, 3],
        [3, 3],
        [0, 4],
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 0]
    ],
    [
        [2, 0],
        [0, 0],
        [0, 2],
        [2, 2],
        [3, 2],
        [2, 4],
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 4]
    ],
    [
        [1, 0],
        [0, 0],
        [0, 3],
        [2, 2],
        [3, 1],
        [2, 4],
        [0, 2],
        [1, 2],
        [1, 3],
        [1, 4]
    ],
    [
        [1, 0],
        [0, 0],
        [0, 2],
        [3, 0],
        [3, 2],
        [1, 4],
        [1, 2],
        [1, 3],
        [2, 2],
        [2, 3]
    ]
];
const SIZES = [
    [2, 2],
    [1, 2],
    [1, 2],
    [1, 2],
    [1, 2],
    [2, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1]
];
const DIFFICULTY = ['Muito fácil', 'Muito fácil', 'Fácil', 'Fácil', 'Intermediário',
    'Intermediário', 'Intermediário', 'Difícil', 'Difícil', 'Muito difícil', 'Muito difícil',
    'Clássico'
];
const board = document.querySelector('#board'),
    levelSelect = document.querySelector('#level'),
    movesEl = document.querySelector('#moves'),
    titleEl = document.querySelector('#levelTitle'),
    desc = document.querySelector('#description'),
    msg = document.querySelector('#message'),
    toast = document.querySelector('#toast'),
    trainAiButton = document.querySelector('#trainAi'),
    playOptimalButton = document.querySelector('#playOptimal'),
    stopAiButton = document.querySelector('#stopAi'),
    aiSpeed = document.querySelector('#aiSpeed'),
    aiStatus = document.querySelector('#aiStatus'),
    aiProgress = document.querySelector('#aiProgress'),
    aiAttempts = document.querySelector('#aiAttempts'),
    aiCurrent = document.querySelector('#aiCurrent'),
    aiBest = document.querySelector('#aiBest'),
    aiOptimal = document.querySelector('#aiOptimal'),
    aiNarration = document.querySelector('#aiNarration');
let level = 0,
    pieces = [],
    history = [],
    selected = null,
    moves = 0,
    won = false,
    drag = null,
    aiRun = 0,
    aiBusy = false,
    optimalCache = new Map();
const deepCopy = p => p.map(([x, y]) => [x, y]);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
for (let i = 0; i < LEVELS.length; i++) {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = `${String(i+1).padStart(2,'0')} · ${DIFFICULTY[i]}`;
    levelSelect.appendChild(o)
}

function save() {
    try {
        localStorage.setItem('ratinho-level', String(level))
    } catch {}
}

function load(i) {
    stopAi();
    level = Math.min(LEVELS.length - 1, Math.max(0, Number(i) || 0));
    pieces = deepCopy(LEVELS[level]);
    history = [];
    selected = null;
    moves = 0;
    won = false;
    drag = null;
    board.classList.remove('won');
    levelSelect.value = level;
    titleEl.textContent = `Desafio ${level+1} de ${LEVELS.length}`;
    desc.textContent =
        `Nível: ${DIFFICULTY[level]}. Todas as posições podem ser resolvidas. Os desafios são recriações progressivas, não as configurações oficiais.`;
    msg.textContent = '';
    toast.textContent = '';
    resetAiPanel();
    save();
    render()
}

function occupied(except) {
    const occ = Array(20).fill(-1);
    pieces.forEach(([px, py], i) => {
        if (i === except) return;
        let [w, h] = SIZES[i];
        for (let y = py; y < py + h; y++)
            for (let x = px; x < px + w; x++) occ[y * 4 + x] = i
    });
    return occ
}

function occupiedState(state, except) {
    const occ = Array(20).fill(-1);
    state.forEach(([px, py], i) => {
        if (i === except) return;
        const [w, h] = SIZES[i];
        for (let y = py; y < py + h; y++)
            for (let x = px; x < px + w; x++) occ[y * 4 + x] = i;
    });
    return occ;
}

function allowedState(state, i, x, y) {
    const [w, h] = SIZES[i];
    if (x < 0 || y < 0 || x + w > 4 || y + h > 5) return false;
    const occ = occupiedState(state, i);
    for (let cy = y; cy < y + h; cy++)
        for (let cx = x; cx < x + w; cx++)
            if (occ[cy * 4 + cx] !== -1) return false;
    return true;
}

function legalActions(state) {
    const actions = [];
    state.forEach(([x, y], piece) => {
        DIRS.forEach(([dx, dy], direction) => {
            if (allowedState(state, piece, x + dx, y + dy)) actions.push({piece, direction, dx, dy});
        });
    });
    return actions;
}

function applyAction(state, action) {
    const next = deepCopy(state);
    next[action.piece][0] += action.dx;
    next[action.piece][1] += action.dy;
    return next;
}

const stateKey = state => state.flat().join(',');
// Peças do mesmo formato são equivalentes para a busca. A chave canônica evita
// explorar novamente o mesmo tabuleiro apenas porque duas delas trocaram de nome.
const solverKey = state => [
    state[0].join(''),
    state.slice(1, 5).map(position => position.join('')).sort().join('.'),
    state[5].join(''),
    state.slice(6).map(position => position.join('')).sort().join('.')
].join('|');
const actionKey = action => action.piece * 4 + action.direction;
const isGoal = state => state[0][0] === 1 && state[0][1] === 3;

function allowed(i, x, y) {
    const [w, h] = SIZES[i];
    if (x < 0 || y < 0 || x + w > 4 || y + h > 5) return false;
    const occ = occupied(i);
    for (let cy = y; cy < y + h; cy++)
        for (let cx = x; cx < x + w; cx++)
            if (occ[cy * 4 + cx] !== -1) return false;
    return true
}

function move(i, dx, dy) {
    if (won || aiBusy) return false;
    const [x, y] = pieces[i];
    if (!((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0))) return false;
    if (!allowed(i, x + dx, y + dy)) return false;
    history.push(deepCopy(pieces));
    pieces[i] = [x + dx, y + dy];
    moves++;
    if (pieces[0][0] === 1 && pieces[0][1] === 3) {
        won = true;
        board.classList.add('won');
        msg.textContent = `🐭 Ratinho livre! Você concluiu em ${moves} movimentos!`;
        toast.textContent = 'Parabéns! Escolha o próximo desafio.'
    }
    render();
    return true
}

function setAiBusy(value, label = 'Pronta') {
    aiBusy = value;
    board.classList.toggle('ai-running', value);
    aiStatus.textContent = label;
    aiStatus.classList.toggle('running', value);
    trainAiButton.disabled = value;
    playOptimalButton.disabled = value;
    stopAiButton.disabled = !value;
    document.querySelector('#undo').disabled = value || !history.length;
    document.querySelector('#reset').disabled = value;
    document.querySelector('#next').disabled = value || level === LEVELS.length - 1;
    levelSelect.disabled = value;
}

function stopAi() {
    aiRun++;
    if (aiBusy) {
        aiBusy = false;
        board.classList.remove('ai-running');
    }
    if (trainAiButton) setAiBusy(false, 'Pronta');
}

function resetAiPanel() {
    aiAttempts.textContent = '0';
    aiCurrent.textContent = '—';
    aiBest.textContent = '—';
    aiOptimal.textContent = optimalCache.has(level) ? optimalCache.get(level).length : '—';
    aiProgress.style.width = '0%';
    aiNarration.textContent = 'Escolha um desafio e inicie o treinamento.';
}

function wait(ms) {
    return ms ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
}

async function solveOptimal(start, runId) {
    const cached = optimalCache.get(level);
    if (cached) return cached;
    const startKey = solverKey(start);
    const states = [deepCopy(start)];
    const keys = [startKey];
    const parents = new Map([[startKey, null]]);
    let head = 0;
    while (head < states.length) {
        if (runId !== aiRun) throw new Error('cancelled');
        const current = states[head];
        const currentKey = keys[head++];
        for (const action of legalActions(current)) {
            const next = applyAction(current, action);
            const key = solverKey(next);
            if (parents.has(key)) continue;
            parents.set(key, {previous: currentKey, action});
            states.push(next);
            keys.push(key);
            if (isGoal(next)) {
                const path = [];
                let cursor = key;
                while (parents.get(cursor)) {
                    const link = parents.get(cursor);
                    path.push(link.action);
                    cursor = link.previous;
                }
                path.reverse();
                optimalCache.set(level, path);
                return path;
            }
        }
        if (head % 1800 === 0) {
            aiNarration.textContent = `Analisando ${head.toLocaleString('pt-BR')} configurações do tabuleiro…`;
            await wait(0);
        }
    }
    throw new Error('Este desafio não possui solução.');
}

function seedQTable(start, path, qTable) {
    let state = deepCopy(start);
    path.forEach((action, index) => {
        const key = stateKey(state);
        const values = qTable.get(key) || new Float64Array(40);
        values[actionKey(action)] = 8 + (path.length - index) * .12;
        qTable.set(key, values);
        state = applyAction(state, action);
    });
}

function buildTeacher(start, path) {
    const teacher = new Map();
    let state = deepCopy(start);
    path.forEach(action => {
        teacher.set(stateKey(state), action);
        state = applyAction(state, action);
    });
    return teacher;
}

function chooseAction(state, qTable, epsilon, teacher, guidance) {
    const actions = legalActions(state);
    if (!actions.length) return null;
    const demonstrated = teacher.get(stateKey(state));
    if (demonstrated && Math.random() < guidance) return demonstrated;
    if (Math.random() < epsilon) return actions[Math.floor(Math.random() * actions.length)];
    const values = qTable.get(stateKey(state));
    if (!values) return actions[Math.floor(Math.random() * actions.length)];
    let best = -Infinity;
    let choices = [];
    actions.forEach(action => {
        const value = values[actionKey(action)];
        if (value > best) {
            best = value;
            choices = [action];
        } else if (value === best) choices.push(action);
    });
    return choices[Math.floor(Math.random() * choices.length)];
}

function updateQ(qTable, state, action, reward, next, alpha = .34, gamma = .97) {
    const key = stateKey(state);
    const values = qTable.get(key) || new Float64Array(40);
    const nextValues = qTable.get(stateKey(next));
    let future = 0;
    if (nextValues && !isGoal(next)) {
        future = Math.max(...legalActions(next).map(candidate => nextValues[actionKey(candidate)]));
    }
    const index = actionKey(action);
    values[index] += alpha * (reward + gamma * future - values[index]);
    qTable.set(key, values);
}

async function showState(state, count, delay, runId) {
    if (runId !== aiRun) throw new Error('cancelled');
    pieces = deepCopy(state);
    moves = count;
    won = isGoal(state);
    board.classList.toggle('won', won);
    render();
    await wait(delay);
}

async function animatePath(path, runId, delay, introduction) {
    let state = deepCopy(LEVELS[level]);
    await showState(state, 0, Math.min(delay, 120), runId);
    aiNarration.textContent = introduction;
    for (let i = 0; i < path.length; i++) {
        state = applyAction(state, path[i]);
        aiCurrent.textContent = i + 1;
        aiProgress.style.width = `${((i + 1) / path.length) * 100}%`;
        await showState(state, i + 1, delay, runId);
    }
}

async function trainAi() {
    const runId = ++aiRun;
    const start = deepCopy(LEVELS[level]);
    setAiBusy(true, 'Calculando');
    aiNarration.textContent = 'Primeiro, a IA está mapeando os movimentos possíveis…';
    msg.textContent = '';
    toast.textContent = '';
    try {
        const optimal = await solveOptimal(start, runId);
        aiOptimal.textContent = optimal.length;
        const qTable = new Map();
        seedQTable(start, optimal, qTable);
        const teacher = buildTeacher(start, optimal);
        let bestPath = null;
        const maxEpisodes = 500;
        const maxSteps = Math.max(160, optimal.length * 5);
        const speed = aiSpeed.value;
        const visibleEvery = speed === 'normal' ? 50 : speed === 'fast' ? 100 : 9999;
        const delay = speed === 'normal' ? 30 : speed === 'fast' ? 8 : 0;
        setAiBusy(true, 'Aprendendo');

        for (let episode = 1; episode <= maxEpisodes; episode++) {
            if (runId !== aiRun) throw new Error('cancelled');
            let state = deepCopy(start);
            const path = [];
            const epsilon = Math.max(.001, .92 * Math.pow(.975, episode - 1));
            // Currículo: começa explorando e recebe progressivamente mais exemplos
            // corretos. A partir da tentativa 400, reproduzir a rota depende apenas
            // do que foi demonstrado e reforçado.
            const guidance = Math.min(1, Math.pow(episode / 400, 2));
            const visible = episode === 1 || episode % visibleEvery === 0;
            aiAttempts.textContent = episode;
            aiCurrent.textContent = '0';
            aiProgress.style.width = `${Math.min(99, episode / maxEpisodes * 100)}%`;
            aiNarration.textContent = `Tentativa ${episode}: ${(epsilon * 100).toFixed(1).replace('.', ',')}% de exploração e ${(guidance * 100).toFixed(0)}% de apoio das demonstrações.`;
            if (visible) await showState(state, 0, delay, runId);

            for (let step = 0; step < maxSteps && !isGoal(state); step++) {
                const action = chooseAction(state, qTable, epsilon, teacher, guidance);
                if (!action) break;
                const next = applyAction(state, action);
                const reward = isGoal(next) ? 100 : -1;
                updateQ(qTable, state, action, reward, next);
                state = next;
                path.push(action);
                aiCurrent.textContent = path.length;
                // Exibe uma amostra de cada tentativa escolhida; o restante é
                // calculado sem animação para manter até o nível clássico rápido.
                if (visible && step < 80) await showState(state, path.length, delay, runId);
            }

            if (isGoal(state) && (!bestPath || path.length < bestPath.length)) {
                bestPath = path.slice();
                aiBest.textContent = bestPath.length;
                aiNarration.textContent = `Novo recorde: ${bestPath.length} movimentos na tentativa ${episode}.`;
                await wait(speed === 'turbo' ? 0 : 450);
            }
            if (bestPath && bestPath.length === optimal.length) {
                aiProgress.style.width = '100%';
                aiNarration.textContent = `Aprendizado concluído: a IA alcançou o mínimo de ${optimal.length} movimentos.`;
                await animatePath(bestPath, runId, speed === 'normal' ? 190 : 65, 'Reproduzindo a melhor partida aprendida pela IA.');
                msg.textContent = `🤖 A IA aprendeu a solução mínima em ${optimal.length} movimentos!`;
                toast.textContent = `Foram necessárias ${episode} tentativas.`;
                setAiBusy(false, 'Aprendeu');
                return;
            }
            if (speed === 'turbo' && episode % 10 === 0) await wait(0);
        }
        aiNarration.textContent = bestPath
            ? `Treino encerrado. Melhor resultado: ${bestPath.length}; mínimo conhecido: ${optimal.length}.`
            : 'A IA ainda não escapou. Execute um novo treinamento para continuar experimentando.';
        setAiBusy(false, 'Concluído');
    } catch (error) {
        if (error.message !== 'cancelled') {
            aiNarration.textContent = `Não foi possível concluir: ${error.message}`;
            setAiBusy(false, 'Erro');
        }
    }
}

async function playOptimal() {
    const runId = ++aiRun;
    const start = deepCopy(LEVELS[level]);
    setAiBusy(true, 'Calculando');
    board.scrollIntoView({behavior: 'smooth', block: 'center'});
    aiNarration.textContent = 'Procurando a menor sequência possível sem tentativas aleatórias…';
    msg.textContent = '';
    toast.textContent = '';
    try {
        const path = await solveOptimal(start, runId);
        aiOptimal.textContent = path.length;
        aiBest.textContent = '—';
        await animatePath(path, runId, aiSpeed.value === 'normal' ? 210 : aiSpeed.value === 'fast' ? 75 : 12,
            `Solução ótima encontrada: ${path.length} movimentos.`);
        msg.textContent = `🧭 Solução ótima: ${path.length} movimentos.`;
        aiNarration.textContent = 'Esta é a menor solução possível, encontrada por busca exata.';
        setAiBusy(false, 'Resolvido');
    } catch (error) {
        if (error.message !== 'cancelled') {
            aiNarration.textContent = `Não foi possível concluir: ${error.message}`;
            setAiBusy(false, 'Erro');
        }
    }
}

function render() {
    board.querySelectorAll('.piece').forEach(el => el.remove());
    const cell = board.clientWidth / 4;
    pieces.forEach(([x, y], i) => {
        const [w, h] = SIZES[i];
        const e = document.createElement('div');
        e.className = `piece ${i===0?'mouse':''} ${selected===i?'selected':''}`;
        e.style.left = `${x*25}%`;
        e.style.top = `${y*20}%`;
        e.style.width = `${w*25}%`;
        e.style.height = `${h*20}%`;
        e.dataset.index = i;
        e.tabIndex = 0;
        e.setAttribute('role', 'button');
        e.setAttribute('aria-label', i === 0 ? 'Ratinho' : `Peça ${i}`);
        if (i === 0) e.innerHTML = '<span aria-hidden="true">🐭</span>';
        e.addEventListener('pointerdown', ev => {
            if (won) return;
            selected = i;
            drag = {
                id: i,
                x: ev.clientX,
                y: ev.clientY
            };
            e.setPointerCapture(ev.pointerId);
            renderSelection()
        });
        e.addEventListener('pointerup', ev => {
            if (!drag || drag.id !== i) return;
            const dx = ev.clientX - drag.x,
                dy = ev.clientY - drag.y;
            drag = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) {
                renderSelection();
                return
            }
            const horizontal = Math.abs(dx) > Math.abs(dy);
            const steps = Math.max(1, Math.round(Math.abs(horizontal ? dx : dy) / cell));
            for (let k = 0; k < steps; k++) {
                if (!move(i, horizontal ? Math.sign(dx) : 0, horizontal ? 0 : Math.sign(dy))) break
            }
        });
        e.addEventListener('pointercancel', () => {
            drag = null
        });
        e.addEventListener('click', () => {
            selected = i;
            renderSelection()
        });
        board.appendChild(e)
    });
    movesEl.textContent = `${moves} movimento${moves===1?'':'s'}`;
    document.querySelector('#undo').disabled = aiBusy || !history.length;
    document.querySelector('#reset').disabled = aiBusy;
    document.querySelector('#next').disabled = aiBusy || level === LEVELS.length - 1
}

function renderSelection() {
    board.querySelectorAll('.piece').forEach(e =>
        e.classList.toggle('selected', Number(e.dataset.index) === selected)
    )
}
document.addEventListener('keydown', ev => {
    if (selected === null || ev.target.tagName === 'SELECT') return;
    const dirs = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
    };
    if (dirs[ev.key]) {
        ev.preventDefault();
        move(selected, ...dirs[ev.key])
    }
});
document.querySelector('#reset').addEventListener('click', () => load(level));
document.querySelector('#undo').addEventListener('click', () => {
    if (!history.length) return;
    pieces = history.pop();
    moves = Math.max(0, moves - 1);
    won = false;
    board.classList.remove('won');
    msg.textContent = '';
    toast.textContent = '';
    render()
});
document.querySelector('#next').addEventListener('click', () => load(level + 1));
levelSelect.addEventListener('change', () => load(levelSelect.value));
trainAiButton.addEventListener('click', trainAi);
playOptimalButton.addEventListener('click', playOptimal);
stopAiButton.addEventListener('click', () => {
    stopAi();
    load(level);
    aiNarration.textContent = 'Treinamento interrompido.';
});
let saved = 0;
try {
    saved = Number(localStorage.getItem('ratinho-level')) || 0
} catch {}
load(saved);
