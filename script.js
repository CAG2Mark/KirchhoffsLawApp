/* jshint esversion:6 */

const circuitArea = document.getElementById("circuit-area");
const toolbar = document.getElementById("toolbar");

// helpers

function removeFromArray(array, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === item) {
            array.splice(i, 1);
        }
    }
}

document.body.addEventListener('keydown', (e) => {
    if (e.key == "Escape") {
        if (isConnectMode) {
            exitConnectMode();
        }
    }
});

var currentToolbarOverlay;

function showToolbarOverlay(overlay) {

    if (currentToolbarOverlay)
        hideToolbarOverlay();

    setTimeout(() => {

        overlay.style.display = "block";

        setTimeout(() => {
            overlay.style.opacity = "1";

            currentToolbarOverlay = overlay;
        }, 20);

    }, 1);


}

function hideToolbarOverlay() {
    currentToolbarOverlay.style.opacity = "0";
    setTimeout(() => {
        currentToolbarOverlay.style.display = "none";
        currentToolbarOverlay = null;
    }, 200);
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
    setHead(elem, silent, isOrthodox) {

        this.setHeadExtensions(elem);

        // if elem is null, assume that its tail is being deleted
        if (!elem) {

            if (this.head == null) console.log(this);

            // orthodox connections refer to left ro right or right to left connections
            isOrthodox = this.head.tail === this;

            if (!silent) {
                if (isOrthodox)
                    this.head.setTail(null, true);
                else {
                    this.head.setHead(null, true);
                }
            }

            this.rightWire.delete();

            this.head = null;
            this.rightWire = null;
            this.backendComponent.head = null;
            this.element.classList.remove("right-occupied");

            return;
        }

        // assume is orthodox connection unless otherwise stated
        if (isOrthodox === undefined) isOrthodox = true;


        this.head = elem;
        this.backendComponent.head = elem.backendComponent;

        this.element.classList.add("right-occupied");

        if (!this.rightWire && !silent) {

            if (isOrthodox) {
                elem.setTail(this, true);
            } else {
                elem.setHead(this, true);
            }

            let wire = new Wire(this, elem);

            this.rightWire = wire;


            if (isOrthodox) {
                elem.leftWire = wire;
            } else {
                elem.rightWire = wire;
            }

            this.reDrawWires();
        }
    }

    setHeadNode(node, silent) {
        let parent = findComponentFromElem(node.parent);

        if (node.isLeft) {
            this.setHead(parent, silent);
        } else {
            this.setHead(parent, silent, false);
        }
    }

    // always on left side
    setTail(elem, silent, isOrthodox) {

        this.setTailExtensions(elem);
        console.log(this);

        // if elem is null, assume that its tail is being deleted
        if (!elem) {
            // orthodox connections refer to left ro right or right to left connections
            isOrthodox = this.tail.head === this;

            if (!silent) {
                if (isOrthodox)
                    this.tail.setHead(null, true);
                else {
                    this.tail.setTail(null, true);
                }
            }

            this.leftWire.delete();

            this.tail = null;
            this.leftWire = null;
            this.backendComponent.tail = null;
            this.element.classList.remove("left-occupied");

            return;
        }

        // assume is orthodox connection unless otherwise stated
        if (isOrthodox === undefined) isOrthodox = true;

        if (!this.backendComponent) console.log(this);

        this.tail = elem;
        this.backendComponent.tail = elem.backendComponent;



        this.element.classList.add("left-occupied");

        if (!this.leftWire && !silent) {

            if (isOrthodox) {
                elem.setHead(this, true);
            } else {
                elem.setTail(this, true);
            }

            let wire = new Wire(this, elem);

            this.leftWire = wire;


            if (isOrthodox) {
                elem.rightWire = wire;
            } else {
                elem.leftWire = wire;
            }
        }
    }

    setTailNode(node, silent) {
        let parent = findComponentFromElem(node.parent);

        if (!node.isLeft) {
            this.setTail(parent, silent);
        } else {
            this.setTail(parent, silent, false);
        }
    }

    // for overrides to use
    setHeadExtensions(elem) {

    }
    setTailExtensions(elem) {

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
        if (circuitArea.contains(this.element))
            circuitArea.removeChild(this.element);
        if (this.head)
            this.setHead(null);
        if (this.tail)
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


// quick solution: just have the junction be treated in the UI "glue" as two separate components stiched together
class CircuitJunction {
    constructor(juncRootElem) {
        console.log("test");

        this.element = juncRootElem;

        let hElem = juncRootElem.getElementsByClassName("comp-junction-h")[0];
        let vElem = juncRootElem.getElementsByClassName("comp-junction-v")[0];

        this.backendComponent = new Junction();

        this.hComp = new JuncPartH(hElem, this);
        this.vComp = new JuncPartV(vElem, this);

    }

    addConnection() {

    }

    reDrawWires() {
        this.hComp.reDrawWires();
        this.vComp.reDrawWires();
    }

    delete() {
        circuitArea.removeChild(this.element);
        this.hComp.delete();
        this.vComp.delete();
    }
}

class JuncPartH extends CircuitUIComponent {

    constructor(elem, parentJunc) {
        super(elem);

        this.parentJunc = parentJunc;
        this.backendComponent = parentJunc.backendComponent;
        this.parentElement = parentJunc.element;
    }

    setHeadExtensions(elem) {
        this.parentJunc.addConnection(elem);

        if (!elem) {
            this.parentElement.classList.remove("right-occupied");
        } else {
            this.parentElement.classList.add("right-occupied");
        }
    }
    setTailExtensions(elem) {
        this.parentJunc.addConnection(elem);

        if (!elem) {
            this.parentElement.classList.remove("left-occupied");
        } else {
            this.parentElement.classList.add("left-occupied");
        }
    }



}

class JuncPartV extends CircuitUIComponent {

    constructor(elem, parentJunc) {
        super(elem);

        this.parentJunc = parentJunc;
        this.backendComponent = parentJunc.backendComponent;
        this.parentElement = parentJunc.element;
    }

    // overrides

    // left is now bottom
    getLeftAnchor() {
        let offset = $(this.element).offset();
        return new ComponentAnchor(offset.left + this.element.offsetWidth / 2, offset.top + this.element.offsetHeight, false);
    }

    // right is now top
    getRightAnchor() {
        let offset = $(this.element).offset();
        return new ComponentAnchor(offset.left + this.element.offsetWidth / 2, offset.top, true);
    }


    setHeadExtensions(elem) {
        this.parentJunc.addConnection(elem);

        if (!elem) {
            this.parentElement.classList.remove("top-occupied");
        } else {
            this.parentElement.classList.add("top-occupied");
        }
    }
    
    setTailExtensions(elem) {
        console.log("tail extension set");

        this.parentJunc.addConnection(elem);

        if (!elem) {
            this.parentElement.classList.remove("bottom-occupied");
        } else {
            this.parentElement.classList.add("bottom-occupied");
        }
    }
}



const wireTypes = {
    leftToRight: 'lefttoright',
    rightToLeft: 'righttoleft',
    leftToLeft: 'lefttoleft',
    rightToRight: 'righttoright'
};

const thickness = "7px";

class Wire {
    /* Properties:
    wireElem
    comp1
    comp2
    wireType
    */

    constructor(comp1, comp2) {
        // create wire wrapper
        this.wireElem = document.createElement("div");
        this.wireElem.classList.add("circuit-wire");
        circuitArea.appendChild(this.wireElem);

        this.wireElem.style.opacity = 1;
        // create individual wire parts

        // part 1: standard connection
        let wrapperStandard = document.createElement("span");
        wrapperStandard.classList.add("circuit-wire-standard-wrap");
        this.wireElem.appendChild(wrapperStandard);
        this.wrapperStandard = wrapperStandard;
        // populate
        for (var i = 0; i < 4; i++) {
            let newWire = document.createElement("div");
            newWire.classList.add(`circuit-wire-part`);
            newWire.classList.add(`circuit-wire-${i}`);
            wrapperStandard.appendChild(newWire);
        }

        // part 2: hook connection
        let wrapperHook = document.createElement("span");
        wrapperHook.classList.add("circuit-wire-standard-wrap");
        this.wireElem.appendChild(wrapperHook);
        this.wrapperHook = wrapperHook;
        // populate
        for (var j = 0; j < 4; j++) {
            let newWire = document.createElement("div");
            newWire.classList.add(`circuit-wire-part`);
            newWire.classList.add(`circuit-wire-hook-${j}`);
            wrapperHook.appendChild(newWire);
        }

        let newWire = document.createElement("div");
        newWire.classList.add(`circuit-wire-part`);
        newWire.classList.add(`circuit-wire-hook-mid`);
        wrapperHook.appendChild(newWire);

        this.comp1 = comp1;
        this.comp2 = comp2;

        this.init();

        this.reDrawWire();

        this.isDeleted = false;
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

            console.log("Undefined connection!");

        }
    }

    delete() {
        if (!this.isDeleted) {
            this.wireElem.style.opacity = 0;
            this.isDeleted = true;

            setTimeout(() => {
                circuitArea.removeChild(this.wireElem);
            }, 150);
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
                anchor2 = this.comp1.getLeftAnchor();
                anchor1 = this.comp2.getRightAnchor();
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

        // first position the wire
        this.wireElem.style.left = Math.min(anchor1.left, anchor2.left) + "px";
        this.wireElem.style.top = Math.min(anchor1.top, anchor2.top) + "px";

        // now set the size of the wire
        this.wireElem.style.width = Math.abs(anchor1.left - anchor2.left - 1) + "px";
        this.wireElem.style.height = Math.abs(anchor1.top - anchor2.top) + "px";

        // FORMAT
        // if in the form [bool, bool, bool, bool]:
        // then draw it as if it were a border with 7px
        // 
        // if in the form "[bool]:"
        // then it is assuming the connection will be displayed incorrectly if the above method is used
        // if false:
        // then the lower element is on the left
        // if true:
        // then the lower element is on the right
        let wireConfig;

        // cases for these the types of connections
        if (this.wireType == wireTypes.leftToRight || this.wireType == wireTypes.rightToLeft) {

            // determine if the left anchor is below or above the right connector
            // 0 = same height
            // 1 = left is above
            // 2 = left is below
            let v_anchorDeltaIndex = 0;

            if (anchor1.top != anchor2.top) {
                v_anchorDeltaIndex = (anchor1.top < anchor2.top) + 1;
            }

            if (anchor1.left > anchor2.left) {
                wireConfig = [anchor1.top > anchor2.top];
            } else {
                if (v_anchorDeltaIndex <= 1) {
                    wireConfig = [0, 1, 1, 0];
                } else {
                    wireConfig = [0, 0, 1, 1];
                }
            }
        } else if (this.wireType == wireTypes.rightToRight) {
            // two variables, whether or not the first is above the other, and whether or not the first is left of the other

            let isLeft = anchor1.left < anchor2.left;
            let isBelow = anchor1.top < anchor2.top;

            if (isLeft) {
                if (isBelow)
                    wireConfig = [1, 1, 0, 0];
                else {
                    wireConfig = [0, 1, 1, 0];
                }
            } else {
                if (isBelow)
                    wireConfig = [0, 1, 1, 0];
                else {
                    wireConfig = [1, 1, 0, 0];
                }
            }
        } else {
            // two variables, whether or not the first is above the other, and whether or not the first is left of the other

            let isLeft = anchor1.left < anchor2.left;
            let isBelow = anchor1.top < anchor2.top;

            if (!isLeft) {
                if (isBelow)
                    wireConfig = [1, 0, 0, 1];
                else {
                    wireConfig = [0, 0, 1, 1];
                }
            } else {
                if (isBelow)
                    wireConfig = [0, 0, 1, 1];
                else {
                    wireConfig = [1, 0, 0, 1];
                }
            }
        }


        // parse wire config
        if (wireConfig.length == 4) {

            // hide the hook connection
            this.wrapperHook.style.display = "none";
            // show the standard connection
            this.wrapperStandard.style.display = "block";

            for (var i = 0; i < 4; i++) {
                let part = this.wrapperStandard.getElementsByClassName(`circuit-wire-${i}`)[0];
                part.style.display = wireConfig[i] ? "block" : "none";
            }
        } else {

            // hide the standard connection
            this.wrapperStandard.style.display = "none";
            // show the hook connection
            this.wrapperHook.style.display = "block";

            // specifically designed so that alternatly numbered wire parts should be visible
            for (var j = 0; j < 4; j++) {
                let part = this.wrapperHook.getElementsByClassName(`circuit-wire-hook-${j}`)[0];
                part.style.display = (j + wireConfig[0]) % 2 ? "none" : "block";
            }

        }

    }
}

var allComponents = [];

function findComponentFromElem(elem, returnJunctionParent) {

    for (var i = 0; i < allComponents.length; i++) {

        let comp = allComponents[i];

        if (comp.element == elem) {
            return comp;
        }
        // for junction
        if (elem.getAttribute("data-circuit-component") == "junction" ||
            elem.parentElement.getAttribute("data-circuit-component")) {

            if (!(comp instanceof CircuitJunction)) continue;

            if (comp.hComp.element === elem) {
                return returnJunctionParent ? comp : comp.hComp;
            } else if (comp.vComp.element === elem) {
                return returnJunctionParent ? comp : comp.vComp;
            } else if (comp.element === elem) {
                return comp;
            }
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
    enterDragMode();

    currentDraggingElem = clone;

    // prevent native drag drop events
}
//#endregion

//#region Normal drag

var isDragging = false;
var currentDraggingBaseElem;

function draggableMouseDown(elem) {

    if (isConnectMode) return;

    currentDraggingElem = elem;

    elem.ondragstart = function () {
        return false;
    };

    elem.classList.add("dragging");

    isDragging = true;

    enterDragMode();

    // prevent native drag drop events

    // prevent native drag drop events
}

function enterDragMode() {
    showToolbarOverlay(document.getElementById("delete-toolbar"));
}

function exitDragMode() {
    hideToolbarOverlay();
}


//#endregion

//#region  event listeners

document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

// store the cur dragging element's component class
var currentDraggingElemComponent;

var mouseX;
var mouseY;

const deleteToolbar = document.getElementById("delete-toolbar");

function isInToolbarArea() {
    let pos = mouseY;
    let h = toolbar.getBoundingClientRect().height;
    let thresh = document.body.scrollHeight;

    return pos >= thresh - h;
}

function onMouseMove(e) {

    if (isConnectMode) return;

    if (isDraggingBase || isDragging) {

        if (!currentDraggingElemComponent) {
            currentDraggingElemComponent = findComponentFromElem(currentDraggingElem, true);
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

        mouseX = e.pageX;
        mouseY = e.pageY;
    }

    if (isInToolbarArea()) {
        deleteToolbar.classList.add("delete-toolbar-hover");
    } else {
        deleteToolbar.classList.remove("delete-toolbar-hover");
    }
}

function initComponent(elem) {
    // reads from this fixed var instead of the changing one
    var x = elem;

    elem.addEventListener('mousedown', function () {
        draggableMouseDown(x);
    });


    let newComp;
    if (elem.getAttribute("data-circuit-component") == "junction") {
        newComp = new CircuitJunction(elem);
    } else {
        newComp = new CircuitUIComponent(elem);
    }

    allComponents.push(newComp);

    return newComp;
}

function onMouseUp(e) {

    if (isConnectMode) return;

    if (isDraggingBase) {

        if (isInToolbarArea()) {
            circuitArea.removeChild(currentDraggingElem);
        } else {
            isDraggingBase = false;
            // paste onto the drawing area
            circuitArea.appendChild(currentDraggingElem);
            currentDraggingElem.classList.remove("dragging");

            initComponent(currentDraggingElem);
        }

        $(currentDraggingBaseElem).animate({
            opacity: "1"
        }, 200);
    }

    if (isDragging) {
        if (isInToolbarArea()) {
            let comp = findComponentFromElem(currentDraggingElem, true);
            comp.delete();
            removeFromArray(allComponents, comp);
        }

        currentDraggingElemComponent = null;

        isDragging = false;
        currentDraggingElem.classList.remove("dragging");
        currentDraggingElem = null;
    }

    exitDragMode();
}

//#endregion

//#region create components

var cellBase = document.getElementById("cell-base");
var resistorBase = document.getElementById("resistor-base");
var junctionBase = document.getElementById("junction-base");

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

function cloneJunctionBase() {
    let clone = junctionBase.cloneNode(true);
    clone.classList.remove("draggable-base");
    clone.classList.add("draggable");

    return clone;
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
    // also remove the connected nodes of the element
    let comp = findComponentFromElem(elem, true);
    if (comp.head) removeFromArray(allElems, comp.head.element);
    if (comp.tail) removeFromArray(allElems, comp.tail.element);

    let allNodes = [];
    allElems.forEach(o => {

        let isJunction = o.getAttribute("data-circuit-component") == "junction";

        // left
        let nodesLeft = o.getElementsByClassName("comp-circle-left");


        if (nodesLeft[0]) {
            allNodes.push({
                element: nodesLeft[0],
                parent: isJunction ? o.getElementsByClassName("comp-junction-h")[0] : o,
                isLeft: true
            });
        }

        // right
        let nodesRight = o.getElementsByClassName("comp-circle-right");
        if (nodesRight[0]) {
            allNodes.push({
                element: nodesRight[0],
                parent: isJunction ? o.getElementsByClassName("comp-junction-h")[0] : o,
                isLeft: false
            });
        }

        // top (junc only)
        let nodesTop = o.getElementsByClassName("comp-circle-top");
        if (nodesTop[0]) {
            allNodes.push({
                element: nodesTop[0],
                parent: isJunction ? o.getElementsByClassName("comp-junction-v")[0] : o,
                isLeft: false
            });
        }

        // bottom (junc only)
        let nodesBottom = o.getElementsByClassName("comp-circle-bottom");
        if (nodesBottom[0]) {
            allNodes.push({
                element: nodesBottom[0],
                parent: isJunction ? o.getElementsByClassName("comp-junction-v")[0] : o,
                isLeft: true
            });
        }
    });

    return allNodes;
}


var isConnectMode = false;
var connectingLeft = false;
var connectModeElement;

var connectModeNodes;

function connectNode(node, exitMode) {

    let connectModeComponent = findComponentFromElem(connectModeElement);

    if (connectingLeft) {
        connectModeComponent.setTailNode(node);
    } else {
        connectModeComponent.setHeadNode(node);
    }

    if (exitMode) {
        exitConnectMode();
    }
}

function enterConnectMode(elem) {
    connectModeElement = elem;

    let nodes = findFreeNodes(elem);
    nodes.forEach(node => {
        node.element.classList.add("comp-circle-active");
        node.element.onclick = () => connectNode(node, true);
    });

    isConnectMode = true;
    connectModeNodes = nodes;

    circuitArea.classList.add("connect-mode");

    showToolbarOverlay(document.getElementById("connectmode-toolbar"));
}

function exitConnectMode() {
    connectModeNodes.forEach(node => {
        node.element.classList.remove("comp-circle-active");
        node.element.onclick = null;
    });
    isConnectMode = false;

    circuitArea.classList.remove("connect-mode");

    hideToolbarOverlay();
}

function connectCompLeft(elem) {
    connectingLeft = true;
    // procedure: find all unoccipued nodes, unhighlight them, and make them clickable
    enterConnectMode(elem);
}

function connectCompRight(elem) {
    connectingLeft = false;
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