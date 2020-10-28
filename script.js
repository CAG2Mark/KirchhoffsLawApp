/* jshint esversion:6 */

var circuitArea = document.getElementById("circuit-area");

// helpers

function removeFromArray(array, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === item) {
            array.splice(i);
        }
    }
}

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


        // if elem is null, assume that its tail is being deleted
        if (!elem) {
            if (!silent) {
                this.head.setTail(null, true);
            }
            this.head = null;
            this.rightWire = null;
            this.backendComponent.head = null;
            this.element.classList.remove("right-occupied");
        }

        this.head = elem;
        this.backendComponent.head = elem.backendComponent;

        this.element.classList.add("right-occupied");

        if (!this.rightWire && !silent) {

            elem.setTail(this, true);

            let wire = new Wire(this, elem);

            this.rightWire = wire;
            elem.leftWire = wire;

            this.reDrawWires();
        }


    }

    // always on left side
    setTail(elem, silent) {

        // if elem is null, assume that its tail is being deleted
        if (!elem) {
            if (!silent) {
                this.tail.setHead(null, true);
            }
            this.tail = null;
            this.leftWire = null;
            this.backendComponent.tail = null;
            this.element.classList.remove("left-occupied");
        }

        this.tail = elem;
        this.backendComponent.tail = elem.backendComponent;

        this.element.classList.add("left-occupied");

        if (!this.leftWire && !silent) {
            elem.setHead(this, true);
            let wire = new Wire(elem, this);
            this.leftWire = wire;
            elem.rightWire = wire;
            this.reDrawWires();
        }
    }

    // UI helpers
    getLeftAnchor() {
        let offset = $(this.element).offset();
        return new ComponentAnchor(offset.left, offset.top + this.element.offsetHeight / 2, true);
    }

    getRightAnchor() {
        let offset = $(this.element).offset();
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

    delete() {
        circuitArea.removeChild(this.element);
        this.setHead(null);
        this.setTail(null);
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


const wireTypes = {
    leftToRight: 'lefttoright',
    rightToLeft: 'righttoleft',
    leftToLeft: 'lefttoleft',
    rightToRight: 'righttoright'
}

class Wire {
    /* Properties:
    wireElem
    comp1
    comp2
    wireType
    */

    constructor(comp1, comp2) {
        this.wireElem = document.createElement("div");
        this.wireElem.classList.add("circuit-wire");
        circuitArea.appendChild(this.wireElem);

        this.comp1 = comp1;
        this.comp2 = comp2;

        this.init();

        this.reDrawWire();
    }

    init() {
        if (this.comp1.head === this.comp2 && this.comp2.tail === this.comp1) {
            this.wireType = wireTypes.leftToRight;
        } else if (this.comp1.tail === this.comp2 && this.comp2.head === this.comp1) {
            this.wireType = wireTypes.rightToLeft;
        } else if (this.comp1.tail === this.comp2 && this.comp2.tail === this.comp1) {
            this.wireType = wireTypes.leftToLeft;
        } else if (this.comp1.head === this.comp2 && this.comp2.head === this.comp1) {
            this.wireType = wireTypes.rightToRight;
        } else {
            console.log(this.comp1);
            console.log(this.comp2);

            console.log("Undefined connection!");

        }
    }

    reDrawWire() {

        if (!this.wireType) this.init();

        let anchor1;
        let anchor2;

        switch (this.wireType) {
            case wireTypes.leftToRight:
                anchor1 = this.comp1.getRightAnchor();
                anchor2 = this.comp2.getLeftAnchor();
                break;
            case wireTypes.rightToLeft:
                anchor1 = this.comp1.getLeftAnchor();
                anchor2 = this.comp2.getRightAnchor();
                break;
            case wireTypes.leftToLeft:
                anchor1 = this.comp1.getLeftAnchor();
                anchor2 = this.comp2.getLeftAnchor();
                break;
            case wireTypes.rightToRight:
                anchor1 = this.comp1.getRightAnchor();
                anchor2 = this.comp2.getRightAnchor();
                break;

        }

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

        if (v_anchorDeltaIndex <= 1) {
            this.wireElem.style.borderWidth = "0 7px 7px 0";
        } else {
            this.wireElem.style.borderWidth = "0 0 7px 7px";
        }


        // first position the wire
        this.wireElem.style.left = Math.min(anchor1.left, anchor2.left) + "px";
        this.wireElem.style.top = Math.min(anchor1.top, anchor2.top) + "px";

        // now set the size of the wire
        this.wireElem.style.width = (Math.abs(anchor1.left - anchor2.left) + 1) + "px";
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

    elem.ondragstart = function () {
        return false;
    };

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

    let newComp = new CircuitUIComponent(elem);

    allComponents.push(newComp);

    return newComp;
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
    let newElem = cloneResistorBase();

    circuitArea.appendChild(newElem);

    newElem.style.top = elem.style.top;
    newElem.style.left = (parseInt(elem.style.left, 10) - 300) + "px";

    findComponentFromElem(elem).setTail(initComponent(newElem));

}


function createCompRight(elem) {
    // for now just insert a resistor
    let newElem = cloneResistorBase();

    circuitArea.appendChild(newElem);

    newElem.style.top = elem.style.top;
    newElem.style.left = (parseInt(elem.style.left, 10) + 300) + "px";

    findComponentFromElem(elem).setHead(initComponent(newElem));
}

// helper
// elem param refers to the element that should be excluded
function findFreeNodes(elem) {
    let allElems = Array.from(circuitArea.getElementsByClassName("circuit-icon"));

    if (elem) removeFromArray(allElems, elem);

    let allNodes = [];
    allElems.forEach(o => {
        // left
        let nodesLeft = o.getElementsByClassName("comp-circle-left");

        if (nodesLeft[0]) {
            allNodes.push({
                element: nodesLeft[0],
                parent: o,
                isLeft: true
            })
        }

        // right
        let nodesRight = o.getElementsByClassName("comp-circle-right");
        if (nodesRight[0]) {
            allNodes.push({
                element: nodesRight[0],
                parent: o,
                isLeft: false
            })
        }
    });

    return allNodes;
}

function enterConnectMode(elem) {
    let nodes = findFreeNodes(elem);
    nodes.forEach(node => {
        node.element.style.fill = "red";
    });
}

function connectCompLeft(elem) {
    // procedure: find all unoccipued nodes, unhighlight them, and make them clickable
    enterConnectMode(elem);
}

function connectCompRight(elem) {
    // procedure: find all unoccipued nodes, unhighlight them, and make them clickable
    enterConnectMode(elem);
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