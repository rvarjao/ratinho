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
    toast = document.querySelector('#toast');
let level = 0,
    pieces = [],
    history = [],
    selected = null,
    moves = 0,
    won = false,
    drag = null;
const deepCopy = p => p.map(([x, y]) => [x, y]);
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
    if (won) return false;
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
        if (i === 0) e.innerHTML = '<span aria-hidden="true">🐭</span><small>RATINHO</small>';
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
    document.querySelector('#undo').disabled = !history.length;
    document.querySelector('#next').disabled = level === LEVELS.length - 1
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
let saved = 0;
try {
    saved = Number(localStorage.getItem('ratinho-level')) || 0
} catch {}
load(saved);
