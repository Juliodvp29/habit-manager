import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  private themeService = inject(ThemeService);

  ngOnInit() {
    // El tema se aplica automáticamente al iniciar el servicio

  }
}
