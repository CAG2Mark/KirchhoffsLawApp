//#region equation solver

// Using nerdamer

// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
function onlyUnique(value, index, self) {
    return self.indexOf(value) == index;
}

function simplifySystem(loopEquations, circuitEquations, varCount) {

    // remove redundant equations from both arrays

    let simplLoopEqns = [];

    for (var i = 0; i < loopEquations.length; i++) {

        let simpls = simplifyEquation(loopEquations[i]);
        if (!arrIncludes(simplLoopEqns, simpls[0]) && !arrIncludes(simplLoopEqns, simpls[1])) {
            simplLoopEqns.push(simpls[0])
        }
    }

    let simplCircuitEqns = [];


    loopEquations = loopEquations.filter(onlyUnique);
    for (var i = 0; i < circuitEquations.length; i++) {

        let simpls = simplifyEquation(circuitEquations[i]);
        if (!arrIncludes(simplCircuitEqns, simpls[0]) && !arrIncludes(simplCircuitEqns, simpls[1])) {
            simplCircuitEqns.push(simpls[0])
        }
    }

    // nerdamer requires that a system of linear equations contains the same number of equations as the number of unknowns

    let targetCount = varCount - simplCircuitEqns.length;
    simplLoopEqns = simplLoopEqns.slice(0, targetCount);
    return [...simplCircuitEqns, ...simplLoopEqns];
}

// returns two possible simplfied versions of an equation, one postiive and one negative
function simplifyEquation(eqn) {
    // x + (eqn) just returns an array with the solution for x being the solution
    let sol = nerdamer(`solve(x + ${eqn}, x)`).toString();
    // as it is linear assume only one solution
    sol = sol.replace("[", "").replace("]", "");
    let simpl1 = nerdamer(`simplify(${sol})`).toString() + "=0";
    let simpl2 = nerdamer(`simplify(-(${sol}))`).toString() + "=0";
    return [simpl1,simpl2]
}
//#endregion

function solveSystem(eqns) {
    return nerdamer(`solveEquations([${eqns.toString()}])`);
}