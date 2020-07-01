const edit_box = document.getElementById("text");
const valid_ch = /^[ -~]$/; // stupid anglo-centric character set
const split_ch = /\s+/; // delimiters

let prev_tx = ''; // the text in the input area that's been
// processed so far.

let live_tx = ''; // the text in the input area that hasn't yet
// been processed. usually the last line but
// there are awful edge cases.

let in_word = false;

let m_model = make_markov(2);

edit_box.addEventListener('keydown', e => {
    
    const k = e.key.toUpperCase();
    let action = true
    
    if (k === 'ENTER') {
	// entered a newline.
	live_tx += '\n';
	
    } else if (k === 'BACKSPACE' || k === 'DELETE') {
	// deleted a character.

	// this much slicing cannot be good for my health
	if (live_tx.length) {
	    live_tx = live_tx.slice(0, -1);
	} else {
	    prev_tx = prev_tx.slice(0, -1);
	    in_word = prev_tx.length && !split_ch.test(prev_tx[prev_tx.length-1]);
	}

    } else if (valid_ch.test(k)) {
	// entered a printable ascii character.
	live_tx += k;
	
    } else {
	action = false;
	console.log(k);
    }
    
    edit_box.innerHTML = prev_tx + '<span style="color:#f00">' + live_tx  + '_</span>';

    
    if (action) {
	e.preventDefault();
	edit_box.scrollTop = edit_box.scrollHeight - edit_box.clientHeight;
    }

});


function tail_of (s) {
    let depth = m_model.level;
    let tail = [];
    for (let backcount = 128; ; backcount *= 2) {
	tail = s
	    .slice(-backcount)
	    .split(split_ch).filter(w => w !== '');
	if (tail.length >= depth + 1) {
	    tail = tail.slice(-depth);
	    break;
	} else if (backcount > prev_tx.length) {
	    break;
	}
    }
    return tail;
}

function add_to_model () {

    let depth = m_model.level;

    let tail = tail_of(prev_tx);
    let head = live_tx.split(split_ch).filter(w => w !== '');

    if (tail.length + head.length - (in_word ? 1 : 0) < depth + 1) {
	// if we don't have enough content yet, wait.
	console.log('wait.');
    } else {
	// if we've cut a word in half, paste it back together
	// before adding it to the model.
	let i = 0;
	if (in_word) {
	    tail[tail.length-1] += head[0];
	    ++i;
	    console.log('recover word: ' + tail[tail.length-1]);
	}
	for (; i < head.length; ++i) { tail.push(head[i]); }

	// add to model:
	console.log('add to model: ', tail);
	markov_push(m_model, tail);
	
	in_word = false;
	
	prev_tx += live_tx;
	live_tx = '';
    }

}

let autowrite_timer = undefined;


