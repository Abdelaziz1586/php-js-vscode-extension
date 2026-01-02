import { Token, TokenType } from './lexer';
import {
    Expr, ExprVisitor, AssignExpr, BinaryExpr, CallExpr, GroupingExpr,
    LiteralExpr, LogicalExpr, UnaryExpr, VariableExpr, ArrayExpr,
    Stmt, StmtVisitor, BlockStmt, ExpressionStmt, FunctionStmt,
    IfStmt, EchoStmt, ReturnStmt, VarStmt, WhileStmt, ForeachStmt
} from './parser';

export class Environment {
    private values: Map<string, any> = new Map();
    public enclosing: Environment | null;

    constructor(enclosing: Environment | null = null) {
        this.enclosing = enclosing;
    }

    define(name: string, value: any): void {
        this.values.set(name, value);
    }

    get(name: Token): any {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }

        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }

        throw new Error(`Undefined variable '${name.lexeme}' at line ${name.line}.`);
    }

    assign(name: Token, value: any): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new Error(`Undefined variable '${name.lexeme}' at line ${name.line}.`);
    }
}

export interface Callable {
    arity(): number;
    call(interpreter: Interpreter, args: any[]): any;
}

export class FunctionValue implements Callable {
    constructor(private declaration: FunctionStmt, private closure: Environment) { }

    arity(): number {
        return this.declaration.params.length;
    }

    call(interpreter: Interpreter, args: any[]): any {
        const environment = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (returnValue) {
            if (returnValue instanceof ReturnValue) {
                return returnValue.value;
            }
            throw returnValue;
        }
        return null;
    }

    toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}

class ReturnValue {
    constructor(public value: any) { }
}

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {
    public globals: Environment = new Environment();
    private environment: Environment = this.globals;
    private output: string[] = [];

    constructor() {
        this.defineBuiltins();
    }

    private defineBuiltins() {
        this.globals.define("strlen", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => String(args[0]).length
        });
        this.globals.define("count", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => Array.isArray(args[0]) ? args[0].length : 0
        });
        this.globals.define("strtoupper", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => String(args[0]).toUpperCase()
        });
        this.globals.define("strtolower", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => String(args[0]).toLowerCase()
        });
        this.globals.define("trim", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => String(args[0]).trim()
        });
        this.globals.define("is_null", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => args[0] === null
        });
        this.globals.define("is_array", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => Array.isArray(args[0])
        });
        this.globals.define("is_string", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => typeof args[0] === 'string'
        });
        this.globals.define("is_int", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => Number.isInteger(args[0])
        });
        this.globals.define("is_integer", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => Number.isInteger(args[0])
        });
        this.globals.define("is_bool", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => typeof args[0] === 'boolean'
        });
        this.globals.define("is_numeric", {
            arity: () => 1,
            call: (interpreter: Interpreter, args: any[]) => !isNaN(parseFloat(args[0])) && isFinite(args[0])
        });
        // Add more built-ins as needed
    }

    interpret(statements: Stmt[]): string {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error: any) {
            this.output.push(`Runtime Error: ${error.message}`);
        }
        return this.output.join("");
    }

    private execute(stmt: Stmt) {
        stmt.accept(this);
    }

    public executeBlock(statements: Stmt[], environment: Environment) {
        const previous = this.environment;
        try {
            this.environment = environment;
            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    private evaluate(expr: Expr): any {
        return expr.accept(this);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.evaluate(stmt.expression);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        const func = new FunctionValue(stmt, this.environment);
        this.environment.define(stmt.name.lexeme, func);
    }

    visitIfStmt(stmt: IfStmt): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch !== null) {
            this.execute(stmt.elseBranch);
        }
    }

    visitEchoStmt(stmt: EchoStmt): void {
        const value = this.evaluate(stmt.expression);
        this.output.push(this.stringify(value));
    }

    visitReturnStmt(stmt: ReturnStmt): void {
        let value = null;
        if (stmt.value !== null) value = this.evaluate(stmt.value);
        throw new ReturnValue(value);
    }

    visitVarStmt(stmt: VarStmt): void {
        let value = null;
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer);
        }
        this.environment.define(stmt.name.lexeme, value);
    }

    visitWhileStmt(stmt: WhileStmt): void {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }

    visitForeachStmt(stmt: ForeachStmt): void {
        const array = this.evaluate(stmt.array);
        if (!Array.isArray(array)) {
            throw new Error(`Foreach expected array, got ${typeof array} at line ${stmt.item.line}`);
        }

        for (const element of array) {
            const environment = new Environment(this.environment);
            environment.define(stmt.item.lexeme, element);
            this.executeBlock([stmt.body], environment);
        }
    }

    visitAssignExpr(expr: AssignExpr): any {
        const value = this.evaluate(expr.value);
        try {
            this.environment.assign(expr.name, value);
        } catch (error) {
            // Implicit declaration if not found
            this.environment.define(expr.name.lexeme, value);
        }
        return value;
    }

    visitBinaryExpr(expr: BinaryExpr): any {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.BANG_EQUAL: return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL: return this.isEqual(left, right);
            case TokenType.BANG_EQUAL_EQUAL: return left !== right;
            case TokenType.EQUAL_EQUAL_EQUAL: return left === right;
            case TokenType.GREATER: return left > right;
            case TokenType.GREATER_EQUAL: return left >= right;
            case TokenType.LESS: return left < right;
            case TokenType.LESS_EQUAL: return left <= right;
            case TokenType.MINUS: return left - right;
            case TokenType.PLUS:
                if (typeof left === 'number' && typeof right === 'number') {
                    return left + right;
                }
                return String(left) + String(right);
            case TokenType.DOT: return String(left) + String(right);
            case TokenType.SLASH: return left / right;
            case TokenType.STAR: return left * right;
            case TokenType.PERCENT: return left % right;
            case TokenType.STAR_STAR: return Math.pow(left, right);
        }
        return null;
    }

    visitCallExpr(expr: CallExpr): any {
        const callee = this.evaluate(expr.callee);
        const args: any[] = [];
        for (const arg of expr.args) {
            args.push(this.evaluate(arg));
        }

        if (!(typeof callee === 'object' && callee !== null && 'call' in callee)) {
            throw new Error(`Can only call functions and classes at line ${expr.paren.line}.`);
        }

        const func = callee as Callable;
        if (args.length !== func.arity()) {
            throw new Error(`Expected ${func.arity()} arguments but got ${args.length} at line ${expr.paren.line}.`);
        }

        return func.call(this, args);
    }

    visitGroupingExpr(expr: GroupingExpr): any {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): any {
        return expr.value;
    }

    visitLogicalExpr(expr: LogicalExpr): any {
        const left = this.evaluate(expr.left);

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }

        return this.evaluate(expr.right);
    }

    visitUnaryExpr(expr: UnaryExpr): any {
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case TokenType.BANG: return !this.isTruthy(right);
            case TokenType.MINUS: return -Number(right);
        }
        return null;
    }

    visitVariableExpr(expr: VariableExpr): any {
        return this.environment.get(expr.name);
    }

    visitArrayExpr(expr: ArrayExpr): any {
        return expr.elements.map(e => this.evaluate(e));
    }

    private isTruthy(object: any): boolean {
        if (object === null) return false;
        if (typeof object === "boolean") return object;
        return true;
    }

    private isEqual(a: any, b: any): boolean {
        if (a === null && b === null) return true;
        if (a === null) return false;
        return a == b;
    }

    private stringify(object: any): string {
        if (object === null) return "null";
        if (typeof object === "number") {
            let text = object.toString();
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length - 2);
            }
            return text;
        }
        return object.toString();
    }
}
