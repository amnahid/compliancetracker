// Syntax check for dashboard page
const fs = require('fs');

const filePath = 'app/dashboard/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Count opening and closing braces
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;

// Count opening and closing parentheses
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;

// Count opening and closing brackets
const openBrackets = (content.match(/\[/g) || []).length;
const closeBrackets = (content.match(/\]/g) || []).length;

console.log(`File: ${filePath}`);
console.log(`Open braces: ${openBraces}, Close braces: ${closeBraces}`);
console.log(`Open parens: ${openParens}, Close parens: ${closeParens}`);
console.log(`Open brackets: ${openBrackets}, Close brackets: ${closeBrackets}`);

if (openBraces !== closeBraces) {
  console.log('⚠️  Brace mismatch detected!');
}
if (openParens !== closeParens) {
  console.log('⚠️  Parentheses mismatch detected!');
}
if (openBrackets !== closeBrackets) {
  console.log('⚠️  Bracket mismatch detected!');
}
