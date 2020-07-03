const make_engine = (function () {
    
    function make_engine (el) {

	const e = Object.create(engine_prototype);

	e.dom    = make_engine_dom(el);
	e.state  = make_engine_state();
	e.markov = make_markov();  // generative model


	//e.elem.addEventListener('focus', autowrite_enable);
	//e.elem.addEventListener('blur', autowrite_disable);
	const el_cursor = document.createElement('cursor');

	
	e.dom.edit.addEventListener('keydown', e.handle_keydown.bind(e));
	
	return e;
    }
    
    function make_engine_dom (el) {
	const el_edit = el || document.createElement('div');
	while (el.hasChildNodes()) el.removeChild(el.lastChild);

	const el_prev = document.createElement('span');
	el_prev.className = 'prev';
	el_edit.appendChild(el_prev);
	
	const el_live = document.createElement('span');
	el_live.className = 'live';
	el_edit.appendChild(el_live);
	
	const el_curs = document.createElement('span');
	el_curs.className = 'curs';
	el_edit.appendChild(el_curs);   
	
	return {
	    edit: el_edit,
	    prev: el_prev,
	    live: el_live,
	    curs: el_curs
	};
	
    };

    function make_engine_state () {
	return 	{
	    prev: '', // text already processed
	    live: '', // text to be processed on next update
	    words: [],
	    wstop: 0
	};
    };
    
    const engine_prototype = Object.assign(
	Object.create(null),
	{
	    valid_re: /^[ -~]$/,
	    split_ch: ' ',

	    insert_char: function (ch) {
		let s = this.state;
		
		if (ch === ' ') {
		    if (s.live.length) s.words.push(s.live);
		    s.prev += s.live + ch;
		    s.live = '';
		} else {
		    // this is a trick (TM) : every line has a trailing space
		    // appended to it so that when we split the line at spaces we
		    // remember the beginning of lines. delete_char treats this
		    // special case by removing two characters instead of one
		    // whenever backspacing into a newline.		

		    s.live += (ch === '\n' ? ' \n' : ch);
		}
	    },

	    delete_char: function (ch) {
		let s = this.state;
		
		if (s.live.length) {
		    s.live = s.live.slice(0, -1);
		} else {
		    let deleted_ch = s.prev[s.prev.length - 1];
		    
		    // check for the newline trick
		    s.prev = s.prev.slice(0, deleted_ch === '\n' ? -2 : -1);

		    // check if we've backspaced into a previous word
		    let preceding_ch = s.prev[s.prev.length - 1];
		    if (s.words.length && (preceding_ch !== ' ')) {
			s.live = s.words.pop();
			s.wstop = Math.min(s.wstop, s.words.length);
			s.prev = s.prev.slice(0, s.prev.length - s.live.length);
		    }
		}
	    },

	    update_markov: function () {
		let s = this.state;
		let m = this.markov;

		console.log('index of first unprocessed word: ' + s.wstop);
		
		let tail = s.words.slice(Math.max(0, s.wstop - m.level));
		s.wstop += markov_push(m, tail);
	    },

	    generate_word: function () {
		let s = this.state;
		let m = this.markov;
		
		let w = markov_step(m, s.words);
		s.prev += w + ' ';
	    },
	    
	    refresh_view: function (fst, snd) {
		let s = this.state;
		let d = this.dom;
		
		fst = fst || s.prev;
		snd = snd || s.live;

		d.prev.textContent = fst;
		d.live.textContent = snd;
		d.curs.scrollIntoView({
		    block: 'nearest',
		    behavior: 'smooth'
		});
		
	    },

	    handle_keydown: function (ev) {
		
		let k = ev.key.toUpperCase();

		let action_flag = true;

		if (k === 'ENTER') this.insert_char('\n');
		else if (k === 'BACKSPACE' || k === 'DELETE') this.delete_char();
		else if (k === 'ESCAPE') {
		    this.dom.edit.blur();
		    // autowrite_disable();
		    action_flag = false;
		}
		else if (k === '+')             this.update_markov(); // for testing
		else if (k === '-')             this.generate_word(); // for testing
		else if (this.valid_re.test(k)) this.insert_char(k);
		else                            action_flag = false;

		if (action_flag) {
		    ev.preventDefault();

		    this.refresh_view();
		    // autowrite_reset();
		}

	    }

	}
    );

    return make_engine;
    
})();
