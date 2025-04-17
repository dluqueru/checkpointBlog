import { Directive, HostListener, Input, ElementRef } from '@angular/core';

@Directive({
  selector: '[appDefaultImage]'
})
export class DefaultImageDirective {

  @Input() appDefaultImage: string = '';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError() {
    this.el.nativeElement.src = this.appDefaultImage;
  }

  @HostListener('load')
  onLoad() {
    if (!this.el.nativeElement.src || this.el.nativeElement.src.trim() === '') {
      this.el.nativeElement.src = this.appDefaultImage;
    }
  }
}