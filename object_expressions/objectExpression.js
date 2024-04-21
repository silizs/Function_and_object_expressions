const NULL = new Const(0);
const ONE = new Const(1);
const TWO = new Const(2);
let constants = { "NULL": NULL, "ONE": ONE, "TWO": TWO }

const X = new Variable("x");
const Y = new Variable("y");
const Z = new Variable("z");
let variables = { "x": X, "y": Y, "z": Z }

let operations = {
    "+": [(f, s) => f + s, (...args) => new Add(...args), 2],
    "-": [(f, s) => f - s, (...args) => new Subtract(...args), 2],
    "*": [(f, s) => f * s, (...args) => new Multiply(...args), 2],
    "/": [(f, s) => f / s, (...args) => new Divide(...args), 2],
    "negate": [(f) => -1 * f, (...args) => new Negate(...args), 1],
    "sumsq2": [(...args) => sumSquares(...args), (...args) => new Sumsq2(...args), 2],
    "sumsq3": [(...args) => sumSquares(...args), (...args) => new Sumsq3(...args), 3],
    "sumsq4": [(...args) => sumSquares(...args), (...args) => new Sumsq4(...args), 4],
    "sumsq5": [(...args) => sumSquares(...args), (...args) => new Sumsq5(...args), 5],
    "distance2": [(...args) => Math.sqrt(sumSquares(...args)), (...args) => new Distance2(...args), 2],
    "distance3": [(...args) => Math.sqrt(sumSquares(...args)), (...args) => new Distance3(...args), 3],
    "distance4": [(...args) => Math.sqrt(sumSquares(...args)), (...args) => new Distance4(...args), 4],
    "distance5": [(...args) => Math.sqrt(sumSquares(...args)), (...args) => new Distance5(...args), 5],
    "sumexp": [(...args) => sumExp(...args), (...args) => new Sumexp(...args), 0],
    "lse": [(...args) => Math.log(sumExp(...args)), (...args) => new LSE(...args), 0]
};

function sumFunc (func) {
    function sumPrototype (...args) {
        let sum = 0;
        for (let i = 0; i < args.length; i++) {
            sum += func(args[i]);
        }
        return sum;
    }
    return sumPrototype;
}
let sumSquares = sumFunc(arg => arg * arg);
let sumExp = sumFunc(Math.exp);

function Operation(operation, ...expressions) {
    this.operation = operation;
    this.expressions = expressions;
}
Operation.prototype.toString = function () {
    return [...this.expressions, this.operation].join(' ');
};
Operation.prototype.prefix = function () {
    if (this.expressions.length === 0) {
        return "(" + this.operation + " )";
    }
    return "(" + [this.operation, ...this.expressions.map(el => el.prefix())].join(' ') + ")";
}
Operation.prototype.postfix = function () {
    if (this.expressions.length === 0) {
        return "( " + this.operation + ")";
    }
    return "(" + [...this.expressions.map(el => el.postfix()), this.operation].join(' ') + ")";
}
Operation.prototype.evaluate = function (...variables) {
    let args = this.expressions.map(el => el.evaluate(...variables));
    return operations[this.operation][0](...args);
};
Operation.prototype.diff = function (variable) {}

function TypeOperation(type, diff) {
    function Function(...expressions) {
        Operation.call(this, type, ...expressions);
    }
    Function.prototype = Object.create(Operation.prototype);
    Function.prototype.diff = diff;
    return Function;
}

const Add = TypeOperation("+", function (variable) {
    return new Add(this.expressions[0].diff(variable), this.expressions[1].diff(variable)); }
);
const Subtract = TypeOperation("-", function (variable) {
    return new Subtract(this.expressions[0].diff(variable), this.expressions[1].diff(variable)); }
);
const Multiply = TypeOperation("*", function (variable) {
    return new Add(new Multiply(this.expressions[0].diff(variable), this.expressions[1]),
        new Multiply(this.expressions[0], this.expressions[1].diff(variable)) ); }
);
const Divide = TypeOperation("/", function (variable) {
    return new Divide(
        new Subtract(
            new Multiply(this.expressions[0].diff(variable), this.expressions[1]),
            new Multiply(this.expressions[0], this.expressions[1].diff(variable))
        ),
        new Multiply(this.expressions[1], this.expressions[1]) ); }
);
const Negate = TypeOperation("negate", function (variable) { return new Negate(this.expressions[0].diff(variable)); });

function SumsqN(...expressions) {
    if (expressions.length === 2) {
        return new Sumsq2(...expressions);
    } else if (expressions.length === 3) {
        return new Sumsq3(...expressions);
    } else if (expressions.length === 4) {
        return new Sumsq4(...expressions);
    } else {
        return new Sumsq5(...expressions);
    }
}
const [Sumsq2, Sumsq3, Sumsq4, Sumsq5] = ["sumsq2", "sumsq3", "sumsq4", "sumsq5"].map(str =>
    TypeOperation(str, function (variable) {
        let one = new Multiply(this.expressions[0], this.expressions[0]).diff(variable);
        let second = null;
        if (this.expressions.length > 2) {
            second = new SumsqN(...this.expressions.slice(1)).diff(variable);
        } else {
            second = new Multiply(this.expressions[1], this.expressions[1]).diff(variable);
        }
        return new Add(one, second); } )
);
const [Distance2, Distance3, Distance4, Distance5] = ["distance2", "distance3", "distance4", "distance5"].map(str =>
    TypeOperation(str, function (variable) {
        return new Divide(
            new SumsqN(...this.expressions).diff(variable),
            new Multiply(constants["TWO"], this) ); } )
);
const Sumexp = TypeOperation("sumexp", function (variable) {
    let one = new Multiply(new Sumexp(this.expressions[0]), this.expressions[0].diff(variable));
    if (this.expressions.length > 1) {
        return new Add(one, new Sumexp(...this.expressions.slice(1)).diff(variable));
    } else {
        return one;
    } }
);
const LSE = TypeOperation("lse", function (variable) {
    return new Divide(
        new Sumexp(...this.expressions).diff(variable), new Sumexp(...this.expressions) );
} );

function Const(value) {
    this.toString = function () { return String(value); }
    this.prefix = function () { return String(value); }
    this.postfix = function () { return String(value); }
    this.evaluate = function (...variables) { return Number(value); }
    this.diff = function (variable) { return constants["NULL"]; }
}

function Variable(variable) {
    this.toString = function () { return variable; };
    this.prefix = function () { return variable; };
    this.postfix = function () { return variable; };
    this.evaluate = function (x, y, z) {
        switch (variable) {
            case "x":
                return x;
            case "y":
                return y;
            case "z":
                return z;
        }
    };
    this.diff = function (variable) {
        if (this.toString() === variable) {
            return constants["ONE"];
        } else {
            return constants["NULL"];
        }
    }
}

function parse (str) {
    let result = [];
    for (const token of str.trim().split(/\s+/)) {
        if (token in variables) {
            result.push(variables[token]);
        } else if (token in operations) {
            let [_, operate, count] = operations[token];
            let elements = result.slice(result.length - count, result.length);
            result.splice(result.length - count, count);
            result.push(operate(...elements));
        } else {
            result.push(new Const(token));
        }
    }
    return result[0];
}

function ParseError(message) {
    Error.call(this, message);
    this.message = message;
}
ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.constructor = ParseError;

const isNumeric = n => !isNaN(n);
function skip(str, i) {
    while (str[i] === " ") {
        i++;
    }
    return i;
}
function parseToken(str, i) {
    while (str[i] !== " " && str[i] !== ")" && str[i] !== "(" && i < str.length) {
        i++;
    }
    return i;
}
function parseElement(token) {
    if (token in variables) {
        return variables[token];
    } else if (isNumeric(token)) {
        return new Const(token);
    } else {
        throw new ParseError("Uncorrected element");
    }
}
function parseOperation(str, i) {
    i = skip(str, i);
    let elements = [];
    let operate = "";
    while (str[i] !== ")" && i < str.length) {
        i = skip(str, i);
        let el;
        if (str[i] === "(") {
            [el, i] = parseOperation(str, i + 1);
            i++;
            elements.push(el);
        } else {
            let start = i;
            i = parseToken(str, start);
            if (start === i) {
                break;
            }
            el = str.substr(start, i - start);
            if (el in operations) {
                if (operate !== "") {
                    throw new ParseError("More than one operate: index in string " + i);
                }
                operate = el;
            } else {
                el = parseElement(el);
                elements.push(el);
            }
        }
    }
    if (operate === "") {
        throw new ParseError("No operation");
    }
    if (elements.length !== operations[operate][2] && operations[operate][2] !== 0) {
        throw new ParseError("Wrong number of arguments for operation: index in string " + i);
    }
    if (str.length === i) {
        throw new ParseError("Uncorrected element");
    }
    return [operations[operate][1](...elements), i];
}

function parsePrefix(str) {
    return parseExpression(str);
}

function parsePostfix(str) {
    return parseExpression(str);
}

function parseExpression(str) {
    let i = skip(str, 0);
    let result;
    if (str[i] === "(") {
        [result, i] = parseOperation(str, i + 1);
        i++;
    } else {
        let start = i;
        i = parseToken(str, start);
        if (start === i) {
            throw new ParseError("No element to parse");
        }
        result = parseElement(str.substr(start, i - start));
    }
    i = skip(str, i);
    if (i !== str.length) {
        throw new ParseError("Uncorrected element");
    }
    return result;
}
