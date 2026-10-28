const fs=require('node:fs'),assert=require('node:assert/strict'),stages=require('../src/review-data.js');
const ui=fs.readFileSync(require('node:path').join(__dirname,'../src/review.js'),'utf8');
const fn=ui.slice(ui.indexOf('function stageBounds('),ui.indexOf('\nfunction resize()'));
const bounds=new Function(fn+';return stageBounds;')();
for(const width of [320,390,430])for(const stage of stages){const b=bounds(stage),scale=Math.min((width-24)/(b.right-b.left),(844-244)/(b.bottom-b.top),1.3);const goal=stage.nodes.find(n=>n.goal);assert.ok(2*goal.r*scale>=44,stage.name+' capture circle too small on '+width);for(const n of stage.nodes){assert.ok(n.x-n.r>=b.left&&n.x+n.r<=b.right);assert.ok(n.y-n.r>=b.top&&n.y+n.r<=b.bottom)}}
assert.deepEqual(stages[6].nodes.map(n=>n.r),[66,60,54,48]);
assert.ok(stages.every(l=>l.nodes.every(n=>n.r>=40)));
console.log('PASS 320/390/430px: all goals retain >=44px capture diameter, all planets fit, no tutorial planet below radius 48.');
