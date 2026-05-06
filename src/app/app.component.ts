import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ViewChild, ElementRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'Stage_Directions';

  @ViewChild('marqueeWrap') marqueeWrapRef!: ElementRef<HTMLElement>;

  private rafId: number | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private marqueeOffset = 0;
  private readonly autoScrollSpeed = 1.2;
  private cleanupFns: Array<() => void> = [];

  curtainDone = false;
  headerScrolled = false;
  mobileMenuOpen = false;

  constructor(private ngZone: NgZone) {}

  readonly loadingLetters = 'LOADING'.split('');

  readonly navLinks = [
    { label: 'About', href: '#' },
    { label: 'Services', href: '#' },
    { label: 'Our Work', href: '#' },
    { label: 'Latest News', href: '#' },
    { label: 'Contact', href: '#' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.headerScrolled = window.scrollY > 40;
  }

  onTitleMouseMove(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x.toFixed(1)}%`);
    el.style.setProperty('--my', `${y.toFixed(1)}%`);
  }

  onTitleMouseLeave(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
  }

  onCardTilt(e: MouseEvent): void {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rotY = (dx * 10).toFixed(2);
    const rotX = (-dy * 7).toFixed(2);
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`;
    card.style.setProperty('--glow-x', `${((e.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
    card.style.setProperty('--glow-y', `${((e.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
  }

  onCardTiltReset(e: MouseEvent): void {
    const card = e.currentTarget as HTMLElement;
    card.style.transform = '';
    card.style.removeProperty('--glow-x');
    card.style.removeProperty('--glow-y');
  }

  ngOnInit(): void {
    setTimeout(() => this.exitPreloader(), 2500);
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.startAutoScroll();
      this.bindDragEvents();
    });
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.cleanupFns.forEach(fn => fn());
  }

  private startAutoScroll(): void {
    const wrap = this.marqueeWrapRef.nativeElement;
    const list = wrap.querySelector('.sd-marquee__list') as HTMLElement;

    const tick = () => {
      const half = list.offsetWidth / 2;

      if (half > 0) {
        if (!this.isDragging) {
          this.marqueeOffset -= this.autoScrollSpeed;
        }
        // Normalize into (-half, 0] in one step using modulo
        this.marqueeOffset = this.marqueeOffset % half;
        if (this.marqueeOffset > 0) this.marqueeOffset -= half;
        list.style.transform = `translateX(${this.marqueeOffset}px)`;
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private bindDragEvents(): void {
    const wrap = this.marqueeWrapRef.nativeElement;
    const list = wrap.querySelector('.sd-marquee__list') as HTMLElement;
    let dragOffsetAtStart = 0;

    const onMouseDown = (e: MouseEvent) => {
      this.isDragging = true;
      this.dragStartX = e.pageX;
      dragOffsetAtStart = this.marqueeOffset;
      wrap.classList.add('is-dragging');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      const walk = (e.pageX - this.dragStartX) * 1.5;
      const half = list.offsetWidth / 2;
      if (half <= 0) return;
      let next = (dragOffsetAtStart + walk) % half;
      if (next > 0) next -= half;
      this.marqueeOffset = next;
    };

    const onMouseUp = () => {
      this.isDragging = false;
      wrap.classList.remove('is-dragging');
    };

    const onTouchStart = (e: TouchEvent) => {
      this.isDragging = true;
      this.dragStartX = e.touches[0].pageX;
      dragOffsetAtStart = this.marqueeOffset;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!this.isDragging) return;
      const walk = (e.touches[0].pageX - this.dragStartX) * 1.5;
      const half = list.offsetWidth / 2;
      if (half <= 0) return;
      let next = (dragOffsetAtStart + walk) % half;
      if (next > 0) next -= half;
      this.marqueeOffset = next;
    };

    const onTouchEnd = () => { this.isDragging = false; };

    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: true });
    wrap.addEventListener('touchend', onTouchEnd);

    this.cleanupFns.push(
      () => wrap.removeEventListener('mousedown', onMouseDown),
      () => window.removeEventListener('mousemove', onMouseMove),
      () => window.removeEventListener('mouseup', onMouseUp),
      () => wrap.removeEventListener('touchstart', onTouchStart),
      () => wrap.removeEventListener('touchmove', onTouchMove),
      () => wrap.removeEventListener('touchend', onTouchEnd),
    );
  }

  private exitPreloader(): void {
    const preloader = document.querySelector(
      '.preloader',
    ) as HTMLElement | null;
    if (!preloader) return;
    preloader.classList.add('is-exiting');
    setTimeout(() => {
      this.curtainDone = true;
    }, 1650);
  }
}
