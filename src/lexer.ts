export enum TokenType {
    // Single-character tokens
    LEFT_PAREN, RIGHT_PAREN,
    LEFT_BRACE, RIGHT_BRACE,
    LEFT_BRACKET, RIGHT_BRACKET,
    COMMA, SEMICOLON,

    // Operators
    PLUS, MINUS, STAR, SLASH, PERCENT,
    PLUS_PLUS, MINUS_MINUS, STAR_STAR,
    DOT, DOT_EQUAL,

    // Comparison
    EQUAL, EQUAL_EQUAL, EQUAL_EQUAL_EQUAL,
    BANG, BANG_EQUAL, BANG_EQUAL_EQUAL,
    GREATER, GREATER_EQUAL,
    LESS, LESS_EQUAL,

    // Logical
    AND, OR,

    // Assignment
    PLUS_EQUAL, MINUS_EQUAL, STAR_EQUAL, SLASH_EQUAL, PERCENT_EQUAL,

    // Literals
    IDENTIFIER, VARIABLE, STRING, NUMBER,

    // Keywords
    IF, ELSE, ELSEIF, FOR, FOREACH, WHILE, DO, SWITCH, CASE, DEFAULT,
    BREAK, CONTINUE, RETURN, ECHO, FUNCTION, AS, INCLUDE, REQUIRE,
    VAR, CONST, LET, TRUE, FALSE, NULL,

    EOF
}

export interface Token {
    type: TokenType;
    lexeme: string;
    literal: any;
    line: number;
}

export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    private static readonly keywords: Record<string, TokenType> = {
        'if': TokenType.IF,
        'else': TokenType.ELSE,
        'elseif': TokenType.ELSEIF,
        'for': TokenType.FOR,
        'foreach': TokenType.FOREACH,
        'while': TokenType.WHILE,
        'do': TokenType.DO,
        'switch': TokenType.SWITCH,
        'case': TokenType.CASE,
        'default': TokenType.DEFAULT,
        'break': TokenType.BREAK,
        'continue': TokenType.CONTINUE,
        'return': TokenType.RETURN,
        'echo': TokenType.ECHO,
        'function': TokenType.FUNCTION,
        'as': TokenType.AS,
        'include': TokenType.INCLUDE,
        'require': TokenType.REQUIRE,
        'var': TokenType.VAR,
        'const': TokenType.CONST,
        'let': TokenType.LET,
        'true': TokenType.TRUE,
        'false': TokenType.FALSE,
        'null': TokenType.NULL,
    };

    constructor(source: string) {
        this.source = source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push({
            type: TokenType.EOF,
            lexeme: "",
            literal: null,
            line: this.line
        });
        return this.tokens;
    }

    private scanToken() {
        const c = this.advance();
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case '[': this.addToken(TokenType.LEFT_BRACKET); break;
            case ']': this.addToken(TokenType.RIGHT_BRACKET); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '.':
                if (this.match('=')) {
                    this.addToken(TokenType.DOT_EQUAL);
                } else {
                    this.addToken(TokenType.DOT);
                }
                break;
            case '-':
                if (this.match('-')) {
                    this.addToken(TokenType.MINUS_MINUS);
                } else if (this.match('=')) {
                    this.addToken(TokenType.MINUS_EQUAL);
                } else {
                    this.addToken(TokenType.MINUS);
                }
                break;
            case '+':
                if (this.match('+')) {
                    this.addToken(TokenType.PLUS_PLUS);
                } else if (this.match('=')) {
                    this.addToken(TokenType.PLUS_EQUAL);
                } else {
                    this.addToken(TokenType.PLUS);
                }
                break;
            case '*':
                if (this.match('*')) {
                    this.addToken(TokenType.STAR_STAR);
                } else if (this.match('=')) {
                    this.addToken(TokenType.STAR_EQUAL);
                } else {
                    this.addToken(TokenType.STAR);
                }
                break;
            case '/':
                if (this.match('/')) {
                    // A comment goes until the end of the line.
                    while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
                } else if (this.match('*')) {
                    this.blockComment();
                } else if (this.match('=')) {
                    this.addToken(TokenType.SLASH_EQUAL);
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            case '%':
                this.addToken(this.match('=') ? TokenType.PERCENT_EQUAL : TokenType.PERCENT);
                break;
            case '!':
                if (this.match('=')) {
                    if (this.match('=')) {
                        this.addToken(TokenType.BANG_EQUAL_EQUAL);
                    } else {
                        this.addToken(TokenType.BANG_EQUAL);
                    }
                } else {
                    this.addToken(TokenType.BANG);
                }
                break;
            case '=':
                if (this.match('=')) {
                    if (this.match('=')) {
                        this.addToken(TokenType.EQUAL_EQUAL_EQUAL);
                    } else {
                        this.addToken(TokenType.EQUAL_EQUAL);
                    }
                } else {
                    this.addToken(TokenType.EQUAL);
                }
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case '&':
                if (this.match('&')) this.addToken(TokenType.AND);
                break;
            case '|':
                if (this.match('|')) this.addToken(TokenType.OR);
                break;

            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace.
                break;

            case '\n':
                this.line++;
                break;

            case '"': this.string('"'); break;
            case '\'': this.string('\''); break;

            case '$': this.variable(); break;

            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    // console.error(`Unexpected character: ${c} at line ${this.line}`);
                }
                break;
        }
    }

    private blockComment() {
        while (!(this.peek() === '*' && this.peekNext() === '/') && !this.isAtEnd()) {
            if (this.peek() === '\n') this.line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            // console.error("Unterminated block comment.");
            return;
        }

        // The closing "*/".
        this.advance();
        this.advance();
    }

    private identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        const text = this.source.substring(this.start, this.current);
        let type = Lexer.keywords[text];
        if (type === undefined) type = TokenType.IDENTIFIER;
        this.addToken(type);
    }

    private variable() {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        const text = this.source.substring(this.start, this.current);
        this.addToken(TokenType.VARIABLE, text);
    }

    private number() {
        while (this.isDigit(this.peek())) this.advance();

        // Look for a fractional part.
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }

        this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
    }

    private string(quote: string) {
        while (this.peek() !== quote && !this.isAtEnd()) {
            if (this.peek() === '\n') this.line++;
            if (this.peek() === '\\' && this.peekNext() === quote) {
                this.advance(); // consume \
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            // console.error("Unterminated string.");
            return;
        }

        // The closing quote.
        this.advance();

        // Trim the surrounding quotes.
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;

        this.current++;
        return true;
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
                c === '_';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private addToken(type: TokenType, literal: any = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({ type, lexeme: text, literal, line: this.line });
    }
}
