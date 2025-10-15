import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/services/auth-service';
import { TranslationService } from 'src/app/core/services/translation-service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [IonIcon, IonSpinner,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    ReactiveFormsModule,
    IonItem,
    IonInput,
    IonButton,
    RouterModule,
    TranslateModule
  ]
})
export class ForgotPasswordPage {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private router = inject(Router);
  public translationService = inject(TranslationService);

  isLoading = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  email() {
    return this.form.get('email');
  }

  async onSubmit() {
    if (this.form.invalid) {
      const toast = await this.toastController.create({
        message: 'Introduce un correo válido',
        duration: 2500,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.isLoading.set(true);

    const emailValue = this.email()?.value || '';
    this.authService.requestPasswordReset(emailValue).subscribe({
      next: async () => {
        this.isLoading.set(false);
        const toast = await this.toastController.create({
          message: 'Si el correo existe, recibirás instrucciones para resetear tu contraseña.',
          duration: 4000,
          color: 'success'
        });
        await toast.present();
        await this.router.navigate(['/auth/login']);
      },
      error: async (err) => {
        this.isLoading.set(false);
        const message = err?.error?.message || 'Error al solicitar el reseteo de contraseña';
        const toast = await this.toastController.create({
          message,
          duration: 3500,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

}
