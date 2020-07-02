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

function build_model(lvl, arr, wght) {
    let m = make_markov(lvl);
    markov_push(m, arr);
    if (wght) {
	markov_normalise(m, wght);
    }
    return m;
}

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
    else if (k === 'ESCAPE') {
	edit_box.blur();
	autowrite_disable();
	action_flag = false;
	// implemented as a special case: the escape key removes the
	// focus from the edit area.
    }
    else if (k === '+')                           update_model();
    else if (valid_ch.test(k))                    insert_char(k);
    else                                          action_flag = false;

    if (action_flag) {
	e.preventDefault();

	autowrite_reset();
	refresh_view(prev, live);
    }

});

edit_box.addEventListener('focus', autowrite_enable);
edit_box.addEventListener('blur',  autowrite_disable);


function refresh_view (fst, snd) {
    prev_text.innerHTML = fst;
    live_text.innerHTML = snd;

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

    let trunc = tail.slice(m_model.level).join(', ');
}


let autowrite_enabled = false;
let autowrite_interval = 400;
let autowrite_delay = 2000;

let autowrite_state = {
    start: 0,
    elapsed: 0,
    writing: null
};

function autowrite_enable () {
    status_update('started writing.');

    progress.style.height = "0.5em";

    autowrite_enabled = true;
    autowrite_state.start =
	Date.now() - autowrite_state.elapsed;

    autowrite_update();
}
function autowrite_disable () {
    status_update('paused.');

    autowrite_stop();
    progress.style.height = "0";

    autowrite_enabled = false;
}

function autowrite_update () {
    if (!autowrite_enabled) return;

    // update the stopwatch & start writing if waited for long enough
    autowrite_state.elapsed = Date.now() - autowrite_state.start;

    // percentage remaining until autowrite triggers.
    let percnt =
	Math.max(0, (1 - autowrite_state.elapsed/autowrite_delay) * 110);

    // extra ten percent buffer so bar doesn't flicker on the right
    // when continuously typing.
    progress_fill.style.width = Math.min(100, percnt * 1.1) + "%";

    if (!percnt) autowrite_start();

    window.requestAnimationFrame(autowrite_update);
}

function autowrite_reset () {
    autowrite_stop();
    autowrite_state.start = Date.now();
    autowrite_state.elapsed = 0;
    
    status_update('writing...', true);
}

function autowrite_start () {
    // do nothing if already writing
    if (autowrite_state.writing !== null) return;

    // add words to model
    update_model();

    if (!m_model.tree.total) {
	status_update('insufficient sample size.');
	return;
    }
    
    live = '';

    autowrite_state.writing = window.setInterval(() => {
	word = markov_step(m_model, words) + ' ';

	// cute little animation
	let ch_interval = Math.min(80, autowrite_interval/word.length);
	let temp = prev.slice();
	for (let i = 0; i < word.length; ++i) {
	    window.setTimeout(function () {
		refresh_view(temp + word.slice(0, i + i), '');
	    }, i * ch_interval);
	}
	
	prev += word;
	
    }, autowrite_interval);

    status_update('generative writing engaged');
}

function autowrite_stop () {
    if (autowrite_state.writing === null) return;
    window.clearInterval(autowrite_state.writing);
    autowrite_state.writing = null;
    
    refresh_view(prev, live);
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
    }, 3000);

}

// awful, awful user interface code.
const settings_box = document.getElementById("settings-box");
const about_box = document.getElementById("about-box");
const inpt_weight  = document.getElementById("weight");

const settings_val = {
    corpus: 'alice',
    depth: 1,
    weight: 32,
};

function get_opt_value (name) {
    const opts = document.getElementsByName(name);
    for (let i = 0; i < opts.length; ++i) {
	if (opts[i].checked) return opts[i].value;
    }
}
function set_opt_value (name, val) {
    const opts = document.getElementsByName(name);
    for (let i = 0; i < opts.length; ++i) {
	opts[i].checked = opts[i].id === name +  '-' + val;
    }
}
function get_num_value (name) {
    return document.getElementsByName(name)[0].value;
}
function set_num_value (name, val) {
    document.getElementsByName(name)[0].value = val;
}

function get_settings (v) {
    v = v || {};

    v.corpus = get_opt_value('corpus');
    v.depth  = get_opt_value('depth');
    v.weight = get_num_value('weight');

    return v;
}
function set_settings (v) {
    set_opt_value('corpus', v.corpus);
    settings_val.corpus = v.corpus;
    set_opt_value('depth',  v.depth);
    settings_val.depth  = v.depth;
    set_num_value('weight', v.weight);
    settings_val.weight = v.weight;
}
function commit_settings (v) {
    if (validate_settings(v)) {
	// if all the settings are valid, try to generate a new model.
	// a lot of this is done asynchronously but, like, we're also
	// not doing anything else in the meantime.
	let corpus = [];
	if (v.weight > 0) {
	    corpus = fetch_corpus(v.corpus);
	} else {
	    console.log('toy corpus.');
	    corpus = new Promise(function (res, rej) {
		res(['\nTHIS', 'IS', 'A', 'CAT.',
		     '\nTHIS', 'IS', 'A', 'BAT.']);
	    });
	    v.weight = 8;
	}
	corpus.then((json) => {
	    console.log('building model from corpus...');
	    return new Promise (function (res, rej) {
		m = build_model(v.depth, json, v.weight);
		res(m);
	    });
	}).then((m) => {
	    console.log('done.');

	    m_model = m;

    	    // ugly global-variable hack; eat everything that's been
	    // written from the beginning again.
	    wstop = 0; update_model();

	    // if everything worked, update the restore settings.
	    set_settings(v);
	});
    } else {
	console.log('!invalid settings', v);
    }
}
function validate_settings (v) {
    if (['alice', 'kjb', 'dante'].indexOf(v.corpus) < 0) return false;
    if (["0", "1", "2"].indexOf(v.depth) < 0) return false;
    if (!inpt_weight.validity.valid) return false;
    // not sure about support on the validity API.
    return true;
}
// hard-coded navigation; if we ever need more than three pages then
// refactor this to toggling through an array maybe.
document.getElementById('nav-settings').addEventListener('click', (e) => {
    e.stopPropagation();
    show_settings_box();
});
document.getElementById('nav-about').addEventListener('click', (e) => {
    e.stopPropagation();
    show_about_box();
});

function show_settings_box () {
    fold_about_box();
    settings_box.style.visibility = "visible";
}
function fold_settings_box () {
    // restore settings and fold the box;
    set_settings(settings_val);
    settings_box.style.visibility = "hidden";
}

function show_about_box () {
    fold_settings_box();
    about_box.style.visibility = "visible";
}
function fold_about_box () { about_box.style.visibility = "hidden"; }


function fetch_corpus (name) {
    console.log('fetch text corpus ' + name + '.json');
    let url = 'http://localhost:8000/corpus/' + name + '.json';
    return res = fetch(url).then((res) => { return res.json(); });
}

document.getElementById('settings-done').addEventListener('click', () => {
    let v = get_settings();
    commit_settings(v);
    fold_settings_box();
});
document.getElementById('settings-cancel').addEventListener('click', () => {

    set_settings(settings_val);
    
    settings_box.style.visibility = "hidden";
});

inpt_weight.addEventListener('change', (e) => {
    let w = inpt_weight.value;
});
document.getElementsByClassName('header')[0].addEventListener('click', () => {
    fold_settings_box();
    fold_about_box();
});


