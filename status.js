(function () {
    let msg_dom = Object.create(null);
    let msg_reset_timer;

    let msg_cache = {
	text: '',
	fill: 0,
	state: 'disabled',
    };
    
    function msg_set (arg) {
	
	let cache = (arg.temp === 0);

	window.clearTimeout(msg_reset_timer);
	
	if (arg.text !== undefined) {
	    msg_dom.text.textContent = arg.text;
	    if (cache) msg_cache.text = arg.text;
	}

	if (arg.state) {
	    msg_dom.elem.className = 'status-msg-' + arg.state;
	    if (cache) msg_cache.state = arg.state;
	}

	if (arg.fill && !(['engaged', 'warning', 'error'].indexOf(arg.state) + 1)) {
	    msg_dom.fill.style.width = arg.fill*100+'%';
	    if (cache) msg_cache.fill = arg.fill;
	} else {
	    msg_dom.fill.style.width = '100%';
	}

	if (arg.temp > 0) msg_reset_timer = window.setTimeout(() => msg_set(msg_cache), 1000*arg.temp);
    }

    function msg_init () {
	msg_dom.elem = document.getElementById('status-msg');
	msg_dom.text = document.getElementById('status-msg-text');
	msg_dom.prog = document.getElementById('status-msg-progress');
	msg_dom.fill = msg_dom.prog.firstChild;

	msg_set(msg_cache);
	
	document.addEventListener('status-msg', e => {
	    let arg = e.detail;

	    msg_set(arg);
	});
    }

    document.addEventListener('DOMContentLoaded', msg_init);
})();
