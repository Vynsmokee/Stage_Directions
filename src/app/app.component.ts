import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Stage_Directions';

  curtainDone = false;
  headerScrolled = false;
  mobileMenuOpen = false;

  readonly loadingLetters = 'CARGANDO'.split('');

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

  ngOnInit(): void {
    setTimeout(() => this.exitPreloader(), 2500);
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
