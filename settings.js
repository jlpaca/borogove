const settings_dom = Object.create(null);

function  settings_init () {
    settings_dom.rng_delay  = document.getElementById('rng-delay');
    settings_dom.rng_freq   = document.getElementById('rng-freq');
    settings_dom.num_weight = document.getElementById('num-weight');
    settings_dom.opt_corpus = document.getElementsByName('opt-corpus');
    settings_dom.file_text  = document.getElementById('file-text');
    settings_dom.file_text_parent = document.getElementById('settings-item-file-text');

    document.getElementById('settings-form').addEventListener('input', settings_get);
}


function settings_get () {

    // grabs settings, performs validation & also updates dom accordingly.
    // always returns an object that is safe to pass to settings_restore.

    let ret = Object.create(null);

    ret.delay = parseFloat(settings_dom.rng_delay.value);
    ret.freq = parseFloat(settings_dom.rng_freq.value);

    ret.weight = parseFloat(settings_dom.num_weight.value);
    if (!(ret.weight >= 0)) {
	ret.weight = 0;
    }

    let o = settings_dom.opt_corpus;
    if (ret.weight <= 0) {
	for (let i = 0; i < o.length; ++i) o[i].disabled = true;
	ret.corpus = undefined;
    } else {
	for (let i = 0; i < o.length; ++i) {
	    o[i].disabled = false;
	    if (o[i].checked) ret.corpus = o[i].value;
	}
    }

    let ft = settings_dom.file_text;
    let fp = settings_dom.file_text_parent;
    if (ret.corpus === 'upload') {
	ft.disabled = false;
	fp.style.visibility = 'visible';
	ret.text = "";
    } else {
	ft.disabled = true;
	fp.style.visibility = 'hidden';
	ret.text = undefined;
    }

    return ret;
}
function settings_restore (s) {

    settings_dom.rng_delay.value = s.rng_delay;
    settings_dom.rng_freq.value = s.rng_freq;

    settings_dom.num_weight.value = s.weight;

    let o = settings_dom.opt_corpus;
    if (s.corpus === undefined) {
	for (let i = 0; i < o.length; ++i) o[i].disabled = true;
    } else {
	for (let i = 0; i < o.length; ++i) {
	    o[i].disabled = false;
	    o[i].checked = (o[i].value === s.corpus)
	}
    }
    let ft = settings_dom.file_text;
    let fp = settings_dom.file_text_parent;
    if (s.text === undefined) {
	ft.disabled = true;
	fp.style.visibility = 'hidden';
    } else {
	ft.disabled = false;
	fp.style.visibility = 'visible';
    }


}

document.addEventListener('DOMContentLoaded', settings_init);
