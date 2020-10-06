//#region TEST
// modelling after https://media.discordapp.net/attachments/212472977013342211/714479735018750093/unknown.png
let cell1 = new Cell(6);
let res1 = new Resistor();
res1.resistance = 2;
let res2 = new Resistor();
res2.resistance = 2;
let res3 = new Resistor();
res3.resistance = 2;
let res4 = new Resistor();
res4.resistance = 2;
let cell2 = new Cell(6);
let junc1 = new Junction();
let junc2 = new Junction();
cell1.head = res4;
cell1.tail = res1;
res1.head = cell1;
res1.tail = junc1;
junc1.components = [res1, res2, cell2];
res2.head = junc1;
res2.tail = junc2;
cell2.head = junc1;
cell2.tail = res3;
res3.head = cell2;
res3.tail = junc2;
junc2.components = [res2, res3, res4];
res4.head = junc2;
res4.tail = cell1;
var circ = new Circuit();
circ.components = [cell1, cell2, res1, res2, res3, res4, junc1, junc2];
var segs = circ.generateSegments();
var loops = circ.generateLoops(segs);

let law1Eqns = [];
let law2Eqns = [];
let vars = [];

loops.forEach(loop => {
    let eqns = loop.generateEquations(segs);
    law1Eqns = law1Eqns.concat(eqns[1]);
    law2Eqns = law2Eqns.concat(eqns[0]);
    vars = vars.concat(eqns[2]);
});


vars = vars.filter(onlyUnique);

let eqns = simplifySystem(law2Eqns, law1Eqns, vars.length);
console.log(eqns);
console.log(solveSystem(eqns));


//#endregion