'use strict';
const assert=require('node:assert/strict');
const {TERMS}=require('../../tools/patient-editorial-v08444.cjs');

const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0',ensp:'\u2002',emsp:'\u2003',thinsp:'\u2009',Tab:'\t',NewLine:'\n',ndash:'–',mdash:'—',hellip:'…',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',deg:'°',plusmn:'±',times:'×',divide:'÷',le:'≤',ge:'≥',ne:'≠',micro:'µ',middot:'·',bull:'•',copy:'©',reg:'®',trade:'™',euro:'€',pound:'£'};
function decodeEntities(text){
 return String(text).replace(/&#(?:x([\da-f]+)|(\d+));|&([a-z][\da-z]*);/gi,(literal,hex,dec,name)=>{
  if(name)return Object.hasOwn(entities,name)?entities[name]:literal;
  const point=parseInt(hex||dec,hex?16:10);
  return point>0&&point<=0x10ffff&&!(point>=0xd800&&point<=0xdfff)?String.fromCodePoint(point):literal;
 });
}
const space=text=>String(text).replace(/\s+/g,' ').trim();
const escapeRx=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const expansions=TERMS.map(([acronym,full])=>({acronym,full:space(full)}))
 .sort((a,b)=>b.full.length-a.full.length)
 .map(({acronym,full})=>({acronym,pattern:new RegExp(`(?<![A-Za-z0-9])${escapeRx(full)} \\(${escapeRx(acronym)}\\)(?![A-Za-z0-9])`,'g')}));

/** Only explicit full-name (acronym) pairs published by the approved dictionary
 * are reversible. Clinical qualifiers and all other parentheses stay intact. */
function normalizePatientText(text,options={}){
 let result=space(options.alreadyDecoded?text:decodeEntities(text));
 for(const {acronym,pattern} of expansions)result=result.replace(pattern,acronym);
 return result;
}

/** Read semantic body text. Script data, attributes, head metadata, templates
 * and hidden/aria-hidden content cannot satisfy a patient-text assertion. */
function visibleBodyText(html){
 const tokens=/<!--[\s\S]*?-->|<(head|script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>|<(?:[^>"']|"[^"]*"|'[^']*')+>/gi;
 const blocks=new Set(['address','article','aside','blockquote','body','caption','dd','div','dl','dt','fieldset','figcaption','figure','footer','form','h1','h2','h3','h4','h5','h6','header','hr','li','main','nav','ol','p','pre','section','table','tbody','td','tfoot','th','thead','tr','ul']);
 const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
 let offset=0,inBody=true,hiddenDepth=0;const stack=[],parts=[];
 const append=text=>{if(inBody&&!hiddenDepth)parts.push(text);};
 for(const token of String(html).matchAll(tokens)){
  append(html.slice(offset,token.index));offset=token.index+token[0].length;
  const markup=token[0];if(token[1]||markup.startsWith('<!--'))continue;
  const closing=markup.match(/^<\/\s*([a-z][\da-z:-]*)/i);
  const opening=markup.match(/^<\s*([a-z][\da-z:-]*)/i);
  if(closing){
   const tag=closing[1].toLowerCase();if(blocks.has(tag))append(' ');
   const at=stack.map(x=>x.tag).lastIndexOf(tag);
   if(at>=0)for(const item of stack.splice(at))if(item.hidden)hiddenDepth--;
   if(tag==='body')inBody=false;
  }else if(opening){
   const tag=opening[1].toLowerCase();if(tag==='html')inBody=false;if(tag==='body')inBody=true;
   const hidden=/\shidden(?:\s|=|>)/i.test(markup)||/\saria-hidden\s*=\s*["']true["']/i.test(markup)||/\sstyle\s*=\s*["'][^"']*\bdisplay\s*:\s*none\b/i.test(markup);
   if(!hidden&&(blocks.has(tag)||tag==='br'))append(' ');
   if(!voids.has(tag)&&! /\/\s*>$/.test(markup)){
    stack.push({tag,hidden});if(hidden)hiddenDepth++;
   }
  }
 }
 append(html.slice(offset));return space(decodeEntities(parts.join('')));
}

function assertVisibleTextIncludes(html,expected,message='Patient clinical wording retained'){
 const actual=normalizePatientText(visibleBodyText(html),{alreadyDecoded:true});
 const wanted=normalizePatientText(expected);
 assert(wanted.length>0,'Expected patient text must not be empty');
 assert(actual.includes(wanted),`${message}\nExpected visible text: ${wanted}`);
}
module.exports={decodeEntities,normalizePatientText,visibleBodyText,assertVisibleTextIncludes};
