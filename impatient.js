(function () {
    let imp_engine = null;
    let imp_dom = Object.create(null);

    let imp_start_ms = Date.now();
    let imp_elaps_ms = 0;

    let imp_delay_ms = 1000;
    let imp_interval_ms = 300;

    let imp_enabled = false;
    let imp_writing = null;

    function imp_enable () {
	imp_enabled = true;
	imp_start_ms = Date.now() - imp_elaps_ms;
	imp_tick();
    }

    function  imp_disable () {
	imp_writing_stop();
	imp_enabled = false;
    }

    function imp_writing_start () {
	// "the imp is writing..."
	if  (imp_writing === null) {
	    imp_writing = window.setInterval(() => {
		imp_engine.generate_word();
		imp_engine.update_dom();
	    }, imp_interval_ms);
	}
    }
    function imp_writing_stop () {
	window.clearInterval(imp_writing);
	imp_writing = null;
    }

    function imp_interrupt() {
	if (imp_writing) imp_writing_stop();
	imp_start_ms = Date.now();
    }

    function imp_tick () {
	if (!imp_enabled) return;

	imp_elaps_ms = Date.now() - imp_start_ms;

	if (imp_elaps_ms > imp_delay_ms) imp_writing_start();

	window.requestAnimationFrame(imp_tick);

    }
    function imp_set_delay () {
	// 0 - 1 correspond exponentially to 1 - 60 s
	v = parseFloat(imp_dom.delay.value);
	let sec = 1.0*Math.exp(Math.log(60/1.0)*v);
	imp_delay_ms = sec*1000;
	imp_dom.delay.labels[0].textContent = 'delay: ' + sec.toFixed(1) + 's';
    }

    function imp_set_freq () {
	// from 20 - 280 wpm, some sort of janky inverse-exponential curve
	v = parseFloat(imp_dom.freq.value);
	let wpm = 20*Math.exp(Math.log(280/20)*v);
	imp_interval_ms = 60000/wpm;
	imp_dom.freq.labels[0].textContent = 'frequency: ' + wpm.toFixed(0) + 'wpm';
    }

    function opt_get (el, transform) {
	let v = undefined;
	for (let i = 0; i < el.length; ++i)
	    if (el[i].checked) v = el[i].value;

	if (transform === undefined) return v;
	return transform(v);
    }

    function imp_set_depth () {

	let v = opt_get(imp_dom.depth, parseInt);

	// only rebuild the model if we've changed the inference depth.
	if (v !== imp_engine.markov.level) {
	    imp_engine.reset_markov(v, [], 0);
	}
    }

    async function get_corpus_from_url (url) {
	let arr = await fetch(url)
	    .then(res => res.json());
	return arr;
    }
    async function get_corpus_from_file (f) {
	let text = await f.text();
	let arr = text
	    .replace(/[^\x00-\x7F]/g, '')
	    .toUpperCase().split(/(?= )|(?=\n)/)
	    .filter(w => !(w === '' || w === '\n'));
	return arr;
    }

    function imp_set_corpus () {

	let v = opt_get(imp_dom.corpus);
	let w = parseInt(imp_dom.weight.value);

	let ret;
	if (v === 'upload') {
	    // read & process uplaoded file.
	    if (imp_dom.upload.files.length) {
		ret = get_corpus_from_file(imp_dom.upload.files[0]);
	    } else {
		imp_dom.upload.setCustomValidity('Please select a text file to be uploaded.');
		return;
	    }
	} else {
	    // fetch corpus json
	    let url = 'http://localhost:8000/corpus/' +  v + '.json';
	    ret = get_corpus_from_url(url);
	}
	ret.then(
	    arr => {
		console.log(arr.length - imp_engine.markov.level);
		console.log(imp_engine.markov.tree.total);
		let m = imp_engine.markov;
		let len_import = arr.length - m.level;
		let len_present = m.tree.total;

		if (len_present && len_import > 0) {
		    markov_normalise(m, len_import/w*len_present);
		}
		markov_push(m, arr);
		console.log('w: ', w + len_present);
		markov_normalise(m, w + len_present);
	    },
	    err => console.log('Encountered error while loading text corpus.'));

    }

    function imp_init () {
	imp_engine = make_engine({ element: document.getElementById('edit-box') });

	// awful, awful user interface code:

	imp_engine.dom.edit.addEventListener('focus', imp_enable);
	imp_engine.dom.edit.addEventListener('blur', imp_disable);
	imp_engine.dom.edit.addEventListener('edit-action', imp_interrupt);

	imp_dom.corpus_grp = document.getElementById('opt-corpus-group');
	imp_dom.corpus     = document.getElementsByName('opt-corpus');
	imp_dom.upload     = document.getElementById('file-upload');
	imp_dom.weight     = document.getElementById('num-weight');
	imp_dom.corpus_btn = document.getElementById('btn-import');

	imp_dom.depth_grp = document.getElementById('opt-depth-group');
	imp_dom.depth     = document.getElementsByName('opt-depth');

	imp_dom.delay = document.getElementById('rng-delay');
	imp_dom.freq  = document.getElementById('rng-freq');


	imp_dom.freq .addEventListener('input', imp_set_freq);
	imp_dom.delay.addEventListener('input', imp_set_delay);

	imp_dom.corpus_btn.addEventListener('click', imp_set_corpus);

	imp_dom.corpus_grp.addEventListener('input', e => {
	    imp_dom.upload.disabled = (opt_get(imp_dom.corpus) !== 'upload');
	});

	imp_dom.depth_grp.addEventListener('input', imp_set_depth);

    }

    document.addEventListener('DOMContentLoaded', imp_init);
})();
