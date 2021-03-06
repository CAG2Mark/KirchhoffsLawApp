/* jshint esversion:6 */

//#region equation solver

// Using nerdamer

// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
function onlyUnique(value, index, self) {
    return self.indexOf(value) == index;
}

// mathematically, you can always find the solution to a system of equations with n variables and n equations,
// given they are all correct
function simplifySystem(loopEquations, circuitEquations, pdEquations) {

    // get var count

    let vars = [];

    loopEquations = loopEquations.filter(onlyUnique);
    circuitEquations = circuitEquations.filter(onlyUnique);
    pdEquations = pdEquations.filter(onlyUnique);

    loopEquations.concat(circuitEquations).concat(pdEquations).forEach(eqn => {
        let expr = eqn.replace(" = 0", "");
        let eqnPars = nerdamer(expr);
        eqnPars.variables().forEach(variable => {
            vars.push(variable);
        });
    });

    vars = vars.filter(onlyUnique);

    let varCount = vars.length;

    // remove redundant equations from both arrays

    let simplLoopEqns = [];

    for (var i = 0; i < loopEquations.length; i++) {

        let simpls = simplifyEquation(loopEquations[i]);
        if (!arrIncludes(simplLoopEqns, simpls[0]) && !arrIncludes(simplLoopEqns, simpls[1])) {
            simplLoopEqns.push(simpls[0]);
        }
    }

    let simplCircuitEqns = [];


    simplLoopEqns = simplLoopEqns.filter(onlyUnique);
    for (var i = 0; i < circuitEquations.length; i++) {

        let simpls = simplifyEquation(circuitEquations[i]);
        if (!arrIncludes(simplCircuitEqns, simpls[0]) && !arrIncludes(simplCircuitEqns, simpls[1])) {
            simplCircuitEqns.push(simpls[0]);
        }
    }

    let simplPdEqns = [];
    for (var i = 0; i < pdEquations.length; i++) {

        let simpls = simplifyEquation(pdEquations[i]);
        if (!arrIncludes(simplPdEqns, simpls[0]) && !arrIncludes(simplPdEqns, simpls[1])) {
            simplPdEqns.push(simpls[0]);
        }
    }

    simplPdEqns = simplPdEqns.filter(onlyUnique);

    // nerdamer requires that a system of linear equations contains the same number of equations as the number of unknowns

    let targetCount = varCount - simplCircuitEqns.length - simplPdEqns.length;
    simplLoopEqns = simplLoopEqns.slice(0, targetCount);
    return [...simplCircuitEqns, ...simplLoopEqns, ...simplPdEqns];
}

// returns two possible simplfied versions of an equation, one postiive and one negative
function simplifyEquation(eqn) {
    // x + (eqn) just returns an array with the solution for x being the solution
    let sol = nerdamer(`solve(CIRCUITSOLVERSTRING + ${eqn}, CIRCUITSOLVERSTRING)`).toString();
    // as it is linear assume only one solution
    sol = sol.replace("[", "").replace("]", "");
    let simpl1 = nerdamer(`simplify(${sol})`).toString() + "=0";
    let simpl2 = nerdamer(`simplify(-(${sol}))`).toString() + "=0";

    // try again and manipulate the library if it doesn't work
    // for some reason the library breaks for some ax + by + c
    if (simpl1 == "1=0" || simpl2 == "-1=0") {
        simpl1 = nerdamer(`simplify(${sol} + FILLER1 + FILLER2 + FILLER3)`).toString() + "=0";
        simpl2 = nerdamer(`simplify(-(${sol}) + FILLER1 + FILLER2 + FILLER3)`).toString() + "=0";

        simpl1 = simpl1.replace("+FILLER1+FILLER2+FILLER3", "");
        simpl2 = simpl2.replace("+FILLER1+FILLER2+FILLER3", "");

        simpl1 = simpl1.replace("-FILLER1-FILLER2-FILLER3", "");
        simpl2 = simpl2.replace("-FILLER1-FILLER2-FILLER3", "");
    }

    return [simpl1,simpl2];
}
//#endregion

function solveSystem(eqns) {
    return nerdamer(`solveEquations([${eqns.toString()}])`);
}