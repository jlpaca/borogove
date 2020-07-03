function make_leaf () {
    let el = Object.create(null);
    el.total = 0;
    el.next = Object.create(null);
    return el;
}

function make_markov (lvl, arr, wght) {

    if (lvl === undefined) lvl = 1;
    if (!Array.isArray(arr)) arr = [];
    
    let m = Object.create(null);
    m.level = lvl;
    m.tree = make_leaf();

    markov_push(m, arr);
    if (wght) markov_normalise(m, wght);
    
    return m;
}


function markov_normalise_node (n, weight) {
    for (let k in n.next) {
	markov_normalise_node(n.next[k], n.next[k].total / n.total * weight);
    }
    n.total = weight;
}

function markov_normalise (m, weight) {
    if (!m.tree.total) {
	// cannot normalise a tree with no nodes
	return m;
    }
    markov_normalise_node(m.tree, parseInt(weight));
}

function markov_push (m, arr, start) {
    start = Math.max(m.level, start || m.level);

    let i;
    for (i = start; i < arr.length; ++i) {
	let node = m.tree;
	let w;

	for (j = i-m.level; j <= i; ++j) {
	    w = arr[j];
	    ++node.total;
	    node = (node.next[w] = node.next[w] || make_leaf());
	}
	++node.total;
    }
    console.log('pushed ' + (i - start) + ' words from index ' + start + ' of ' , arr);
    return start + i - start
}

function markov_select (leaf) {
    let r = Math.random() * leaf.total;
    let s = 0;
    for (let w in leaf.next) {
	if ((s += leaf.next[w].total) > r) { return w; }
    }
    return null;
}

function markov_next (m, tail, depth) {
    let len = tail.length;
    if (depth === undefined) { depth = m.level; }
    depth = Math.min(depth, len);

    let node = m.tree;
    let w;
    for (let j = len - depth; j < len; ++j) {
	w = tail[j];
	if (!node.next[w]) {
	    /* if terminated; try with shorter inference */
	    return markov_step(m, tail, depth-1);
	}
	node = node.next[w];
    }

    return markov_select(node);
}
