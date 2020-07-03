const make_engine = (function () {
    
    function make_engine (el) {

	const e = Object.create(engine_prototype);

	e.dom    = make_engine_dom(el);
	e.state  = make_engine_state();
	e.markov = make_markov(2);  // generative model


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
	el_curs.textContent = '_';
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
	    prev:  '', // text already processed
	    live:  '\n', // next word, including last delimiter
	    words: [],
	    wstop: 0
	};
    };
    
    const engine_prototype = Object.assign(
	Object.create(null),
	{
	    valid_re: /^[ -~]$/,
	    insert_char: function (ch) {
		let s = this.state;
		
		if (ch === ' ' || ch === '\n') {
		    if (s.live.length > 1) s.words.push(s.live);
		    s.prev += s.live;
		    s.live = '';
		}
		s.live += ch;
	    },

	    delete_char: function (ch) {
		let s = this.state;
		
		if (s.live.length > 1) {
		    s.live = s.live.slice(0, -1);
		} else {
		    let pred_ch = s.prev[s.prev.length - 1] || '\n';
		    if (pred_ch === ' ' || pred_ch === '\n') {
			s.live = pred_ch;
			s.prev = s.prev.slice(0, -1);
		    } else {
			console.assert(s.words.length > 0);
			s.live = s.words.pop();
			s.wstop = Math.min(s.wstop, s.words.length);
			s.prev = s.prev.slice(0, s.prev.length - s.live.length);
		    }
		}
	    },

	    update_markov: function () {
		let s = this.state;
		let m = this.markov;

		// markov_push helpfully returns the index of the
		// first unprocessed word.
		s.wstop = markov_push(m, s.words, s.wstop);
	    },

	    generate_word: function () {
		let s = this.state;
		let m = this.markov;
		
		let w = markov_next(m, s.words);
		
		if (w !== null) {
		    s.words.push(w);
		    s.prev += w;
		} else {
		    console.log('! insufficient data.');
		}
	    },
	    
	    refresh_view: function (fst, snd) {
		let s = this.state;
		let d = this.dom;

		if (fst === undefined) {
		    fst = (s.prev[0] === '\n')
			? s.prev.slice(1)
			: s.prev;
		    snd = (s.prev === '' && s.live[0] === '\n')
			? s.live.slice(1)
			: s.live;
		}
		else if (snd === undefined) snd = '';

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
