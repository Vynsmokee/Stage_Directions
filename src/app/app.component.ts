import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Stage_Directions';

  curtainDone = false;

  readonly loadingLetters = 'CARGANDO'.split('');

  readonly marqueeItems = [
    'Stage Directions —',
    'Design Event —',
    'Conference —',
    'Stage Directions —',
    'Design Event —',
    'Conference —',
    'Stage Directions —',
    'Design Event —',
    'Conference —',
  ];

  ngOnInit(): void {
    setTimeout(() => this.exitPreloader(), 2500);
  }

  private exitPreloader(): void {
    const preloader = document.querySelector(
      '.preloader',
    ) as HTMLElement | null;
    if (!preloader) return;

    // Add one class → CSS handles all phases with no JS gaps
    preloader.classList.add('is-exiting');

    // Remove from DOM after all animations finish (~1.6s total)
    setTimeout(() => {
      this.curtainDone = true;
    }, 1650);
  }
}
