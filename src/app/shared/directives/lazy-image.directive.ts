import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit {
  constructor(private el: ElementRef<HTMLImageElement>) { }

  ngOnInit() {
    const img = this.el.nativeElement;

    // Usar IntersectionObserver para lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.classList.add('loaded');
          }
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
  }
}