const fs = require('fs');

// Load server.js and extract the parser function
const serverCode = fs.readFileSync('server.js', 'utf8');
eval(serverCode.match(/function analyzeMinutesWithAdvancedParser[\s\S]+?^}/m)[0]);

// Test text
const testText = `Speaker 1: Wise導入について再検討したい。金額条件を整理して提案する。
Speaker 2: Wiseは為替手数料が安い。0.6-0.8%で済む。
Speaker 1: 口座の残高上限が100万円なので注意が必要。
Speaker 2: NetStarsとの使い分けルールを決める。月次報告に含める。2月にレさんも参加。`;

const result = analyzeMinutesWithAdvancedParser(testText);

console.log('\n=== フォールバック解析結果 ===');
console.log('件数:', result.length);
console.log('\n最初のアイテム:');
console.log(JSON.stringify(result[0], null, 2));

console.log('\n=== 8項目チェック ===');
const firstItem = result[0];
console.log('agenda:', firstItem.agenda ? '✅' : '❌', firstItem.agenda);
console.log('action:', firstItem.action ? '✅' : '❌', firstItem.action);
console.log('assignee:', firstItem.assignee ? '✅' : '❌', firstItem.assignee);
console.log('deadline:', firstItem.deadline ? '✅' : '❌', firstItem.deadline);
console.log('purpose:', firstItem.purpose ? '✅' : '❌', firstItem.purpose);
console.log('status:', firstItem.status ? '✅' : '❌', firstItem.status);
console.log('notes1:', firstItem.notes1 !== undefined ? '✅' : '❌', firstItem.notes1);
console.log('notes2:', firstItem.notes2 !== undefined ? '✅' : '❌', firstItem.notes2);
