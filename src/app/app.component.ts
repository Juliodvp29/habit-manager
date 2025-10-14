import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme-service';
import { TranslationService } from './core/services/translation-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);

  ngOnInit() {
    // El tema se aplica automáticamente al iniciar el servicio

  }
}
