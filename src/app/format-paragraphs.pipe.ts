import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatParagraphs'
})
export class FormatParagraphsPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null): SafeHtml {
    if (!value) return '';
    const paragraphs = value
      .split('\n')
      .filter(p => p.trim() !== '')
      .map(p => `<p class="mb-4 text-white text-lg leading-relaxed">${p.trim()}</p>`)
      .join('');
    return this.sanitizer.bypassSecurityTrustHtml(paragraphs);
  }
}