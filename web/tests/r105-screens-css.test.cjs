// R105 screens (workstream S): the new CSS only applies to the UI edition and never sets text below 14px.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(path.resolve(__dirname,'..','css','r104-story.css'),'utf8');
const start=css.indexOf('R105 screens (workstream S)');
assert.ok(start>0,'R105 section marker');
const section=css.slice(start);

// flatten to [selector, body] pairs (media blocks are walked, keyframes skipped)
function rules(text){
 const out=[];let i=0;
 while(i<text.length){
  const open=text.indexOf('{',i);if(open<0)break;
  const head=text.slice(i,open).replace(/\/\*[\s\S]*?\*\//g,'').trim();
  let depth=1,j=open+1;while(j<text.length&&depth){if(text[j]==='{')depth++;else if(text[j]==='}')depth--;j++}
  const body=text.slice(open+1,j-1);
  if(/^@media/.test(head))out.push(...rules(body));
  else if(!/^@/.test(head))out.push([head,body]);
  i=j;
 }
 return out;
}
const all=rules(section.slice(section.indexOf('*/')+2));

test('every selector in the R105 section is scoped to html[data-polish-edition][data-ui-edition]',()=>{
 assert.ok(all.length>80);
 for(const [sel] of all)for(const part of sel.split(/,(?![^(]*\))/))assert.ok(part.trim().startsWith('html[data-polish-edition][data-ui-edition]'),'unscoped: '+part.trim().slice(0,80));
});

test('no font-size below 14px in the R105 section',()=>{
 for(const [sel,body] of all){
  for(const m of body.matchAll(/(?:^|[;{\s])font(?:-size)?\s*:\s*(?:[a-z0-9 ]*?\s)?(\d+(?:\.\d+)?)px/g)){
   if(/r105-portrait|r105-bob/.test(sel))continue;
   assert.ok(Number(m[1])>=14||/font:\s*0/.test(body)||m[1]==='0',sel.slice(0,70)+' -> '+m[0]);
  }
 }
});

test('result sheets reset the HUD layout (static position, bottom sheet, landscape column)',()=>{
 const text=section;
 assert.match(text,/#squareResult \.result-actions\{\s*position:static;display:flex!important/);
 assert.match(text,/#squareResult \.box\{\s*position:relative;inset:auto;/);
 assert.match(text,/@media \(max-height:480px\)\{\s*html\[data-polish-edition\]\[data-ui-edition\]:root body\[data-restoration=true\] #squareResult\{flex-direction:row/);
 assert.match(text,/\.r104-dream-result \.box\{[^}]*border-radius:28px 28px 0 0/);
});
