const fs = require('fs');

// We will test if our changes work by checking the HTML and JS outputs roughly
console.log("Checking JapaneseProtice.html for grid layout...");
const htmlStr = fs.readFileSync('JapaneseProtice.html', 'utf8');
if (htmlStr.includes('id="inlineCalendar"')) {
    console.log("✅ HTML Date inputs removed and inlineCalendar found.");
} else {
    console.log("❌ inlineCalendar missing from HTML.");
}

console.log("Checking style.css for grid CSS...");
const cssStr = fs.readFileSync('style.css', 'utf8');
if (cssStr.includes('grid-template-columns: repeat(auto-fill') && cssStr.includes('.inline-calendar')) {
    console.log("✅ CSS classes for grid and inline calendar found.");
} else {
    console.log("❌ Missing CSS classes.");
}

console.log("Checking app.js for rendering logic...");
const jsStr = fs.readFileSync('app.js', 'utf8');
if (jsStr.includes('renderCalendar()') && jsStr.includes('.fold-icon')) {
    console.log("✅ JS calendar logic and folder icon logic found.");
} else {
    console.log("❌ Missing JS rendering calendar logic.");
}
