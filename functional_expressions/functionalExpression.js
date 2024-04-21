let cnst = (f) => (...args) => Number(f);
const one = cnst(1);
const two = cnst(2);
let constants = {
    "one": one, "two": two
}

let variable = (f) => (x0, y0, z0) => {
    switch (f) {
        case "x":
            return x0;
        case "y":
            return y0;
        case "z":
            return z0;
    }
}

let Operation = (func) => (...elements) => (...args) => {
    // :NOTE: стандартная функция
    let argument = [];
    for (let i = 0; i < elements.length; i++) {
        argument.push(elements[i](...args));
    }
    return func(...argument);
}
let add = Operation((f, s) => f + s);
let subtract = Operation((f, s) => f - s);
let multiply = Operation((f, s) => f * s);
let divide = Operation((f, s) => f / s);
let floor = Operation(Math.floor);
let ceil = Operation(Math.ceil);
let negate = Operation((f) => -1 * f);
let madd = Operation((f, s, t) => f * s + t);

let operations = {
    "+": [add, 2], "-": [subtract, 2], "*": [multiply, 2], "/": [divide, 2], "*+": [madd, 3],
    "negate": [negate, 1], "_": [floor, 1], "^": [ceil, 1]
}
// :NOTE: стандартная функция
let elementReplacement = (result, count, current) => {
    for (let i = 0; i < count; i++) {
        result.pop();
    }
    result.push(current);
}

// :NOTE: парсер знает про количество переменных
let parse = (str) => (x0, y0, z0) => {
    let arr = str.trim().split(/\s+/);
    let res = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === "x" || arr[i] === "y" || arr[i] === "z") {
            elementReplacement(res, 0, variable(arr[i]));
        } else if (arr[i] in operations) {
            let operate = operations[arr[i]][0];
            let count = operations[arr[i]][1];
            // :NOTE: стандартная функция
            let elements = [];
            for (let i = 0; i < count; i++) {
                elements.push(res[res.length - count + i]);
            }
            elementReplacement(res, count, operate(...elements));
        } else if (arr[i] in constants) {
            elementReplacement(res, 0, constants[arr[i]]);
        } else {
            elementReplacement(res, 0, cnst(arr[i]));
        }
    }
    return res[0](x0, y0, z0);
}