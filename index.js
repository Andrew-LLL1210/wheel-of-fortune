$ = document.querySelector
// wheel should have 10-50 pts in 10 increments
// skip turn, bankrupt
// variable number of players

// game rules
// on turn:
// choose: spin + guess, buy vowel, solve, or pass
// once a guess is incorrect, turn ends

// vowel cost 20

// choose to solve
// reveal button

// game variables

const sections = {
    setup: document.querySelector("section.setup"),
    game: document.querySelector('section.game'),
}

function focusSection(name) {
    for (let i in sections) {
        sections[i].classList.add("inactive");
    }
    sections[name].classList.remove("inactive");
    if (name == 'game') play();
}

const phraseInput = document.getElementById("phrase")
const category_input = document.getElementById('category-input');
const category_text = document.getElementById('category');
const error_message = document.getElementById("error_message");
const board = document.getElementById("board")
const board_lines = board.children[0].children;
const keyboard_buttons = document.querySelectorAll('.keyboard button');
let puzzle = {
    phrase: [],
    letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function play() {
    // build word
    category_text.textContent = category_input.value;
    puzzle.phrase = phraseInput.value.toUpperCase().split(' ');
    puzzle.letters = alphabet;
    for (let button of keyboard_buttons) button.disabled = false;
    if (displayPuzzle()) {
        error_message.textContent = '';
    } else {
        error_message.textContent = "Phrase doesn't fit on board";
        focusSection('setup');
    }
    // place competitors
    if (competitors.length > 0) active_competitor = 0;
    renderCompetitorsAtGame();
}

function displayPuzzle() {
    // clear board
    for (let line of board_lines) {
        for (let cell of line.children)
            cell.textContent = '';
    }
    // turn letters into blanks
    let phrase = puzzle.phrase.map(word =>
        word.split('').map(letter => {
            if (puzzle.letters.indexOf(letter) >= 0) return ' ';
            return letter;
        }).join('')
    )
    // split words across lines
    let line_length = 13;
    let num_lines = 4;
    let lines = [[]];
    let i = 0;
    for (let word of phrase) {
        if (word.length > line_length) return false;
        if (lineLength(lines[i].concat([word])) > line_length) {
            if (i++ == num_lines) return false;
            lines.push([]);
        }
        lines[i].push(word);
    }
    // put lines on board
    let i0 = (lines.length > 3) ? 0 : 1;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let cells = board_lines[i + i0].children;
        let j = Math.floor((line_length - lineLength(line)) / 2);
        for (let word of line) {
            for (let letter of word.split(''))
                cells[j++].textContent = letter;
            j++;
        }
    }
    return true;
}

function lineLength(line) {
    return line.length && line.reduce((sum, word) => sum + 1 + word.length, -1);
}

function guess(letter) {
    puzzle.letters = puzzle.letters.replace(letter, '');
    displayPuzzle();
}

for (let button of keyboard_buttons) {
    button.disabled = true;
    button.addEventListener('click', function() {
        guess(button.textContent);
        //for (let button of keyboard_buttons)
            //button.disabled = true;
        //document.getElementById('button-spin').disabled = false;
    })
}

document.querySelector('button.reveal-board').addEventListener('click', function () {
    puzzle.letters = '';
    displayPuzzle()
})

const canvas = document.getElementById("wheel")
const ctx = canvas.getContext('2d')
const wx = canvas.width;
const wy = canvas.height;
const TAU = Math.PI * 2;

async function spin() {
    const spin_button = document.getElementById('button-spin');
    //spin_button.disabled = true;

    let target_sector = Math.floor(Math.random() * 12)
    const result_sector = await spinWheel(target_sector);

    for (let button of keyboard_buttons) {
        if (puzzle.letters.indexOf(button.textContent) >= 0)
            button.disabled = false;
    }

    if (active_competitor == null) return
    let player = competitors[active_competitor];
    player.points = Math.max(0, player.points + result_sector.amount);

}
const wheel_fps = 60;

async function spinWheel(target_sector) {
    let state = 'accel';

    while (state != 'rest') {
        console.log('tick')
        // state transition
        switch (state) {
            case 'rest': return;
            case 'accel':
                wheel.dangle += wheel.ddangle;
                if (wheel.dangle > wheel.target_speed) {
                    wheel.dangle = wheel.target_speed;
                    state = 'spin';
                }
                break;
            case 'spin':
                let angle_width = TAU / wheel.sectors.length;
                let index = (12 - Math.floor(wheel.angle / angle_width)) % wheel.sectors.length;
                if (index == target_sector) state = 'slow';
                break;
            case 'slow':
                wheel.dangle -= wheel.ddangle / 2;
                if (wheel.dangle < 0) {
                    wheel.dangle = 0;
                    state = 'rest';
                }
        }

        wheel.angle += wheel.dangle;
        wheel.angle = wheel.angle % TAU;

        drawSpinner();
        await sleep(1000 / wheel_fps);
    }

    let angle_width = TAU / wheel.sectors.length;
    let index = (12 - Math.round(wheel.angle / angle_width)) % wheel.sectors.length;
    let sector = wheel.sectors[index];

    return (sector);
};

async function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const wheel = {
    angle: 0,
    dangle: 0,
    ddangle: 0.005,
    target_speed: TAU / 24,
    dims: [wx / 2, wy / 2, wx / 2 - 2, wy / 2 - 2],
    sectors: [
        {amount: 10, color: '#800'},
        {amount: 20, color: '#808'},
        {amount: 30, color: 'hsl(219, 80%, 40%)'},
        {amount: 40, color: 'hsl(219, 80%, 65%)'},
        {amount: 50, color: 'hsl(219, 80%, 40%)'},
        {amount: -Infinity, color: '#333'},
        {amount: 10, color: 'hsl(219, 80%, 40%)'},
        {amount: 20, color: 'hsl(219, 80%, 65%)'},
        {amount: 30, color: 'hsl(219, 80%, 40%)'},
        {amount: 40, color: 'hsl(219, 80%, 65%)'},
        {amount: 50, color: '#088'},
        {amount: 0, color: '#777'},
    ],
    outline_colors: '#000',
    highlight_color: '#fff',
}

drawSpinner()
function drawSpinner() {
    ctx.clearRect(0, 0, wx, wy);

    ctx.beginPath();
    ctx.ellipse(...wheel.dims, 0, 0, TAU);
    ctx.strokeStyle = wheel.outline_colors;
    ctx.stroke();

    let angle_width = TAU / wheel.sectors.length;
    let sel_index = (12 - Math.round(wheel.angle / angle_width)) % wheel.sectors.length;
    for (let i in wheel.sectors) {
        let sector = wheel.sectors[i];
        let angle = wheel.angle + angle_width * i;
        ctx.fillStyle = sector.color;
        
        ctx.translate(wx / 2, wy / 2);
        ctx.scale(wx, wy);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.ellipse(0, 0, .5, .5, 0, - angle_width / 2, angle_width / 2);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.fillStyle = (i == sel_index) ? '#ff0' : '#fff';
        ctx.font = '0.1px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        let text = '' + sector.amount;
        if (text == '0') {
            text = 'SKIP';
            ctx.font = '0.08px sans-serif';
        }
        if (text == '-Infinity') {
            text = "BANKRUPT";
            ctx.font = '0.06px sans-serif';
        }

        ctx.fillText(text, .45, 0);

        ctx.resetTransform();
    }

    ctx.beginPath();
    ctx.strokeStyle = wheel.highlight_color;
    ctx.moveTo(wx / 2, wy / 2);
    ctx.lineTo(wx, wy / 2);
    ctx.stroke();
}

class Competitor {
    constructor() {
        this.name = '';
        this.points = 100;
    }

    renderConfig(node, index) {
        let div = document.createElement('div')
        div.innerHTML = `
        <p class=competitor n=${index}>
            <button class=delete>-</button>
            <input type=text class=name placeholder='Competitor ${index + 1}' value=${this.name}>
        </p>
        `;

        div.querySelector('.delete').addEventListener('click', (event) => {
            competitors.splice(index, 1);
            renderCompetitorsAtStartup();
        });

        div.querySelector('.name').addEventListener('change', (event) => {
            this.name = event.target.value; 
        });

        div.querySelector('.name').addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                addCompetitor(index + 1);
                document.querySelector(`#competitors > p[n="${index + 1}"] > input`).focus();
            }
            if (event.key === 'ArrowUp' && index > 0) {
                document.querySelector(`#competitors > p[n="${index - 1}"] > input`).focus()
            }
            if (event.key === 'ArrowDown' && index < competitors.length - 1) {
                document.querySelector(`#competitors > p[n="${index + 1}"] > input`).focus();
            }
            if (event.key === 'Backspace' && event.target.value === '') {
                competitors.splice(index, 1);
                renderCompetitorsAtStartup();
                if (index > 0) document.querySelector(`#competitors > p[n="${index - 1}"] > input`).focus()
            }
        })

        node.appendChild(div.children[0]);
    }

    renderGame(node, index) {
        const name = this.name || `Competitor ${index + 1}`;
        let div = document.createElement('div');
        div.innerHTML = `
        <div class=competitor n=${index}>
            <p class=name>${name}</p>
            <p class=points>$${this.points}</p>
        </div>
        `;

        if (index == active_competitor)
            div.children[0].classList.toggle('active');

        node.appendChild(div.children[0]);
    }
}

let active_competitor = null;
let competitors = [] // list of Competitor
function addCompetitor(index = null) {
    let i = index ?? competitors.length;
    competitors.splice(i, 0, new Competitor());

    renderCompetitorsAtStartup();
}

function renderCompetitorsAtStartup() {
    const div = document.getElementById("competitors");
    div.innerHTML = '';
    for (const i in competitors) {
        competitors[i].renderConfig(div, parseInt(i));
    }
}

function renderCompetitorsAtGame() {
    const div = document.getElementById("competitors-game");
    div.innerHTML = '';
    for (const i in competitors) {
        competitors[i].renderGame(div, parseInt(i));
    }
}

function pass() {
    active_competitor = (active_competitor + 1) % competitors.length;
    renderCompetitorsAtGame();
}