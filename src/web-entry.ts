import { Lexer } from './lexer';
import { Parser } from './parser';
import { Interpreter } from './interpreter';

if (typeof window !== 'undefined') {
    (window as any).PHPJS = {
        Lexer,
        Parser,
        Interpreter,
        run: (source: string) => {
            const lexer = new Lexer(source);
            const tokens = lexer.scanTokens();
            const parser = new Parser(tokens);
            const statements = parser.parse();
            const interpreter = new Interpreter();
            return interpreter.interpret(statements);
        },
        processScripts: () => {
            const scripts = document.querySelectorAll('script[type="text/phpjs"]');
            scripts.forEach(script => {
                const source = script.textContent;
                if (source) {
                    const result = (window as any).PHPJS.run(source);
                    // For script tags, we can either log the output or inject it
                    console.log("PHP-JS Script Result:", result);
                    if (result) {
                        const div = document.createElement('div');
                        div.innerHTML = result;
                        script.parentNode?.insertBefore(div, script.nextSibling);
                    }
                }
            });
        }
    };

    // Auto-process scripts on load
    window.addEventListener('DOMContentLoaded', () => {
        (window as any).PHPJS.processScripts();
    });
}
