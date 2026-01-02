import { Token, TokenType } from './lexer';

export abstract class Expr {
    abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export interface ExprVisitor<R> {
    visitAssignExpr(expr: AssignExpr): R;
    visitBinaryExpr(expr: BinaryExpr): R;
    visitCallExpr(expr: CallExpr): R;
    visitGroupingExpr(expr: GroupingExpr): R;
    visitLiteralExpr(expr: LiteralExpr): R;
    visitLogicalExpr(expr: LogicalExpr): R;
    visitUnaryExpr(expr: UnaryExpr): R;
    visitVariableExpr(expr: VariableExpr): R;
    visitArrayExpr(expr: ArrayExpr): R;
}

export class AssignExpr extends Expr {
    constructor(public name: Token, public value: Expr) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitAssignExpr(this); }
}

export class BinaryExpr extends Expr {
    constructor(public left: Expr, public operator: Token, public right: Expr) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitBinaryExpr(this); }
}

export class CallExpr extends Expr {
    constructor(public callee: Expr, public paren: Token, public args: Expr[]) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitCallExpr(this); }
}

export class GroupingExpr extends Expr {
    constructor(public expression: Expr) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitGroupingExpr(this); }
}

export class LiteralExpr extends Expr {
    constructor(public value: any) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitLiteralExpr(this); }
}

export class LogicalExpr extends Expr {
    constructor(public left: Expr, public operator: Token, public right: Expr) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitLogicalExpr(this); }
}

export class UnaryExpr extends Expr {
    constructor(public operator: Token, public right: Expr) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitUnaryExpr(this); }
}

export class VariableExpr extends Expr {
    constructor(public name: Token) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitVariableExpr(this); }
}

export class ArrayExpr extends Expr {
    constructor(public elements: Expr[]) { super(); }
    accept<R>(visitor: ExprVisitor<R>): R { return visitor.visitArrayExpr(this); }
}

export abstract class Stmt {
    abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export interface StmtVisitor<R> {
    visitBlockStmt(stmt: BlockStmt): R;
    visitExpressionStmt(stmt: ExpressionStmt): R;
    visitFunctionStmt(stmt: FunctionStmt): R;
    visitIfStmt(stmt: IfStmt): R;
    visitEchoStmt(stmt: EchoStmt): R;
    visitReturnStmt(stmt: ReturnStmt): R;
    visitVarStmt(stmt: VarStmt): R;
    visitWhileStmt(stmt: WhileStmt): R;
    visitForeachStmt(stmt: ForeachStmt): R;
}

export class BlockStmt extends Stmt {
    constructor(public statements: Stmt[]) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitBlockStmt(this); }
}

export class ExpressionStmt extends Stmt {
    constructor(public expression: Expr) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitExpressionStmt(this); }
}

export class FunctionStmt extends Stmt {
    constructor(public name: Token, public params: Token[], public body: Stmt[]) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitFunctionStmt(this); }
}

export class IfStmt extends Stmt {
    constructor(public condition: Expr, public thenBranch: Stmt, public elseBranch: Stmt | null) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitIfStmt(this); }
}

export class EchoStmt extends Stmt {
    constructor(public expression: Expr) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitEchoStmt(this); }
}

export class ReturnStmt extends Stmt {
    constructor(public keyword: Token, public value: Expr | null) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitReturnStmt(this); }
}

export class VarStmt extends Stmt {
    constructor(public name: Token, public initializer: Expr | null) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitVarStmt(this); }
}

export class WhileStmt extends Stmt {
    constructor(public condition: Expr, public body: Stmt) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitWhileStmt(this); }
}

export class ForeachStmt extends Stmt {
    constructor(public array: Expr, public item: Token, public body: Stmt) { super(); }
    accept<R>(visitor: StmtVisitor<R>): R { return visitor.visitForeachStmt(this); }
}

export class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Stmt[] {
        const statements: Stmt[] = [];
        while (!this.isAtEnd()) {
            const decl = this.declaration();
            if (decl) statements.push(decl);
        }
        return statements;
    }

    private declaration(): Stmt | null {
        try {
            if (this.match(TokenType.FUNCTION)) return this.functionDeclaration("function");
            if (this.match(TokenType.VAR, TokenType.LET, TokenType.CONST)) return this.varDeclaration();
            return this.statement();
        } catch (error) {
            this.synchronize();
            return null;
        }
    }

    private functionDeclaration(kind: string): FunctionStmt {
        const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
        this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
        const parameters: Token[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                parameters.push(this.consume(TokenType.VARIABLE, "Expect parameter name."));
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
        this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
        const body = this.block();
        return new FunctionStmt(name, parameters, body);
    }

    private varDeclaration(): Stmt {
        const name = this.consume(TokenType.VARIABLE, "Expect variable name.");
        let initializer: Expr | null = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new VarStmt(name, initializer);
    }

    private statement(): Stmt {
        if (this.match(TokenType.IF)) return this.ifStatement();
        if (this.match(TokenType.ECHO)) return this.echoStatement();
        if (this.match(TokenType.RETURN)) return this.returnStatement();
        if (this.match(TokenType.WHILE)) return this.whileStatement();
        if (this.match(TokenType.FOR)) return this.forStatement();
        if (this.match(TokenType.FOREACH)) return this.foreachStatement();
        if (this.match(TokenType.LEFT_BRACE)) return new BlockStmt(this.block());

        return this.expressionStatement();
    }

    private forStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
        let initializer: Stmt | null;
        if (this.match(TokenType.SEMICOLON)) {
            initializer = null;
        } else if (this.match(TokenType.VAR, TokenType.LET, TokenType.CONST)) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let condition: Expr | null = null;
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        let increment: Expr | null = null;
        if (!this.check(TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body = this.statement();

        if (increment !== null) {
            body = new BlockStmt([body, new ExpressionStmt(increment)]);
        }

        if (condition === null) condition = new LiteralExpr(true);
        body = new WhileStmt(condition, body);

        if (initializer !== null) {
            body = new BlockStmt([initializer, body]);
        }

        return body;
    }

    private ifStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

        const thenBranch = this.statement();
        let elseBranch: Stmt | null = null;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        } else if (this.match(TokenType.ELSEIF)) {
            elseBranch = this.ifStatement();
        }

        return new IfStmt(condition, thenBranch, elseBranch);
    }

    private echoStatement(): Stmt {
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return new EchoStmt(value);
    }

    private returnStatement(): Stmt {
        const keyword = this.previous();
        let value: Expr | null = null;
        if (!this.check(TokenType.SEMICOLON)) {
            value = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        return new ReturnStmt(keyword, value);
    }

    private whileStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        const body = this.statement();
        return new WhileStmt(condition, body);
    }

    private foreachStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'foreach'.");
        const array = this.expression();
        this.consume(TokenType.AS, "Expect 'as' after array in foreach.");
        const item = this.consume(TokenType.VARIABLE, "Expect variable name after 'as'.");
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after foreach clauses.");
        const body = this.statement();
        return new ForeachStmt(array, item, body);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private block(): Stmt[] {
        const statements: Stmt[] = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const decl = this.declaration();
            if (decl) statements.push(decl);
        }
        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
        return statements;
    }

    private expression(): Expr {
        return this.assignment();
    }

    private assignment(): Expr {
        const expr = this.or();

        if (this.match(TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment();

            if (expr instanceof VariableExpr) {
                const name = expr.name;
                return new AssignExpr(name, value);
            }

            throw new Error(`Invalid assignment target at line ${equals.line}`);
        }

        return expr;
    }

    private or(): Expr {
        let expr = this.and();
        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.and();
            expr = new LogicalExpr(expr, operator, right);
        }
        return expr;
    }

    private and(): Expr {
        let expr = this.equality();
        while (this.match(TokenType.AND)) {
            const operator = this.previous();
            const right = this.equality();
            expr = new LogicalExpr(expr, operator, right);
        }
        return expr;
    }

    private equality(): Expr {
        let expr = this.comparison();
        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL_EQUAL, TokenType.EQUAL_EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private comparison(): Expr {
        let expr = this.term();
        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private term(): Expr {
        let expr = this.factor();
        while (this.match(TokenType.MINUS, TokenType.PLUS, TokenType.DOT)) {
            const operator = this.previous();
            const right = this.factor();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private factor(): Expr {
        let expr = this.unary();
        while (this.match(TokenType.SLASH, TokenType.STAR, TokenType.PERCENT)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return new UnaryExpr(operator, right);
        }
        return this.call();
    }

    private call(): Expr {
        let expr = this.primary();
        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else {
                break;
            }
        }
        return expr;
    }

    private finishCall(callee: Expr): Expr {
        const args: Expr[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    // console.error("Can't have more than 255 arguments.");
                }
                args.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }
        const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
        return new CallExpr(callee, paren, args);
    }

    private primary(): Expr {
        if (this.match(TokenType.FALSE)) return new LiteralExpr(false);
        if (this.match(TokenType.TRUE)) return new LiteralExpr(true);
        if (this.match(TokenType.NULL)) return new LiteralExpr(null);

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new LiteralExpr(this.previous().literal);
        }

        if (this.match(TokenType.VARIABLE)) {
            return new VariableExpr(this.previous());
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return new VariableExpr(this.previous());
        }

        if (this.match(TokenType.LEFT_BRACKET)) {
            const elements: Expr[] = [];
            if (!this.check(TokenType.RIGHT_BRACKET)) {
                do {
                    elements.push(this.expression());
                } while (this.match(TokenType.COMMA));
            }
            this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after array elements.");
            return new ArrayExpr(elements);
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new GroupingExpr(expr);
        }

        throw new Error(`Expect expression at line ${this.peek().line}`);
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw new Error(message);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private synchronize(): void {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON) return;

            switch (this.peek().type) {
                case TokenType.FUNCTION:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.ECHO:
                case TokenType.RETURN:
                    return;
            }

            this.advance();
        }
    }
}
