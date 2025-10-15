import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
import { addIcons } from 'ionicons';
import { mailOutline, refreshOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';
import { TranslationService } from 'src/app/core/services/translation-service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    ReactiveFormsModule, TranslateModule]
})
export class VerifyEmailPage implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  public translationService = inject(TranslationService);  // ← Inyectar servicio

  // Signals
  email = signal<string>('');
  isLoading = signal<boolean>(false);
  isResending = signal<boolean>(false);

  verifyForm: FormGroup;

  constructor() {
    addIcons({ mailOutline, shieldCheckmarkOutline, refreshOutline });

    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    // Obtener email del state de navegación
    const navigation = this.router.getCurrentNavigation();
    this.email.set(navigation?.extras?.state?.['email'] || '');
  }

  ngOnInit() {
    if (!this.email()) {
      this.router.navigate(['/auth/login']);
    }
  }

  async onSubmit() {
    if (this.verifyForm.invalid || !this.email()) {
      this.showToast('Por favor ingresa el código de 6 dígitos', 'warning');
      return;
    }

    this.isLoading.set(true);

    this.authService.verifyEmail({
      email: this.email(),
      code: this.verifyForm.value.code
    }).subscribe({
      next: async (response) => {
        this.isLoading.set(false);
        await this.showToast('Email verificado exitosamente', 'success');
        await this.router.navigate(['/auth/login']);
      },
      error: async (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'Código inválido o expirado';
        await this.showToast(message, 'danger');
      }
    });
  }

  async resendCode() {
    if (!this.email()) return;

    this.isResending.set(true);

    this.authService.resendCode(this.email()).subscribe({
      next: async () => {
        this.isResending.set(false);
        await this.showToast('Código reenviado a tu correo', 'success');
      },
      error: async (error) => {
        this.isResending.set(false);
        const message = error.error?.message || 'Error al reenviar código';
        await this.showToast(message, 'danger');
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

}
