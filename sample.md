# Sample Markdown File

This is a **test file** for MDViewer. It demonstrates various Markdown features.

## Text Formatting

You can use **bold**, *italic*, ~~strikethrough~~, and `inline code`.

Here's a [link to Google](https://www.google.com).

## Lists

### Unordered List
- Item one
- Item two
  - Sub-item A
  - Sub-item B
- Item three

### Ordered List
1. First item
2. Second item
3. Third item

### Task List
- [x] Completed task
- [x] Another done
- [ ] Pending task
- [ ] Future task

## Code Block

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return { message: `Welcome to MDViewer` };
}

greet('World');
```

```python
def fibonacci(n):
    """Generate Fibonacci sequence."""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

list(fibonacci(10))
```

## Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

## Table

| Feature | Status | Notes |
|---------|--------|-------|
| Headings | ✅ | H1 through H6 |
| Bold/Italic | ✅ | Full support |
| Code Blocks | ✅ | With syntax highlighting |
| Tables | ✅ | GitHub-style |
| Task Lists | ✅ | Interactive checkboxes |
| Images | ✅ | Relative & absolute paths |

## Horizontal Rule

---

## Nested Content

1. First level
   - Nested bullet
   - Another bullet
     1. Deep nested number
     2. Another deep item
2. Back to first level

## HTML Support

This is a paragraph with <mark>highlighted text</mark> and some <sup>superscript</sup>.

---

*End of sample document* 🎉
