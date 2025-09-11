// lib/utils.js
function trimTrailingHashes(s){ return s.replace(/\s*#*\s*$/, ''); }
function prettifyTitle(s){
  s = s.replace(/[-_]+/g, ' ');
  s = s.replace(/^\w/, (c)=>c.toUpperCase());
  s = s.replace(/ (\w)/g, (_,c)=>' '+c.toUpperCase());
  return s;
}
function parseHeadings(lines){
  const heads=[];
  lines.forEach((line,i)=>{
    const m = line.match(/^(#+)\s+(.+)/);
    if (m){ heads.push({ idx:i, level:m[1].length, text: trimTrailingHashes(m[2]) }); }
  });
  return heads;
}
function findFrontmatter(lines){
  let i=0; while(i<lines.length && /^\s*$/.test(lines[i])) i++;
  if (i<lines.length && /^---\s*$/.test(lines[i])){
    const s=i; i++;
    while(i<lines.length && !/^---\s*$/.test(lines[i])) i++;
    if (i<lines.length) return [s,i];
  }
  return [null,null];
}
function findH1(lines, fromIdx){
  const start = (fromIdx ?? -1) + 1;
  for(let i=start;i<lines.length;i++){
    const m = lines[i].match(/^#\s+(.+)/);
    if (m) return [i, trimTrailingHashes(m[1])];
  }
  return [null,null];
}
function hasSections(heads, maxDepth){
  return heads.some(h => h.level >= 2 && h.level <= maxDepth);
}
function sectionEndIndex(heads, i, totalLines){
  const cur = heads[i].level;
  for (let j=i+1;j<heads.length;j++){
    if (heads[j].level <= cur) return heads[j].idx - 1;
  }
  return totalLines - 1;
}
module.exports = { trimTrailingHashes, prettifyTitle, parseHeadings, findFrontmatter, findH1, hasSections, sectionEndIndex };
