// keep references to stuff from the DOM
const edit_box  = document.getElementById("edit-box");
const prev_text = document.getElementsByClassName("prev-text")[0];
const live_text = document.getElementsByClassName("live-text")[0];
const cursor    = document.getElementsByClassName("cursor")[0];

const status = document.getElementsByClassName("status")[0];
const progress = document.getElementsByClassName("progress")[0];

const progress_fill = document.createElement("div");
progress.appendChild(progress_fill);


// single character in a stupid
// anglo-centric character set:
const valid_ch = /^[ -~]$/;


// delimiters. explicitly checking spaces and newlines might be
// faster? but probably doesn't matter
const split_ch = / +/

// the text in the input area that's beenprocessed
// so far:
let prev = '';

// the text in the input area that will be processed
// on the next update:
let live = '';

let words = []; // corpus built from entered words
let wstop = 0;  // index of first unprocessed word

let m_model = make_markov(2);

markov_push(m_model, corpus.toy);

edit_box.addEventListener('keydown', e => {
    let k = e.key.toUpperCase();

    let action_flag = true;

    if (k === 'ENTER') {
	insert_char(' ');
	insert_char('\n');
	// this is a trick (TM) : every line has a trailing space
	// appended to it so that when we split the line at spaces we
	// remember the beginning of lines. delete_char treats this
	// special case by removing two characters instead of one
	// whenever backspacing into a newline.
    }
    else if (k === 'BACKSPACE' || k === 'DELETE') delete_char();
    else if (k === '+')                           update_model();
    else if (valid_ch.test(k))                    insert_char(k);
    else                                          action_flag = false;

    if (action_flag) {
	e.preventDefault();

	autowrite_reset();
	refresh_view();
    }

});

edit_box.addEventListener('focus', autowrite_enable);
edit_box.addEventListener('blur',  autowrite_disable);


function refresh_view () {
    prev_text.innerHTML = prev;
    live_text.innerHTML = live;

    cursor.scrollIntoView({
	block: 'nearest',
	behavior: 'smooth'
    });
}

function insert_char (ch) {
    if (split_ch.test(ch)) {
	if (live.length) words.push(live);
	prev = prev + live + ch;
	live = '';
    } else {
	live += ch;
    }
}

function delete_char () {
    if (live.length) {
	live = live.slice(0, -1);
    } else {
	prev = prev.slice(0, prev[prev.length - 1] === '\n' ? -2 : -1);
	if (words.length
	    && !split_ch.test(prev[prev.length-1])) {
	    live = words[words.length - 1]; words.pop();
	    prev = prev.slice(0, prev.length - live.length);
	}
    }
}

function update_model () {
    wstop = Math.min(wstop, words.length);

    let tail = words.slice(
	Math.max(0, wstop - m_model.level),
	words.length);

    if (tail.length > m_model.level) {
	markov_push(m_model, tail);
	wstop = words.length;
    }

}


let autowrite_enabled = false;
let autowrite_interval = 500;
let autowrite_delay = 5000;

let autowrite_state = {
    start: 0,
    elapsed: 0,
    writing: null
};

function autowrite_enable () {
    status_update('autowrite enabled.', true);

    progress.style.height = "0.5em";

    autowrite_enabled = true;
    autowrite_state.start =
	Date.now() - autowrite_state.elapsed;

    autowrite_update();
}
function autowrite_disable () {
    status_update('autowrite paused.');

    autowrite_stop();
    progress.style.height = "0";

    autowrite_enabled = false;
}

function autowrite_update () {
    if (!autowrite_enabled) return;

    // update the stopwatch & start writing if waited for long enough
    autowrite_state.elapsed = Date.now() - autowrite_state.start;

    // percentage remaining until autowrite triggers
    let percnt =
	Math.max(0, (1 - autowrite_state.elapsed/autowrite_delay) * 100);

    progress_fill.style.width = percnt + "%";

    if (!percnt) autowrite_start();

    window.requestAnimationFrame(autowrite_update);
}

function autowrite_reset () {
    autowrite_stop();
    autowrite_state.start = Date.now();
    autowrite_state.elapsed = 0;
}

function autowrite_start () {
    // do nothing if already writing
    if (autowrite_state.writing !== null) return;

    update_model();
    live = '';

    autowrite_state.writing = window.setInterval(() => {
	word = markov_step(m_model, words);

	// cute little animation
	let ch_interval = Math.min(80, autowrite_interval/word.length);

	prev += ' ';
	for (let i = 0; i < word.length; ++i) {
	    window.setTimeout(() => {
		prev += word[i];
		refresh_view();
	    }, i * ch_interval);
	}
    }, autowrite_interval);

    status_update('autowrite engaged...');
}

function autowrite_stop () {
    if (autowrite_state.writing === null) return;
    window.clearInterval(autowrite_state.writing);
    autowrite_state.writing = null;

    status_update('');
}

let status_timer = null;
function status_update (msg, trs) {
    if (status_timer !== null) {
	window.clearTimeout(status_timer);
	status_timer = null;
    }
    status.innerHTML = msg;
    if (trs) status_timer = window.setTimeout(() => {
	status_update("", false);
    }, 2000);

}
