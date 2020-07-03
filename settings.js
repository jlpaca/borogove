(function () {
    const settings_dom = Object.create(null);

    function  settings_init () {
	settings_dom.rng_delay  = document.getElementById('rng-delay');
	settings_dom.rng_freq   = document.getElementById('rng-freq');
	settings_dom.num_weight = document.getElementById('num-weight');
	settings_dom.opt_corpus = document.getElementsByName('opt-corpus');
	settings_dom.file_text  = document.getElementById('file-text');

	document.getElementById('settings-form').addEventListener('input', settings_get);
    }


    function settings_get () {

	// grabs settings, performs validation & also updates dom accordingly.
	// always returns an object that is safe to pass to settings_restore.
	console.log('!s');
	let ret = Object.create(null);

	ret.delay = parseFloat(settings_dom.rng_delay.value);
	ret.freq = parseFloat(settings_dom.rng_freq.value);

	let o = settings_dom.opt_corpus;
	for (let i = 0; i < o.length; ++i) {
	    if (o[i].checked) ret.corpus = o[i].value;
	}

	let w = parseFloat(settings_dom.num_weight.value);
	if (ret.corpus === 'none') {
	    settings_dom.num_weight.disabled = true;
	    ret.weight = undefined;
	} else {
	    settings_dom.num_weight.disabled = false;
	    ret.weight = (ret.weight >= 0) ? ret.weight : 0;
	}

	let ft = settings_dom.file_text;
	if (ret.corpus === 'upload') {
	    ft.disabled = false;

	    if (ft.files.length) {
		ret.text = ft.files[0].text();
	    } else {
		// if a file isn't uploaded yet, treat it as if we aren't using
		// a text corpus when we restore settings.
		ret.text = undefined;
		ret.corpus = 'none';
	    }
	} else {
	    ft.disabled = true;
	    ret.text = undefined;
	}

	return ret;
    }
    function settings_restore (s) {

	settings_dom.rng_delay.value = s.rng_delay;
	settings_dom.rng_freq.value = s.rng_freq;

	let o = settings_dom.opt_corpus;
	for (let i = 0; i < o.length; ++i) {
	    o[i].checked = (o[i].value === s.corpus)
	}

	settings_dom.num_weight.value = s.weight;
	settings_dom.num_weight.disabled = (s.corpus === 'none');

	settings_dom.file_text.disabled = (s.text === undefined);
    }

    window.settings_restore = settings_restore;
    window.settings_get = settings_get;

    document.addEventListener('DOMContentLoaded', settings_init);
})();
