import React, {useMemo} from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import {FIGURE_API_BASE_URL} from '@/constants/Api';
import {Colors} from '@/constants/Colors';
import {useColorScheme} from '@/hooks/useColorScheme';
const ABSOLUTE_URL_PATTERN = /^(?:https?:|data:|blob:|\/\/)/i;
function ensureAbsoluteFigureUrl(src: string): string {
  const trimmed = src?.trim();
  if (!trimmed) return src;
  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }
  try {
    return new URL(trimmed, FIGURE_API_BASE_URL).toString();
  } catch {
    return src;
  }
}

function rewriteRelativeImageSources(html: string): string {
  if (!html) return html;
  return html.replace(/<img\b([^>]*)src=(['"])([^'"\s>]+)\2/gi, (match, before, quote, src) => {
    const resolved = ensureAbsoluteFigureUrl(src);
    if (resolved === src) {
      return match;
    }
    return `<img${before}src=${quote}${resolved}${quote}`;
  });
}

/**
 * マークダウンの表のセル内の改行を処理する関数
 * セル内の改行（\n文字列リテラルまたは実際の改行）を一時的にプレースホルダーに置き換え、パース後に<br>に戻す
 */
function preprocessTableNewlines(content: string): { processed: string; restore: (html: string) => string } {
  // 表のセル内の改行を検出するためのプレースホルダー
  const placeholderPrefix = '___TABLE_CELL_NEWLINE_';
  const placeholders: string[] = [];
  let placeholderIndex = 0;

  // マークダウンの表の範囲を検出
  const lines = content.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // 表の行かどうかをチェック（|で始まり、|で終わる、または区切り行）
    const isTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
    const isTableSeparator = /^\s*\|[\s\-:]+\|\s*$/.test(trimmedLine);
    
    if (isTableRow || isTableSeparator) {
      inTable = true;
      
      // セル内の\n文字列リテラルを検出して置き換え
      const processedLine = line.replace(/\\n/g, () => {
        const placeholder = `${placeholderPrefix}${placeholderIndex++}`;
        placeholders.push('\n');
        return placeholder;
      });
      processedLines.push(processedLine);
    } else {
      // 表の外に出た場合、フラグをリセット
      if (inTable && trimmedLine.length > 0 && !trimmedLine.startsWith('|')) {
        inTable = false;
      }
      processedLines.push(line);
    }
  }

  const processed = processedLines.join('\n');

  // 復元関数：HTML内のプレースホルダーを<br>に置き換え
  const restore = (html: string): string => {
    let restored = html;
    placeholders.forEach((original, index) => {
      const placeholder = `${placeholderPrefix}${index}`;
      // HTMLエスケープされたプレースホルダーも考慮
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restored = restored.replace(new RegExp(escapedPlaceholder, 'g'), '<br>');
    });
    return restored;
  };

  return { processed, restore };
}

/**
 * マークダウンの表で、行の直後に「| で始まらない連続行」が続く場合に
 * それらを直前行の「最後のセル」の内容として結合する。
 * PDF等由来の改行でセル内容が行分割されてしまうケースへの対策。
 */
function normalizeTableRowContinuations(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;
  // 行判定用の正規表現
  const rowRe = /^\s*\|.*\|\s*$/;
  // 区切り行（|-|-| や |:---:| など）
  const sepRe = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 通常の表行
    if (rowRe.test(trimmed) && !sepRe.test(trimmed)) {
      let rowLine = line;
      const continuations: string[] = [];
      let j = i + 1;
      // 直後の「|で始まらない」「空行でも区切りでもない」行を収集
      while (j < lines.length) {
        const next = lines[j];
        const nextTrim = next.trim();
        const isNextRow = rowRe.test(nextTrim);
        const isNextSep = sepRe.test(nextTrim);
        const isBlank = nextTrim.length === 0;
        if (isNextRow || isNextSep || isBlank) break;
        // 表の継続行として扱う
        continuations.push(nextTrim);
        j += 1;
      }
      if (continuations.length > 0) {
        // 収集した継続行を <br> 区切りで最後のセルへ結合
        const appendHtml = '<br>' + continuations.join('<br>');
        // 行末の '|' の直前に差し込む
        rowLine = rowLine.replace(/\|\s*$/, `${appendHtml} |`);
        // 使い切った行をスキップ
        i = j;
      } else {
        i += 1;
      }
      out.push(rowLine);
      continue;
    }

    // 区切り行 or 表以外の行はそのまま
    out.push(line);
    i += 1;
  }
  return out.join('\n');
}

export default function Markdown({content='',isMarkdown=true}: {content:string;isMarkdown?:boolean}) {
 const palette=Colors[useColorScheme()||'light'];
 const html=useMemo(()=>{
  if(!content || typeof window==='undefined') return '';
  const md=new MarkdownIt({html:true,breaks:true,linkify:true});
  const normalized=isMarkdown?normalizeTableRowContinuations(content):content;
  const prep=preprocessTableNewlines(normalized);
  let result=prep.restore(isMarkdown?md.render(prep.processed):normalized);
  result=rewriteRelativeImageSources(result);
  const safe=DOMPurify.sanitize(result,{ADD_ATTR:['loading','decoding'],FORBID_TAGS:['style','iframe','form']});
  const template=document.createElement('template'); template.innerHTML=safe;
  template.content.querySelectorAll('img').forEach(img=>{img.loading='lazy';img.decoding='async';});
  template.content.querySelectorAll('a').forEach(a=>{a.rel='noopener noreferrer';});
  template.content.querySelectorAll('table').forEach(table=>{const wrapper=document.createElement('div');wrapper.className='table-scroll';table.replaceWith(wrapper);wrapper.append(table);});
  return template.innerHTML;
 },[content,isMarkdown]);
 return <div className="markdown" style={{color:palette.text,'--border':palette.border,'--surface':palette.surface,'--muted':palette.surfaceMuted,'--tint':palette.tint} as React.CSSProperties} dangerouslySetInnerHTML={{__html:html}} />;
}
