import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatParagraphs'
})
export class FormatParagraphsPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null): SafeHtml {
    if (!value) return '';

    let processed = value
      .replace(/style="[^"]*"/g, '')
      .replace(/width:\s*\d+px;/g, '')
      .replace(/<img/g, '<img class="max-w-full h-auto rounded-lg my-4"');

    processed = processed
      .replace(/<p>/g, '<p class="mb-4 text-justify">')
      .replace(/<ul>/g, '<ul class="list-disc pl-8 mb-6">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-8 mb-6">')
      .replace(/<li>/g, '<li class="mb-2 text-left">')
      .replace(/<h1>/g, '<h1 class="text-4xl font-bold mb-6 mt-8">')
      .replace(/<h2>/g, '<h2 class="text-3xl font-bold mb-5 mt-7">')
      .replace(/<h3>/g, '<h3 class="text-2xl font-bold mb-4 mt-6">')
      .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-gray-500 pl-4 mb-4 text-gray-300 italic">')
      .replace(/<pre>/g, '<pre class="whitespace-pre-wrap bg-gray-700 p-4 rounded mb-4 overflow-x-auto text-sm">');

    return this.sanitizer.bypassSecurityTrustHtml(processed);
  }
}