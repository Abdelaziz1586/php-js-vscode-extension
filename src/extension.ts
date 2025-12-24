import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('PHP-JS extension is now active!');

  // Register a hover provider for PHP-JS
  const hoverProvider = vscode.languages.registerHoverProvider('phpjs', {
    provideHover(document, position, token) {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);

      // Provide hover info for built-in functions
      const builtinDocs: Record<string, string> = {
        'echo': '**echo** - Output one or more strings\n\n```phpjs\necho "Hello, World!";\necho $variable;\n```',
        'strlen': '**strlen($string)** - Returns the length of a string\n\n```phpjs\n$len = strlen("hello"); // 5\n```',
        'substr': '**substr($string, $start, $length?)** - Returns part of a string\n\n```phpjs\n$sub = substr("hello", 0, 3); // "hel"\n```',
        'strtoupper': '**strtoupper($string)** - Converts a string to uppercase\n\n```phpjs\n$upper = strtoupper("hello"); // "HELLO"\n```',
        'strtolower': '**strtolower($string)** - Converts a string to lowercase\n\n```phpjs\n$lower = strtolower("HELLO"); // "hello"\n```',
        'trim': '**trim($string)** - Removes whitespace from both ends of a string\n\n```phpjs\n$trimmed = trim("  hello  "); // "hello"\n```',
        'count': '**count($array)** - Returns the number of elements in an array\n\n```phpjs\n$arr = [1, 2, 3];\necho count($arr); // 3\n```',
      };

      if (builtinDocs[word]) {
        return new vscode.Hover(new vscode.MarkdownString(builtinDocs[word]));
      }

      // Provide hover info for keywords
      const keywordDocs: Record<string, string> = {
        'if': '**if** - Conditional statement\n\n```phpjs\nif ($condition) {\n  // code\n}\n```',
        'else': '**else** - Alternative branch of if statement\n\n```phpjs\nif ($condition) {\n  // code\n} else {\n  // alternative code\n}\n```',
        'elseif': '**elseif** - Additional conditional branch\n\n```phpjs\nif ($a) {\n  // code\n} elseif ($b) {\n  // code\n} else {\n  // code\n}\n```',
        'for': '**for** - Loop with counter\n\n```phpjs\nfor ($i = 0; $i < 10; $i++) {\n  echo $i;\n}\n```',
        'foreach': '**foreach** - Iterate over arrays\n\n```phpjs\nforeach ($array as $item) {\n  echo $item;\n}\n```',
        'while': '**while** - Loop while condition is true\n\n```phpjs\nwhile ($condition) {\n  // code\n}\n```',
        'function': '**function** - Define a reusable function\n\n```phpjs\nfunction greet($name) {\n  return "Hello, " . $name;\n}\n```',
        'return': '**return** - Return a value from a function\n\n```phpjs\nfunction add($a, $b) {\n  return $a + $b;\n}\n```',
      };

      if (keywordDocs[word]) {
        return new vscode.Hover(new vscode.MarkdownString(keywordDocs[word]));
      }

      return null;
    }
  });

  context.subscriptions.push(hoverProvider);

  // Register a completion provider for PHP-JS
  const completionProvider = vscode.languages.registerCompletionItemProvider('phpjs', {
    provideCompletionItems(document, position, token, context) {
      const completions: vscode.CompletionItem[] = [];

      // Keywords
      const keywords = ['if', 'else', 'elseif', 'for', 'foreach', 'while', 'function', 'return', 'echo', 'as', 'break', 'continue'];
      keywords.forEach(kw => {
        const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
        completions.push(item);
      });

      // Built-in functions
      const functions = ['strlen', 'substr', 'strtoupper', 'strtolower', 'trim', 'ltrim', 'rtrim', 'str_replace', 'strpos', 'explode', 'implode', 'count', 'isset', 'empty', 'is_array', 'is_string', 'is_numeric'];
      functions.forEach(fn => {
        const item = new vscode.CompletionItem(fn, vscode.CompletionItemKind.Function);
        item.insertText = new vscode.SnippetString(`${fn}($1)`);
        completions.push(item);
      });

      // Constants
      const constants = ['true', 'false', 'null'];
      constants.forEach(c => {
        const item = new vscode.CompletionItem(c, vscode.CompletionItemKind.Constant);
        completions.push(item);
      });

      return completions;
    }
  });

  context.subscriptions.push(completionProvider);
}

export function deactivate() {}
