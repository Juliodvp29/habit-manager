import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonIcon,
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
export class ResetPasswordPage {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public translationService = inject(TranslationService);  // ← Inyectar servicio


  isLoading = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor() {
    // Intentar cargar email y code desde queryParams
    const qp = this.route.snapshot.queryParamMap;
    const email = qp.get('email');
    const code = qp.get('code');
    if (email) this.form.get('email')?.setValue(email);
    if (code) this.form.get('code')?.setValue(code);
  }

  newPassword() { return this.form.get('newPassword'); }
  confirmPassword() { return this.form.get('confirmPassword'); }
  email() { return this.form.get('email'); }
  code() { return this.form.get('code'); }

  passwordsMatch(): boolean {
    return this.newPassword()?.value === this.confirmPassword()?.value;
  }

  async onSubmit() {
    if (this.form.invalid || !this.passwordsMatch()) {
      const toast = await this.toastController.create({
        message: !this.passwordsMatch() ? 'Las contraseñas no coinciden' : 'Completa correctamente el formulario',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.isLoading.set(true);

    const payload = {
      email: this.email()?.value || '',
      code: this.code()?.value || '',
      newPassword: this.newPassword()?.value || ''
    };

    this.authService.resetPassword(payload).subscribe({
      next: async () => {
        this.isLoading.set(false);
        const toast = await this.toastController.create({
          message: 'Contraseña restablecida correctamente. Inicia sesión con tu nueva contraseña.',
          duration: 3500,
          color: 'success'
        });
        await toast.present();
        await this.router.navigate(['/auth/login']);
      },
      error: async (err) => {
        this.isLoading.set(false);
        const message = err?.error?.message || 'Error al restablecer la contraseña';
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
