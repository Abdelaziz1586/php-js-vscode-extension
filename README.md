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

### HTML Integration
Syntax highlighting for PHP-JS code inside `<script type="text/phpjs">` tags in HTML files.

### Snippets
Quick code snippets for common patterns:

| Prefix | Description |
|--------|-------------|
| `echo` | Echo a string |
| `echov` | Echo a variable |
| `var` | Declare a variable |
| `if` | If statement |
| `ife` | If-else statement |
| `ifeif` | If-elseif-else statement |
| `for` | For loop |
| `foreach` | Foreach loop |
| `while` | While loop |
| `function` | Function definition |
| `arr` | Array declaration |
| `ret` | Return statement |

### IntelliSense
- Auto-completion for keywords and built-in functions
- Hover documentation for keywords and functions

## Installation

### From VSIX (Local Installation)
1. Build the extension:
   ```bash
   cd vscode-phpjs
   npm install
   npm run compile
   npm run package
   ```

2. Install the generated `.vsix` file:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Install from VSIX"
   - Select the generated `phpjs-0.1.0.vsix` file

### Development Mode
1. Open the `vscode-phpjs` folder in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open a `.phpjs` file to test the extension

## Usage

### .phpjs Files
Create files with the `.phpjs` extension to get automatic syntax highlighting:

```phpjs
// greet.phpjs
function greet($name) {
  return "Hello, " . $name;
}

$message = greet("World");
echo $message;
```

### HTML Files
Use `<script type="text/phpjs">` tags in HTML for embedded PHP-JS code:

```html
<script type="text/phpjs">
  $fruits = ["apple", "banana", "orange"];
  foreach ($fruits as $fruit) {
    echo $fruit . "<br />";
  }
</script>
```

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
