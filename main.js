const edit_box  = document.getElementById("edit-box");
const prev_text = document.getElementById("prev-text");
const live_text = document.getElementById("live-text");
const cursor    = document.getElementById("cursor");

// single character in a stupid
// anglo-centric character set:
const valid_ch = /^[ -~]$/;


// delimiters. explicitly checking spaces and newlines might be
// faster? but probably doesn't matter
const split_ch = /\s+/;

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
    
    if (k === 'ENTER')                            insert_char('\n');
    else if (k === 'BACKSPACE' || k === 'DELETE') delete_char();
    else if (k === '+')                           update_model();
    else if (valid_ch.test(k))                    insert_char(k);
    else                                          action_flag = false;

    if (action_flag) {
	e.preventDefault();
	
	console.log(words);
	refresh_view();
    }
    
});

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
	prev = prev.slice(0, -1);
	if (words.length
	    && !split_ch.test(prev[prev.length-1])) {
	    console.log('!');
	    live = words[words.length - 1]; words.pop();
	    prev = prev.slice(0, prev.length - live.length);
	}
    }
}

function update_model () {
    wstop = Math.min(wstop, words.length);
    
    console.log(wstop);
    let tail = words.slice(
	Math.max(0, wstop - m_model.level),
	words.length);
    
    if (tail.length > m_model.level) {
	markov_push(m_model, tail);
	wstop = words.length;
    }

}


let autowrite_interval = 500;

function autowrite () {
    live = '';
    window.setInterval(() => {
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
}

