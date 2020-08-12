// ASSUME CONVENTIONAL CIRCUITS
// CURRENT FLOWS FROM +ve TO -ve

//#region helpers

function arrIncludes<T>(array: T[], obj: T):boolean {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj) return true;
    }
    return false;
}

function arr2DIncludes<T>(array: T[][], obj: T[]):boolean {
    for (var i = 0; i < array.length; i++) {
        if (arrEqual(array[i],obj)) return true;
    }
    return false;
}

function loopsInclude(loops: Loop[], loop: Loop):boolean {
    for (var i = 0; i < loops.length; i++) {
        if (loopsEqual(loops[i], loop)) return true;
    }
    return false;
}

function loopsEqual(loop1: Loop, loop2: Loop):boolean {
    if (loop1.segments.length != loop2.segments.length) return false;

    var arr1:string[] = [];
    loop1.segments.forEach(seg => {
        arr1.push(seg.compId);
    });
    var arr2:string[] = [];
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

function arrRemove<T>(ogArr: T[], obj: T):T[] {
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

    if (!Array.isArray(_arr1) || ! Array.isArray(_arr2) || _arr1.length !== _arr2.length)
      return false;

    var arr1 = _arr1.concat().sort();
    var arr2 = _arr2.concat().sort();

    for (var i = 0; i < arr1.length; i++) {

        if (arr1[i] !== arr2[i])
            return false;

    }

    return true;
}

function segmentsEqual(seg1:Segment, seg2:Segment) {

    if (seg1.components.length != seg2.components.length) return false;

    var arr1:string[] = [];
    seg1.components.forEach(comp => {
        arr1.push(comp.compId);
    });
    var arr2:string[] = [];
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
function getId():number {
    curIdNo++;
    return curIdNo;
}

// suffixes
var resistanceSuffix = "res";
var pdSuffix = "pd";
var emfSuffix = "emf";

interface ICircuitPart {

}

interface IComponent {
    tail: IComponent;
    head: IComponent;

    pd: number; // voltage
    resistance: number;
    remainingEmf: number;

    compId: string;

    approachFrom(component: IComponent): void;
    toNextComponent(previousComponent: IComponent): void;
    getNextComponent(previousComponent: IComponent): IComponent;
}

class Cell implements IComponent {
    // assume this is an ideal cell
    // so the EMF is the same as the PD

    // POSITIVE TERMINAL AT HEAD
    // NEGATIVE TERMINAL AT TAIL
    // (By default)
    // Current flows from head to tail
    tail: IComponent;
    head: IComponent;

    pd: number;
    resistance: number;
    remainingEmf: number;

    compId: string;

    emf: number;

    // Changes it so that current flows from the tail to head
    isTailToHead: boolean;

    constructor(emf: number) {
        this.emf = emf;
        this.pd = emf;
        this.resistance = 0;
        this.remainingEmf = emf;
        this.isTailToHead = false;

        this.compId = "cell" + getId();
    }

    approachFrom(component: IComponent) {
        let deltaEmf = this.emf;
        // if approaching from the tail (the negative terminal)
        // then it charges the cell.
        if (component === this.tail) {
            deltaEmf = -deltaEmf
        }

        // but reverse it again if it the cell is inverted
        if (this.isTailToHead) {
            deltaEmf = -deltaEmf
        }

        this.remainingEmf = component.remainingEmf + deltaEmf;

        this.toNextComponent(component)
    }

    getDeltaEmfEquation(approachingFrom: IComponent) {
        let negative = false
        // if approaching from the tail (the negative terminal)
        // then it charges the cell.
        if (approachingFrom === this.tail) {
            negative = true;
        }

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
    toNextComponent(previousComponent: IComponent) {
        this.getNextComponent(previousComponent).approachFrom(this);
    }

    getNextComponent(previousComponent: IComponent) {
        return (previousComponent === this.tail) ? this.head : this.tail;
    }

    // Returns the next component based on the direction of the cell termianls.
    getNextLogicalComponent() {
        return !this.isTailToHead ? this.tail : this.head;
    }
}

class Resistor implements IComponent {
    tail: IComponent;
    head: IComponent;

    pd: number;
    resistance: number;
    remainingEmf: number;

    compId: string;

    approachFrom(component: IComponent) {

    }

    toNextComponent(previousComponent: IComponent) {}

    getNextComponent(previousComponent: IComponent) {
        return (previousComponent === this.tail) ? this.head : this.tail;
    }

    constructor() {
        this.compId = "res" + getId();
    }
}

class Junction implements IComponent {

    tail: IComponent;
    head: IComponent;

    id: number;
    compId: string;

    components: IComponent[];

    pd: number; // voltage
    resistance: number;
    remainingEmf: number;

    approachFrom(component: IComponent) {

    }

    toNextComponent(reviousComponent: IComponent): void {

    }

    getNextComponent(previousComponent: IComponent) {
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
    components: IComponent[];

    generateSegments() {

        // to be returned
        let segments: Segment[] = [];

        let i: number = 1;

        // Assign all junctions an ID
        this.components.forEach(com => {
            if (com instanceof Junction) {

                // get all components between this and the next junction
                let junc: Junction = < Junction > com;
                junc.id = i;
                i++;
            }
        });

        this.components.forEach(com => {
            if (com instanceof Junction) {

                let junc: Junction = <Junction> com;

                junc.components.forEach(subCom => {

                    var newSegment = new Segment();
                    newSegment.startJunction = junc;

                    // iterate through the next set of components until a junction is reached
                    var currentCom: IComponent = subCom;
                    var prevComb: IComponent = junc;

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
                        newSegment.endJunction = <Junction>currentCom;
                        segments.push(newSegment);
                    }

                    

                });
                i++;
            }
        });

        if (segments.length == 0) return [new Segment(this.components)];

        return segments;
    }

    public generateLoops(segments: Segment[]):Loop[] {

        let cellSegments:Segment[] = [];
        // As I have to add a cell to a loop
        let cells:Cell[] = [];

        // First, find segments that contain cells.
        segments.forEach(seg => {

            // use a for loop as it can accept the break keyword
            for (var i = 0; i < seg.components.length; i++) {
                if (seg.components[i] instanceof Cell) {
                    cellSegments.push(seg);
                    cells.push(<Cell>seg.components[i]);
                    break;
                }
            }
        });

        // If it's a circuit comprised of only one loop
        if (segments.length == 1) return [new Loop([segments[0]], cells[0])];

        // Will be returned
        let foundLoops:Loop[] = [];

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
                if (!loopsInclude(foundLoops,newLoop)) {
                    foundLoops.push(newLoop)
                }
            });
        };

        return foundLoops;
    }

    // recursive function to find all the branches possible
    private static findBranches(startJunc:Junction, endJunc:Junction, segments:Segment[]):Segment[][] {
        // goal is to get from start junction to end junction.

        
        // get the list of segments branching out from this.
        let foundSegments = Circuit.findSegmentsFromJunction(startJunc, segments);

        if (foundSegments.length == 0) {
            return null;
        };

        let found:Segment[][] = [];

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

    private static findSegmentsFromJunction(junc:Junction, segments:Segment[]):Segment[] {
        let found:Segment[] = [];

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
    segments: Segment[];
    constructor(segments:Segment[], anyCell:Cell) {
        this.segments = segments;
        this.anyCell = anyCell;
    }

    getComponents() {
        let components:IComponent[] = [];
        this.segments.forEach(seg => {
            seg.components.forEach(comp => {
                components.push(comp);
            });
        });
        return components;
    }

    anyCell: Cell;

    // TODO: Fix the infinite loop.
    generateEquations() {
    
        let startingCell = this.anyCell;

        // FORMAT:
        // If it ADDS emf, make it negative.
        // If it USES UP emf, make it positive.
        
        // Initialize with the starting cell already there.
        let law2Expressions:string[] = [ (-startingCell.emf).toString() ];

        // Iterate through all the components until returned to the starting cell.
        let nextComponent:IComponent = startingCell.getNextLogicalComponent();
        let prevComponent:IComponent = startingCell;

        // pre-initialise
        var components = this.getComponents();
        while (nextComponent !== startingCell) {
            if (nextComponent instanceof Junction) {
                let junc = <Junction>nextComponent;
                // search for the next component and set it as the next component
                for (var i = 0; i < junc.components.length; i++) {
                    let juncComp = junc.components[i];
                    let breakFlag = false;
                    for (var j = 0; j < components.length; j++) {
                        if (juncComp === components[j]) {

                            prevComponent = nextComponent;
                            nextComponent = components[j];

                            breakFlag = true;
                            break;
                        }
                    }
                    if (breakFlag) break;
                }
                
            } else {
                // find the current segment
                let currentSegment:Segment = findParentSegment(nextComponent, this.segments);
                
                if (nextComponent instanceof Cell) {
                    law2Expressions.push((<Cell>nextComponent).getDeltaEmfEquation(prevComponent));
                }
                else {
                    law2Expressions.push(generatePdEquation(currentSegment, nextComponent));
                }

                prevComponent = nextComponent;
                nextComponent = nextComponent.getNextComponent(nextComponent);
            }
        }

        let law2Equation:string = "";

        law2Expressions.forEach(expr => {
            law2Equation += (expr + " + ");
        });

        return law2Equation;
    }
}

function findParentSegment(componentToFind:IComponent, segments:Segment[]) {
    segments.forEach(seg => {
        seg.components.forEach(comp => {
            if (comp === componentToFind) {
                return seg;
            }
        });
    });
    return null;
}

function generatePdEquation(segment:Segment, comp:IComponent) {
    //let curStr:string = segment.current == null ? segment.compId : segment.current.toString();
    let curStr:string = "somecurrent";
    let resStr:string = comp.resistance == null ? segment.compId + resistanceSuffix : comp.resistance.toString();

    return "((" + curStr + ") * (" + resStr + "))";
}

function generateResistanceEquation(segment:Segment, comp:IComponent) {
    let curStr:string = segment.current == null ? segment.compId : segment.current.toString();
    let pdStr:string = comp.pd == null ? segment.compId + pdSuffix : comp.pd.toString();

    return "((" + curStr + ") * (" + pdStr + "))";
}

// Represents a segment of the circuit where the current is constant, ie between junctions. 
class Segment {

    compId: string;

    components: IComponent[] = [];

    current: number;
    constructor(components ? : IComponent[]) {
        if (components != null) {
            this.components = components;
        }

        this.compId = "current" + getId();
    }

    startJunction: Junction;
    endJunction: Junction;

    getJunctionIds(): number[] {
        return [
            this.startJunction.id,
            this.endJunction.id
        ]
    }
}

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

cell1.head = res4; cell1.tail = res1; 
res1.head = cell1; res1.tail = junc1;
junc1.components = [ res1, res2, cell2 ];

res2.head = junc1; res2.tail = junc2;

cell2.head = junc1; cell2.tail = res3;
res3.head = cell2; res3.tail = junc2;

junc2.components = [ res2, res3, res4 ];
res4.head = junc2; res4.tail = cell1;

var circ = new Circuit();
circ.components = [cell1, cell2, res1, res2, res3, res4, junc1, junc2 ];

var segs = circ.generateSegments();


var loops = circ.generateLoops(segs);

loops.forEach(loop => {
    console.log(loop);
});

loops.forEach(loop => {
    //console.log(loop.generateEquations());
});




//#endregion