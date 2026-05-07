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
  @ViewChild('crawlSection') crawlSectionRef!: ElementRef<HTMLElement>;
  @ViewChild('crawlMover') crawlMoverRef!: ElementRef<HTMLElement>;
  @ViewChild('starsCanvas') starsCanvasRef!: ElementRef<HTMLCanvasElement>;

  private rafId: number | null = null;
  private starsRafId: number | null = null;
  private crawlDriftRafId: number | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private marqueeOffset = 0;
  private crawlScrollY = 35;   // vh from scroll
  private crawlDriftY = 0;     // vh from auto-drift
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
    this.updateCrawl();
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
      this.startStars();
      this.startCrawlDrift();
    });
    this.updateCrawl();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.starsRafId !== null) cancelAnimationFrame(this.starsRafId);
    if (this.crawlDriftRafId !== null) cancelAnimationFrame(this.crawlDriftRafId);
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

  private startStars(): void {
    const canvas = this.starsCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const resizeListener = () => resize();
    window.addEventListener('resize', resizeListener);
    this.cleanupFns.push(() => window.removeEventListener('resize', resizeListener));

    // Three layers: tiny, small, medium stars
    const layers = [
      { count: 180, minR: 0.25, maxR: 0.7,  minB: 0.15, maxB: 0.55, speed: 0.0012 },
      { count: 80,  minR: 0.7,  maxR: 1.2,  minB: 0.35, maxB: 0.75, speed: 0.0022 },
      { count: 25,  minR: 1.2,  maxR: 2.0,  minB: 0.55, maxB: 1.0,  speed: 0.0035 },
    ];

    const stars = layers.flatMap(l =>
      Array.from({ length: l.count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: l.minR + Math.random() * (l.maxR - l.minR),
        base: l.minB + Math.random() * (l.maxB - l.minB),
        phase: Math.random() * Math.PI * 2,
        speed: l.speed + Math.random() * 0.001,
      }))
    );

    const tick = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const opacity = Math.max(0, Math.min(1, s.base + Math.sin(t * s.speed + s.phase) * 0.06));
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
        ctx.fill();
      }
      this.starsRafId = requestAnimationFrame(tick);
    };
    this.starsRafId = requestAnimationFrame(tick);
  }

  private startCrawlDrift(): void {
    const driftSpeed = 0.06; // vh per frame — noticeable crawl at 60fps
    const tick = () => {
      const section = this.crawlSectionRef?.nativeElement;
      if (section) {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        const inZone = window.scrollY >= sectionTop && window.scrollY < sectionBottom - window.innerHeight;
        if (inZone) {
          this.crawlDriftY -= driftSpeed;
          this.applyCrawlTransform();
        }
      }
      this.crawlDriftRafId = requestAnimationFrame(tick);
    };
    this.crawlDriftRafId = requestAnimationFrame(tick);
  }

  private applyCrawlTransform(): void {
    const mover = this.crawlMoverRef?.nativeElement;
    if (!mover) return;
    const y = this.crawlScrollY + this.crawlDriftY;
    mover.style.transform = `rotateX(22deg) translateY(${y}vh)`;
  }

  private updateCrawl(): void {
    const section = this.crawlSectionRef?.nativeElement;
    if (!section) return;

    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const scrollable = section.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, (window.scrollY - sectionTop) / scrollable));

    // Reset drift on every scroll event so scrolling back down restores position
    this.crawlDriftY = 0;

    // Start partially visible (35vh) → end well above screen (-90vh)
    this.crawlScrollY = 35 + (-90 - 35) * progress;
    this.applyCrawlTransform();
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
