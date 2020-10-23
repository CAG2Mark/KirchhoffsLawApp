// ASSUME CONVENTIONAL CIRCUITS
// CURRENT FLOWS FROM +ve TO -ve
//#region helpers
function arrIncludes(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj)
            return true;
    }
    return false;
}
function arr2DIncludes(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (arrEqual(array[i], obj))
            return true;
    }
    return false;
}
function loopsInclude(loops, loop) {
    for (var i = 0; i < loops.length; i++) {
        if (loopsEqual(loops[i], loop))
            return true;
    }
    return false;
}
function loopsEqual(loop1, loop2) {
    if (loop1.segments.length != loop2.segments.length)
        return false;
    var arr1 = [];
    loop1.segments.forEach(seg => {
        arr1.push(seg.compId);
    });
    var arr2 = [];
    loop2.segments.forEach(seg => {
        arr2.push(seg.compId);
    });
    arr1 = arr1.concat().sort();
    arr2 = arr2.concat().sort();
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}
function arrRemove(ogArr, obj) {
    let array = [...ogArr];
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj) {
            array.splice(i, 1);
        }
    }
    return array;
}
// Source: https://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values
function arrEqual(_arr1, _arr2) {
    if (!Array.isArray(_arr1) || !Array.isArray(_arr2) || _arr1.length !== _arr2.length)
        return false;
    var arr1 = _arr1.concat().sort();
    var arr2 = _arr2.concat().sort();
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}
function segmentsEqual(seg1, seg2) {
    if (seg1.components.length != seg2.components.length)
        return false;
    var arr1 = [];
    seg1.components.forEach(comp => {
        arr1.push(comp.compId);
    });
    var arr2 = [];
    seg2.components.forEach(comp => {
        arr2.push(comp.compId);
    });
    arr1 = arr1.concat().sort();
    arr2 = arr2.concat().sort();
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}
//#endregion
// for generating component ids
var curIdNo = 0;
function getId() {
    curIdNo++;
    return curIdNo;
}
// suffixes
var resistanceSuffix = "res";
var pdSuffix = "pd";
var emfSuffix = "emf";
class Cell {
    constructor(emf) {
        this.emf = emf;
        this.pd = emf;
        this.resistance = 0;
        this.remainingEmf = emf;
        this.isTailToHead = false;
        this.compId = "cell" + getId();
    }
    approachFrom(component) {
        let deltaEmf = this.emf;
        // if approaching from the tail (the negative terminal)
        // then it charges the cell.
        if (component === this.tail) {
            deltaEmf = -deltaEmf;
        }
        // but reverse it again if it the cell is inverted
        if (this.isTailToHead) {
            deltaEmf = -deltaEmf;
        }
        this.remainingEmf = component.remainingEmf + deltaEmf;
        this.toNextComponent(component);
    }
    getDeltaEmfEquation(curSegment, curJunction) {
        let negative = curSegment.endJunction === curJunction;
        // but reverse it again if it the cell is inverted
        if (this.isTailToHead) {
            negative = !negative;
        }
        return (
        // negative sign
        negative ? "-" : "") +
            // variable or number
            (this.emf == null ? this.compId : this.emf.toString());
    }
    // the previous component specifies where this component was approached from
    toNextComponent(previousComponent) {
        this.getNextComponent(previousComponent).approachFrom(this);
    }
    getNextComponent(previousComponent) {
        return (previousComponent === this.tail) ? this.head : this.tail;
    }
    // Returns the next component based on the direction of the cell termianls.
    getNextLogicalComponent() {
        return !this.isTailToHead ? this.tail : this.head;
    }
}
class Resistor {
    constructor() {
        this.compId = "res" + getId();
    }
    approachFrom(component) {
    }
    toNextComponent(previousComponent) { }
    getNextComponent(previousComponent) {
        return (previousComponent === this.tail) ? this.head : this.tail;
    }
}
class Junction {
    approachFrom(component) {
    }
    toNextComponent(reviousComponent) {
    }
    getNextComponent(previousComponent) {
        return null;
    }
}
//  HIERARCHY:
//  CIRCUIT
//  |_  COMPONENT
//
//  LOOP
//  |_  SEGMENT
//      |_  COMPONENT
// Represents the whole circuit.
class Circuit {
    generateSegments() {
        // to be returned
        let segments = [];
        let i = 1;
        // Assign all junctions an ID
        this.components.forEach(com => {
            if (com instanceof Junction) {
                // get all components between this and the next junction
                let junc = com;
                junc.id = i;
                i++;
            }
        });
        this.components.forEach(com => {
            if (com instanceof Junction) {
                let junc = com;
                junc.components.forEach(subCom => {
                    var newSegment = new Segment();
                    newSegment.startJunction = junc;
                    // iterate through the next set of components until a junction is reached
                    var currentCom = subCom;
                    var prevComb = junc;
                    while (!(currentCom instanceof Junction)) {
                        // add the components to the necessary arrays
                        newSegment.components.push(currentCom);
                        // move to the next component
                        let temp = currentCom;
                        currentCom = currentCom.getNextComponent(prevComb);
                        prevComb = temp;
                    }
                    let isDuplicate = false;
                    segments.forEach(seg => {
                        if (segmentsEqual(seg, newSegment) && !isDuplicate) {
                            isDuplicate = true;
                        }
                    });
                    if (!isDuplicate) {
                        newSegment.endJunction = currentCom;
                        segments.push(newSegment);
                    }
                });
                i++;
            }
        });
        if (segments.length == 0)
            return [new Segment(this.components)];
        return segments;
    }
    generateLoops(segments) {
        let cellSegments = [];
        // As I have to add a cell to a loop
        let cells = [];
        // First, find segments that contain cells.
        segments.forEach(seg => {
            // use a for loop as it can accept the break keyword
            for (var i = 0; i < seg.components.length; i++) {
                if (seg.components[i] instanceof Cell) {
                    cellSegments.push(seg);
                    cells.push(seg.components[i]);
                    break;
                }
            }
        });
        // If it's a circuit comprised of only one loop
        if (segments.length == 1)
            return [new Loop([segments[0]], cells[0])];
        // Will be returned
        let foundLoops = [];
        // Branch out from the segments.
        for (var i = 0; i < cellSegments.length; i++) {
            let seg = cellSegments[i];
            // goal is to get from start junction to end junction.
            // segments for this loop - copy.
            let workingSegments = [...segments];
            // remove the starting segment
            workingSegments = arrRemove(workingSegments, seg);
            let branches = Circuit.findBranches(seg.startJunction, seg.endJunction, workingSegments);
            branches.forEach(branch => {
                branch.push(seg);
                var newLoop = new Loop(branch, cells[i]);
                // check for duplicate
                if (!loopsInclude(foundLoops, newLoop)) {
                    foundLoops.push(newLoop);
                }
            });
        }
        ;
        return foundLoops;
    }
    // recursive function to find all the branches possible
    static findBranches(startJunc, endJunc, segments) {
        // goal is to get from start junction to end junction.
        // get the list of segments branching out from this.
        let foundSegments = Circuit.findSegmentsFromJunction(startJunc, segments);
        if (foundSegments.length == 0) {
            return null;
        }
        ;
        let found = [];
        foundSegments.forEach(foundSegment => {
            // BASE CASE. if it has succesfully returned to the end junction then it was successful.
            if (arrIncludes(foundSegment.getJunctionIds(), endJunc.id)) {
                found.push([foundSegment]);
            }
            else {
                // Copy the working segments and remove the current found segment.
                // This means that there will be no paths where one loop crosses the same segment twice.
                let workingSegments = [...segments];
                arrRemove(workingSegments, foundSegment);
                // Find the next branches recursively.
                let newBranches = this.findBranches(foundSegment.startJunction, endJunc, workingSegments);
                // Add the found branch.
                newBranches.forEach(newBranch => {
                    if (newBranch != null) {
                        found.push([foundSegment, ...newBranch]);
                    }
                });
            }
        });
        return found;
    }
    static findSegmentsFromJunction(junc, segments) {
        let found = [];
        let id = junc.id;
        segments.forEach(seg => {
            if (arrIncludes(seg.getJunctionIds(), id)) {
                found.push(seg);
            }
        });
        return found;
    }
}
// Represents one loop in a circuit. Ie, a circuit with one parallel branch and 1 cell would have 2 loops.
class Loop {
    constructor(segments, anyCell) {
        this.segments = segments;
        this.anyCell = anyCell;
    }
    getComponents() {
        let components = [];
        this.segments.forEach(seg => {
            seg.components.forEach(comp => {
                components.push(comp);
            });
        });
        return components;
    }
    // All segments in the circuit.
    // The first array is the law 2 (loop law) equation.
    // The second array are the junction equations.
    // The third array contains all variables used.
    generateEquations(allSegments) {
        let startingCell = this.anyCell;
        let allJunctions = [];
        // variables used
        let variables = [];
        //#endregion
        // FORMAT:
        // If it ADDS emf, make it negative.
        // If it USES UP emf, make it positive.
        //#region Law 2
        // Iterate through all the components until returned to the starting cell.
        let curComponent = startingCell.getNextLogicalComponent();
        let prevComponent = startingCell;
        // pre-initialise
        let components = this.getComponents();
        // Find the closest previous junction.
        let curJunction;
        let prev = curComponent;
        let next = prevComponent;
        while (!(next instanceof Junction)) {
            let temp = next;
            next = next.getNextComponent(prev);
            prev = temp;
        }
        curJunction = next;
        // Initialize with the starting cell already there.
        let law2Expressions = [startingCell.getDeltaEmfEquation(findParentSegment(startingCell, this.segments), curJunction)];
        while (curComponent !== startingCell) {
            if (curComponent instanceof Junction) {
                let junc = curComponent;
                // search for the next component and set it as the next component
                let workingComponents = arrRemove([...components], prevComponent);
                for (var i = 0; i < junc.components.length; i++) {
                    let juncComp = junc.components[i];
                    let breakFlag = false;
                    for (var j = 0; j < workingComponents.length; j++) {
                        if (juncComp === workingComponents[j]) {
                            let temp = curComponent;
                            curComponent = workingComponents[j];
                            prevComponent = temp;
                            curJunction = junc;
                            // Add the current junction to the list of junctions in preparation for law 1 calculation
                            allJunctions.push(junc);
                            breakFlag = true;
                            break;
                        }
                    }
                    if (breakFlag)
                        break;
                }
            }
            else {
                // find the current segment
                let curSegment = findParentSegment(curComponent, this.segments);
                if (curComponent instanceof Cell) {
                    law2Expressions.push(curComponent.getDeltaEmfEquation(curSegment, curJunction));
                }
                else {
                    let eqns = generatePdEquation(curSegment, curComponent, curJunction);
                    law2Expressions.push(eqns[0][0]);
                    // add vars
                    variables = variables.concat(eqns[1]);
                }
                let temp = curComponent;
                curComponent = curComponent.getNextComponent(prevComponent);
                prevComponent = temp;
            }
        }
        let law2Equation = "";
        law2Expressions.forEach(expr => {
            law2Equation += (expr + " + ");
        });
        // remove the final " + "
        law2Equation = law2Equation.substring(0, law2Equation.length - 3);
        law2Equation += " = 0";
        //#endregion
        //#region LAW 1
        let law1Equations = [];
        allJunctions.forEach(junc => {
            let equation = "";
            junc.components.forEach(comp => {
                let segment = findParentSegment(comp, allSegments);
                equation += ("(" + segment.getOutputCurrentExpr(junc) + ") + ");
            });
            equation = equation.substring(0, equation.length - 3);
            equation += " = 0";
            law1Equations.push(equation);
        });
        //#endregion
        return [[law2Equation], law1Equations, variables];
    }
}
function findParentSegment(componentToFind, segments) {
    for (var i = 0; i < segments.length; i++) {
        let seg = segments[i];
        for (var j = 0; j < seg.components.length; j++) {
            var comp = seg.components[j];
            if (comp === componentToFind) {
                return seg;
            }
        }
    }
    return null;
}
// Generates the PD equation given the inputs, and also output the non-constant variables.
function generatePdEquation(segment, comp, approachingJunction) {
    let isNegative = approachingJunction === segment.endJunction;
    let curStr = segment.current == null ?
        (isNegative ? "-" : "") + segment.compId :
        ((isNegative ? -1 : 1) * segment.current).toString();
    //let curStr:string = "somecurrent";
    let resStr = comp.resistance == null ? segment.compId + resistanceSuffix : comp.resistance.toString();
    let variables = [];
    if (segment.current == null)
        variables.push(segment.compId);
    if (comp.resistance == null)
        variables.push(comp.compId + resistanceSuffix);
    return [["((" + curStr + ") * (" + resStr + "))"], variables];
}
function generateResistanceEquation(segment, comp) {
    let curStr = segment.current == null ? segment.compId : segment.current.toString();
    let pdStr = comp.pd == null ? segment.compId + pdSuffix : comp.pd.toString();
    return "((" + curStr + ") * (" + pdStr + "))";
}
// Represents a segment of the circuit where the current is constant, ie between junctions. 
class Segment {
    constructor(components) {
        this.components = [];
        if (components != null) {
            this.components = components;
        }
        this.compId = "current" + getId();
    }
    getJunctionIds() {
        return [
            this.startJunction.id,
            this.endJunction.id
        ];
    }
    getOutputCurrentExpr(outputJunction) {
        let isNegative = outputJunction === this.startJunction;
        if (this.current == null) {
            return (isNegative ? "-" : "") + this.compId;
        }
        else {
            return ((isNegative ? -1 : 1) * this.current).toString();
        }
    }
}
//# sourceMappingURL=circuit.js.map