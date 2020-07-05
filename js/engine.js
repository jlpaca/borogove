const make_engine = (function () {

    function make_engine (args) {
	const e = Object.create(engine_prototype);

	args = args || {};
	args.element = args.element || document.createElement('div');
	args.model  = args.model || { depth: 1, corpus: [], weight: 0 };

	e.reset_state();
	e.reset_markov(args.model.depth,
		       args.model.corpus,
		       args.model.weight);
	e.reset_dom(args.element);

	return e;
    }

    const engine_prototype = Object.assign(
	Object.create(null),
	{
	    valid_re: /^[ -~]$/,
	    reset_state: function () {
		this.state = {
		    prev:  '', // text already processed
		    live:  '\n', // next word, including last delimiter
		    words: [],
		    wstop: 0
		};
	    },

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

	    reset_markov: function (depth, corpus, weight) {
		let s = this.state;

		// throws away the model and builds a new one;
		this.markov = make_markov(depth, corpus, weight);

		// also updates it with all the words we remember on
		// the next opportunity.
		s.wstop = 0;
	    },

	    generate_word: function () {
		let s = this.state;
		let m = this.markov;

		let w = markov_next(m, s.words);

		if (w !== null) {
		    // treat beginning of file as special case.
		    if (!s.words.length) w = '\n' + w.slice(1);
		    s.words.push(w);
		    s.prev += w;
		    return w;
		}
		return null;
	    },

	    reset_dom: function (el) {
		el = el || document.createElement('div');
		while (el.hasChildNodes()) el.removeChild(el.lastChild);

		const el_prev = document.createElement('span');
		el_prev.className = 'prev';
		el.appendChild(el_prev);

		const el_live = document.createElement('span');
		el_live.className = 'live';
		el.appendChild(el_live);

		const el_curs = document.createElement('span');
		el_curs.className = 'curs';
		el_curs.textContent = '_';
		el.appendChild(el_curs);

		el.addEventListener('keydown', this.handle_keydown.bind(this));
		el.addEventListener('mousedown', () => {
		    el.dispatchEvent(new Event('edit-action'));
		});

		this.dom = {
		    edit: el,
		    prev: el_prev,
		    live: el_live,
		    curs: el_curs
		};
	    },

	    update_dom: function (fst, snd) {
		let s = this.state;
		let d = this.dom;

		// optionally supply both fst and snd to override
		// default display of internal state; good for
		// animation and stuff.
		if (fst === undefined) fst = s.prev;
		if (snd === undefined) snd = s.live;

		if (fst[0] === '\n') fst = fst.slice(1);
		if (fst === '' && snd[0] === '\n') snd = snd.slice(1);

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
		    this.dom.edit.dispatchEvent(new Event('edit-action'));
		    this.update_dom();
		}

	    }

	}
    );

    return make_engine;

})();
