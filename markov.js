/* some generic code for building markov chains & generating text. */
let corpus = {
    alice: [],
    kjb: [],
    dante: [],
};
/*
  for (let k in corpus) {
  fetch('http://localhost:8000/corpus/' + k + '.json')
  .then(resp => resp.json())
  .then(json => { corpus[k] = json; });	    
  }
*/
corpus.toy = [
    "THIS", "IS", "A", "CAT.",
    "THIS", "IS", "NOT", "A", "BAT."
];

function make_leaf () {
    let el = Object.create(null);
    el.total = 0;
    el.next = Object.create(null);
    return el;
}

function make_markov (lvl) {
    let m = Object.create(null);
    m.level = lvl;
    m.tree = make_leaf();
    return m;
}

function markov_push (m, arr) {
    console.log("add to model: " + arr);
    for (let i = m.level; i < arr.length; ++i) {
	let node = m.tree;
	let w;

	for (j = i-m.level; j <= i; ++j) {
	    w = arr[j];
	    ++node.total;
	    node = (node.next[w] = node.next[w] || make_leaf());
	}
	++node.total;
    }
    return m;
}

function markov_select (leaf) {
    let r = Math.random() * leaf.total;
    let s = 0;
    for (let w in leaf.next) {
	if ((s += leaf.next[w].total) > r) { return w; }
    }
}

function markov_step (m, tail, depth) {
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
    tail.push(markov_select(node));
    return tail;
}
