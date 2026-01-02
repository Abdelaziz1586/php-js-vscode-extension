# PHP-JS VS Code Extension

Syntax highlighting, snippets, and language support for PHP-JS (`.phpjs`) files.

## Features

### Syntax Highlighting
- Variables (`$name`, `$age`)
- Keywords (`if`, `else`, `for`, `foreach`, `while`, `function`, `echo`, etc.)
- Strings (double and single quoted, with variable interpolation in double quotes)
- Numbers (integers and floats)
- Comments (single-line `//` and multi-line `/* */`)
- Operators (arithmetic, comparison, logical, string concatenation)
- Built-in functions

### Execution Engine (NEW)
- **Lexer-based Interpreter**: A robust and fast Lexer/Parser/Interpreter replaces the previous regex-based approach.
- **Run PHP-JS Command**: Directly run your `.phpjs` files within VS Code.
- **Built-in Functions**: Support for `strlen`, `count`, `strtoupper`, `strtolower`, `trim`, etc.

### HTML Integration
Syntax highlighting for PHP-JS code inside `<script type="text/phpjs">` tags in HTML files.

... (snippets table) ...

### IntelliSense
- Auto-completion for keywords and built-in functions
- Hover documentation for keywords and functions

## Usage

### Running PHP-JS Code
1. Open a `.phpjs` file.
2. Click the **Play** icon in the editor title bar OR press `Ctrl+Shift+P` and type `PHP-JS: Run PHP-JS`.
3. View the output in the **PHP-JS Output** channel.

### .phpjs Files
Create files with the `.phpjs` extension:

```phpjs
// math.phpjs
function add($a, $b) {
  return $a + $b;
}

$x = 10;
$y = 20;
$sum = add($x, $y);
echo "The sum is: " . $sum; // Output: The sum is: 30
```

### Supported Features
- **Variables**: Start with `$`.
- **Functions**: Defined with `function`.
- **Flow Control**: `if`, `elseif`, `else`, `while`, `for`.
- **Echo**: Use `echo` to print to the output channel.
- **Strings**: Use `.` for concatenation (PHP style).

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

## License

MIT
