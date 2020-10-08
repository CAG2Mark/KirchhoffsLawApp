//#region Class

class CircuitUIComponent {

    element;
    backendComponent;

    head;
    tail;

    constructor(element) {
        this.element = element;

        let elemType = element.getAttribute("data-circuit-component");
        if (elemType == "cell") {
            this.backendComponent = new Cell();
        }
        else if (elemType == "resistor") {
            this.backendComponent = new Resistor();
        }
    }

    setHead(elem) {
        this.head = elem;
        this.backendComponent.head = elem.backendComponent;
    }

    setTail(elem) {
        this.tail = elem;
        this.backendComponent.tail = elem.backendComponent;
    }
    
}

var allComponents = [];

function findComponentFromElem(elem) {
    for (var i = 0; i < allComponents.length; i++) {
        if (allComponents[i].element == elem) {
            return allComponents[i];
        }
    }
}

//#endregion

// #region init draggables

let draggables = Array.from(document.getElementsByClassName("draggable-base"));
draggables.forEach(elem => elem.addEventListener('mousedown', function() {
    draggableBaseMouseDown(elem);
}));

// #region Base element drag
var isDraggingBase = false;
var currentDraggingBaseElem;

function draggableBaseMouseDown(elem) {

    // clone the element and add the dragging class
    let clone = elem.cloneNode(true);

    // hide item while dragging and make it reappear after
    elem.style.opacity = 0;
    currentDraggingBaseElem = elem;

    clone.ondragstart = function() { return false; }

    clone.classList.add("dragging");
    clone.classList.add("draggable");
    clone.classList.remove("draggable-base");

    document.body.appendChild(clone);

    let offset = $(elem).offset();

    clone.style.top = offset.top + "px";
    clone.style.left = offset.left  + "px";

    isDraggingBase = true;
    currentDraggingElem = clone;

    // prevent native drag drop events
}
//#endregion

//#region Normal drag

var isDragging = false;
var currentDraggingBaseElem;

function draggableMouseDown(elem) {

    currentDraggingElem = elem;

    elem.ondragstart = function() { return false; }

    elem.classList.add("dragging");

    isDragging = true;

    // prevent native drag drop events

    // prevent native drag drop events
}

//#endregion

//#region  event listeners

document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);


function onMouseMove(e) {
    if (isDraggingBase || isDragging) {
        // move y value
        let topVal = parseInt(currentDraggingElem.style.top, 10) + e.movementY;
        currentDraggingElem.style.top = topVal + "px";
        // move x value
        let leftVal = parseInt(currentDraggingElem.style.left, 10) + e.movementX;
        currentDraggingElem.style.left = leftVal + "px";
    }
}

function onMouseUp(e) {
    if (isDraggingBase) {
        isDraggingBase = false;
        // paste onto the drawing area
        document.getElementById("circuit-area").appendChild(currentDraggingElem);
        currentDraggingElem.classList.remove("dragging");

        // reads from this fixed var instead of the changing one
        var x = currentDraggingElem;
        currentDraggingElem.addEventListener('mousedown', function() { draggableMouseDown(x)} );
        $(currentDraggingBaseElem).animate({
            opacity: "1"
        }, 200);
    }

    if (isDragging) {
        isDragging = false;
        currentDraggingElem.classList.remove("dragging");
        currentDraggingElem = null;
    }
}

//#endregion

//#region create components

//#region left

function createComponentLeft() {
    
}

//#endregion

//#region right

//#endregion

//#endregion

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
res2.tail = junc1;
res2.head = junc2;
cell2.tail = junc1;
cell2.head = res3;
res3.head = cell2;
res3.tail = junc2;
junc2.components = [res2, res3, res4];
res4.head = junc2;
res4.tail = cell1;
var circ = new Circuit();
circ.components = [cell1, cell2, res1, res2, res3, res4, junc1, junc2];
var segs = circ.generateSegments();

console.log("Beginning computation!");

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
console.log(solveSystem(eqns).symbol);


//#endregion