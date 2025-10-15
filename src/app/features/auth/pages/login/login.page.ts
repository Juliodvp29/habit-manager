import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkDoneOutline,
  eyeOffOutline,
  eyeOutline,
  languageOutline,
  lockClosedOutline,
  mailOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';
import { StorageService } from 'src/app/core/services/storage-service';
import { TranslationService } from 'src/app/core/services/translation-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonIcon,
    IonButton,
    TranslateModule,
  ],
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  public translationService = inject(TranslationService);

  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  loginForm: FormGroup;

  constructor() {
    addIcons({
      checkmarkDoneOutline,
      languageOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir a dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tabs']);
    }
  }

  togglePassword() {
    this.showPassword.update((value) => !value);
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.showToast(
        this.translationService.translate('AUTH.VALIDATION.COMPLETE_FORM'),
        'warning',
      );
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: async (response) => {
        // ========================================
        // CASO 1: Se requiere 2FA
        // ========================================
        if (response.requires2FA) {
          console.log('🔐 2FA requerido');
          await this.router.navigate(['/auth/verify-2fa'], {
            state: {
              userId: response.userId,
              email: response.email,
            },
          });
        }
        // ========================================
        // CASO 2: Login exitoso con tokens
        // ========================================
        else if (response.accessToken && response.user) {
          console.log('✅ Login exitoso, guardando tokens...');

          // Guardar AMBOS tokens
          this.storageService.saveToken(response.accessToken);
          if (response.refreshToken) {
            this.storageService.saveRefreshToken(response.refreshToken);
          }
          this.storageService.saveUser(response.user);

          // Sincronizar idioma si es necesario
          if (response.user.preferredLanguage?.code) {
            this.translationService.syncWithUserPreference(
              response.user.preferredLanguage.code,
            );
          }

          await this.showToast(
            this.translationService.translate('AUTH.LOGIN.SUCCESS'),
            'success',
          );

          this.isLoading.set(false);
          await this.router.navigate(['/tabs']);
        }
        // ========================================
        // CASO 3: Formato antiguo (por compatibilidad)
        // ========================================
        else if (response.token && response.user) {
          console.warn('⚠️ Usando formato antiguo de token');

          this.storageService.saveToken(response.token);
          this.storageService.saveUser(response.user);

          if (response.user.preferredLanguage?.code) {
            this.translationService.syncWithUserPreference(
              response.user.preferredLanguage.code,
            );
          }

          await this.showToast(
            this.translationService.translate('AUTH.LOGIN.SUCCESS'),
            'success',
          );

          this.isLoading.set(false);
          await this.router.navigate(['/tabs']);
        } else {
          console.error('❌ Respuesta de login inesperada:', response);
          this.isLoading.set(false);
          await this.showToast(
            'Respuesta inesperada del servidor',
            'danger',
          );
        }
      },
      error: async (error) => {
        this.isLoading.set(false);
        const message =
          error.error?.message ||
          this.translationService.translate('AUTH.LOGIN.ERROR');
        await this.showToast(message, 'danger');
      },
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}