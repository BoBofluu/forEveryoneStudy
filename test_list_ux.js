const fs = require('fs');

// We will test if our changes work by checking the HTML and JS outputs roughly
console.log("Checking JapaneseProtice.html for date inputs...");
const htmlStr = fs.readFileSync('JapaneseProtice.html', 'utf8');
if (htmlStr.includes('id="searchStartDate"') && htmlStr.includes('type="date"')) {
    console.log("✅ HTML Date inputs found.");
} else {
    console.log("❌ Date inputs missing from HTML.");
}

console.log("Checking style.css for list group headers...");
const cssStr = fs.readFileSync('style.css', 'utf8');
if (cssStr.includes('.list-group-header') && cssStr.includes('.date-filter-group')) {
    console.log("✅ CSS classes for group headers and date filters found.");
} else {
    console.log("❌ Missing CSS classes.");
}

console.log("Checking app.js for grouping logic...");
const jsStr = fs.readFileSync('app.js', 'utf8');
if (jsStr.includes('let currentMonthStr') && jsStr.includes('.list-group-header')) {
    console.log("✅ JS grouping logic found.");
} else {
    console.log("❌ Missing JS grouping logic.");
}
