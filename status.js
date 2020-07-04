(function () {
    let msg_dom = Object.create(null);

    function msg_set (arg) {
	if (arg.text) msg_dom.text.textContent = arg.text;

	// update state
	if (arg.state)
	    msg_dom.elem.className = 'status-msg-' + arg.state;

	// some states force filled progress bars
	if (1 + ['engaged', 'warning', 'error'].indexOf(arg.state)) arg.fill = 1;
	if (arg.fill) msg_dom.fill.style.width = arg.fill*100 + "%";
    }

    function msg_init () {
	msg_dom.elem = document.getElementById('status-msg');
	msg_dom.text = document.getElementById('status-msg-text');
	msg_dom.prog = document.getElementById('status-msg-progress');
	msg_dom.fill = msg_dom.prog.firstChild;

	document.addEventListener('status-msg', e => {
	    let arg = e.detail;

	    msg_set(arg);
	});
    }

    document.addEventListener('DOMContentLoaded', msg_init);
})();
