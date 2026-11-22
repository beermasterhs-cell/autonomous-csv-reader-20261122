// Independent slice-based implementation of the published csv-reader contract.
// No cross-case cache, network, clock, dependency, native addon or WebAssembly.
export function run(input) {
  const text=String(input.text), header=input.header===true;
  const rows=[], errors=[];
  let columns=null, width=-1, pos=text.charCodeAt(0)===0xfeff?1:0, line=1;
  let recordLine=1, recordRow=null, fieldValue='', ended=2, added=0;
  const delimiter=/[,\r\n]/g;
  const error=code=>errors.push({code,line:recordLine,row:recordRow});

  // Scan whole spans in V8, allocating only the final field and stray-CR pieces.
  function unquoted(prefix='') {
    let value=prefix, start=pos;
    added=0;
    delimiter.lastIndex=pos;
    while(true) {
      const found=delimiter.exec(text);
      if(found===null) {
        added+=text.length-start;
        fieldValue=value+text.slice(start); pos=text.length; ended=2; return;
      }
      const at=found.index, code=text.charCodeAt(at);
      added+=at-start;
      value+=text.slice(start,at);pos=at+1;
      if(code===44) {fieldValue=value;ended=0;return;}
      if(code===10) {line++;fieldValue=value;ended=1;return;}
      if(text.charCodeAt(pos)===10) {pos++;line++;fieldValue=value;ended=1;return;}
      error('stray_cr');start=pos;delimiter.lastIndex=pos;
    }
  }

  function quoted() {
    const opening=pos;
    let start=opening+1, cursor=start, chunks=null, closing=-1;
    while(true) {
      const quote=text.indexOf('"',cursor);
      if(quote<0) break;
      if(text.charCodeAt(quote+1)===34) {
        if(chunks===null) chunks=[];
        chunks.push(text.slice(start,quote),'"');
        start=quote+2;cursor=start;
      } else { closing=quote;break; }
    }
    if(closing<0) {
      pos=opening+1;error('unterminated_quote');unquoted('"');return;
    }
    let value;
    if(chunks===null) value=text.slice(start,closing);
    else {chunks.push(text.slice(start,closing));value=chunks.join('');}
    // A quoted CRLF, CR, or LF increments the physical line exactly once.
    const breaks=value.match(/\r\n|[\r\n]/g);
    if(breaks!==null) {
      line+=breaks.length;
      if(value.includes('\r')) value=value.replace(/\r\n?/g,'\n');
    }
    pos=closing+1;
    if(pos>=text.length) {fieldValue=value;ended=2;return;}
    const code=text.charCodeAt(pos);
    if(code===44) {pos++;fieldValue=value;ended=0;return;}
    if(code===10) {pos++;line++;fieldValue=value;ended=1;return;}
    if(code===13 && text.charCodeAt(pos+1)===10) {pos+=2;line++;fieldValue=value;ended=1;return;}
    unquoted(value);
    if(added>0) error('quote_junk');
  }

  while(pos<text.length) {
    while(text.charCodeAt(pos)===10 || text.charCodeAt(pos)===13 && text.charCodeAt(pos+1)===10) {
      pos+=text.charCodeAt(pos)===13?2:1;line++;
    }
    if(pos>=text.length) break;
    recordLine=line;recordRow=header && columns===null?null:rows.length;
    const fields=[];
    let wasQuoted=false;
    do {
      wasQuoted=text.charCodeAt(pos)===34;
      if(wasQuoted) quoted();else unquoted();
      fields.push(fieldValue);
    } while(ended===0);
    if(fields.length===1 && fields[0]==='' && !wasQuoted) continue;
    if(width<0) width=fields.length;
    if(header && columns===null) {columns=fields;continue;}
    if(fields.length<width) {
      errors.push({code:'short_row',line:recordLine,row:recordRow,fields:fields.length});
      while(fields.length<width) fields.push('');
    } else if(fields.length>width) {
      errors.push({code:'long_row',line:recordLine,row:recordRow,extra:fields.splice(width)});
    }
    rows.push(fields);
  }
  return {columns:header?(columns??[]):null,rows,errors};
}
