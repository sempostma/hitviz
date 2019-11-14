const hitviz = require('../');
const hit = hitviz();

var h = hit('hit1');
for(let i = 0; i < 20; i++) {
    hit('hit2');
}

console.log(JSON.stringify(h.svg(), null, 4));
