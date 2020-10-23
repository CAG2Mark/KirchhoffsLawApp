/* jshint esversion:6 */

var circuitArea = document.getElementById("circuit-area");

//#region UI Components

class CircuitUIComponent {

    /*
    element;
    backendComponent;
    head;
    tail;

    leftWire;
    rightWire;
    */

    constructor(element) {
        this.element = element;

        let elemType = element.getAttribute("data-circuit-component");
        if (elemType == "cell") {
            this.backendComponent = new Cell();
        } else if (elemType == "resistor") {
            this.backendComponent = new Resistor();
        }
    }

    // always on right side
    // silent refers to whether a wire should be added. usually declared when another element is calling this
    setHead(elem, silent) {
        this.head = elem;
        this.backendComponent.head = elem.backendComponent;

        this.element.classList.add("right-occupied");

        if (!this.rightWire && !silent) {
            let wire = new Wire(this, elem);
            this.rightWire = wire;
            elem.leftWire = wire;

            elem.setTail(this, true);
        }

        this.reDrawWires();


    }

    // always on left side
    setTail(elem, silent) {

        this.tail = elem;
        this.backendComponent.tail = elem.backendComponent;

        this.element.classList.add("left-occupied");

        if (!this.leftWire && !silent) {
            let wire = new Wire(elem, this);
            this.leftWire = wire;
            elem.rightWire = wire;

            elem.setHead(this, true);
        }

        elem.head = this;


        this.reDrawWires();
    }

    // UI helpers
    getLeftAnchor() {
        let offset = $(this.element).offset();
        return new ComponentAnchor(offset.left, offset.top + this.element.offsetHeight / 2, true);
    }

    getRightAnchor() {
        let offset = $(this.element).offset();
        console.log(offset);
        return new ComponentAnchor(offset.left + this.element.offsetWidth, offset.top + this.element.offsetHeight / 2, false);
    }

    reDrawWires() {
        if (this.head) {
            this.rightWire.reDrawWire();
        }
        if (this.tail) {
            this.leftWire.reDrawWire();
        }
    }
}

// will act like a struct, but uses class as struct isn't in native javascript
class ComponentAnchor {

    /*
    left;
    top;
    // by default it is assumed it is the right anchor of the component
    isHead = false;
    */

    constructor(left, top, isHead) {
        this.left = left;
        this.top = top;
        this.isHead = isHead || false;
    }
}

class Wire {
    /* Properties:
    wireElem
    comp1
    comp2
    */

    constructor(comp1, comp2) {
        this.wireElem = document.createElement("div");
        this.wireElem.classList.add("circuit-wire");
        circuitArea.appendChild(this.wireElem);

        this.comp1 = comp1;
        this.comp2 = comp2;

        this.reDrawWire();
    }

    reDrawWire() {

        let anchor1 = this.comp1.getRightAnchor();
        let anchor2 = this.comp2.getLeftAnchor();

        // determine if the left anchor is below or above the right connector
        // 0 = same height
        // 1 = left is above
        // 2 = left is below
        let v_anchorDeltaIndex = 0;
        // if they are perfectly aligned vertically
        let h_anchorDeltaZero = anchor1.left == anchor2.left;

        if (anchor1.top != anchor2.top) {
            v_anchorDeltaIndex = (anchor1.top < anchor2.top) + 1;
        }

        if (v_anchorDeltaIndex == 0) {
            this.wireElem.style.borderWidth = "8px 0 0 0";
        }
        else if (v_anchorDeltaIndex == 1) {
            this.wireElem.style.borderWidth = "0 8px 8px 0";
        }
        else {
            this.wireElem.style.borderWidth = "0 0 8px 8px";
        }


        // first position the wire
        this.wireElem.style.left = Math.min(anchor1.left, anchor2.left) + "px";
        this.wireElem.style.top = Math.min(anchor1.top, anchor2.top) + "px";

        // now set the size of the wire
        this.wireElem.style.width = Math.abs(anchor1.left - anchor2.left) + "px";
        this.wireElem.style.height = Math.abs(anchor1.top - anchor2.top) + "px";
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
draggables.forEach(elem => elem.addEventListener('mousedown', function () {
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

    clone.ondragstart = function () {
        return false;
    };

    clone.classList.add("dragging");
    clone.classList.add("draggable");
    clone.classList.remove("draggable-base");

    circuitArea.appendChild(clone);

    let offset = $(elem).offset();

    clone.style.top = offset.top + "px";
    clone.style.left = offset.left + "px";

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

    elem.ondragstart = function () {
        return false;
    };

    elem.classList.add("dragging");

    isDragging = true;

    // prevent native drag drop events

    // prevent native drag drop events
}

//#endregion

//#region  event listeners

document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

// store the cur dragging element's component class
var currentDraggingElemComponent;

function onMouseMove(e) {
    if (isDraggingBase || isDragging) {

        if (!currentDraggingElemComponent) {
            currentDraggingElemComponent = findComponentFromElem(currentDraggingElem);
        }

        // move y value
        let topVal = parseInt(currentDraggingElem.style.top, 10) + e.movementY;
        currentDraggingElem.style.top = topVal + "px";
        // move x value
        let leftVal = parseInt(currentDraggingElem.style.left, 10) + e.movementX;
        currentDraggingElem.style.left = leftVal + "px";


        if (isDragging) {
            currentDraggingElemComponent.reDrawWires();
        }
    }
}

function initComponent(elem) {
    // reads from this fixed var instead of the changing one
    var x = elem;
    elem.addEventListener('mousedown', function () {
        draggableMouseDown(x);
    });

    allComponents.push(new CircuitUIComponent(elem));
}

function onMouseUp(e) {
    if (isDraggingBase) {
        isDraggingBase = false;
        // paste onto the drawing area
        circuitArea.appendChild(currentDraggingElem);
        currentDraggingElem.classList.remove("dragging");

        initComponent(currentDraggingElem);

        $(currentDraggingBaseElem).animate({
            opacity: "1"
        }, 200);
    }

    if (isDragging) {
        currentDraggingElemComponent = null;

        isDragging = false;
        currentDraggingElem.classList.remove("dragging");
        currentDraggingElem = null;
    }
}

//#endregion

//#region create components

var cellBase = document.getElementById("cell-base");
var resistorBase = document.getElementById("resistor-base");

function cloneCellBase() {
    let clone = cellBase.cloneNode(true);
    clone.classList.remove("draggable-base");
    clone.classList.add("draggable");

    return clone;
}

function cloneResistorBase() {
    let clone = resistorBase.cloneNode(true);
    clone.classList.remove("draggable-base");
    clone.classList.add("draggable");

    return clone;
}

function updateCircuit() {

}


//#region left

function createCompLeft(elem) {
    // for now just insert a resistor
    let newComp = cloneResistorBase();

    circuitArea.appendChild(newComp);

    newComp.style.top = elem.style.top;
    newComp.style.left = (parseInt(elem.style.left, 10) - 300) + "px";

    initComponent(newComp);

    findComponentFromElem(elem).setTail(findComponentFromElem(newComp));
}


function createCompRight(elem) {
    // for now just insert a resistor
    let newComp = cloneResistorBase();

    circuitArea.appendChild(newComp);

    newComp.style.top = elem.style.top;
    newComp.style.left = (parseInt(elem.style.left, 10) + 300) + "px";

    initComponent(newComp);

    findComponentFromElem(elem).setHead(findComponentFromElem(newComp));
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