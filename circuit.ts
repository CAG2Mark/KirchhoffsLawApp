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

    getDeltaEmfEquation(curSegment:Segment, curJunction:Junction) {
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

    // All segments in the circuit.
    // The first array is the law 2 (loop law) equation.
    // The second array are the junction equations.
    // The third array contains all variables used.
    generateEquations(allSegments:Segment[]):string[][] {
    
        let startingCell = this.anyCell;

        let allJunctions:Junction[] = [];

        // variables used
        let variables:string[] = [];

        //#endregion

        // FORMAT:
        // If it ADDS emf, make it negative.
        // If it USES UP emf, make it positive.

        //#region Law 2

        // Iterate through all the components until returned to the starting cell.
        let curComponent:IComponent = startingCell.getNextLogicalComponent();
        let prevComponent:IComponent = startingCell;

        // pre-initialise
        let components = this.getComponents();

        // Find the closest previous junction.
        let curJunction:Junction;
        let prev:IComponent = curComponent;
        let next:IComponent = prevComponent
        while (!(next instanceof Junction)) {
            let temp = next;
            next = next.getNextComponent(prev);
            prev = temp;
        }

        curJunction = next;

        // Initialize with the starting cell already there.
        let law2Expressions:string[] = [ startingCell.getDeltaEmfEquation(findParentSegment(startingCell, this.segments), curJunction) ];
        
        while (curComponent !== startingCell) {

            if (curComponent instanceof Junction) {
                let junc = <Junction>curComponent;
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
                    if (breakFlag) break;
                }
                
            } else {
                // find the current segment
                let curSegment:Segment = findParentSegment(curComponent, this.segments);
                
                if (curComponent instanceof Cell) {
                    law2Expressions.push((<Cell>curComponent).getDeltaEmfEquation(curSegment, curJunction));
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

        let law2Equation:string = "";

        law2Expressions.forEach(expr => {
            law2Equation += (expr + " + ");
        });
        // remove the final " + "
        law2Equation = law2Equation.substring(0, law2Equation.length - 3);

        law2Equation += " = 0";

        //#endregion

        //#region LAW 1

        let law1Equations:string[] = [];

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

function findParentSegment(componentToFind:IComponent, segments:Segment[]):Segment {
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
function generatePdEquation(segment:Segment, comp:IComponent, approachingJunction:Junction) {

    let isNegative:boolean = approachingJunction === segment.endJunction;

    let curStr:string = segment.current == null ? 
        (isNegative ? "-" : "" ) + segment.compId : 
        ((isNegative ? -1 : 1 ) * segment.current).toString();
    //let curStr:string = "somecurrent";
    let resStr:string = comp.resistance == null ? segment.compId + resistanceSuffix : comp.resistance.toString();

    let variables:string[] = [];

    if (segment.current == null) variables.push(segment.compId);
    if (comp.resistance == null) variables.push(comp.compId + resistanceSuffix);

    return [["((" + curStr + ") * (" + resStr + "))"], variables];
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

    // The direction of the current is from START to END.
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

    getOutputCurrentExpr(outputJunction: Junction): string {
        let isNegative = outputJunction === this.startJunction

        if (this.current == null) {
            return (isNegative ? "-" : "") + this.compId;
        }
        else {
            return ((isNegative ? -1 : 1) * this.current).toString();
        }
    }
}