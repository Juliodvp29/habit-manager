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
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { keyOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';

@Component({
  selector: 'app-verify2-fa',
  templateUrl: './verify2-fa.page.html',
  styleUrls: ['./verify2-fa.page.scss'],
  standalone: true,
  imports: [IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    ReactiveFormsModule]
})
export class Verify2FaPage implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  // Signals
  userId = signal<number>(0);
  email = signal<string>('');
  isLoading = signal<boolean>(false);

  verifyForm: FormGroup;

  constructor() {
    addIcons({ keyOutline, shieldCheckmarkOutline });

    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    // Obtener datos del state de navegación
    const navigation = this.router.getCurrentNavigation();
    this.userId.set(navigation?.extras?.state?.['userId'] || 0);
    this.email.set(navigation?.extras?.state?.['email'] || '');
  }

  ngOnInit() {
    if (!this.userId() || !this.email()) {
      this.router.navigate(['/auth/login']);
    }
  }

  async onSubmit() {
    if (this.verifyForm.invalid || !this.userId()) {
      this.showToast('Por favor ingresa el código de 6 dígitos', 'warning');
      return;
    }

    this.isLoading.set(true);

    this.authService.verify2FA({
      userId: this.userId(),
      code: this.verifyForm.value.code
    }).subscribe({
      next: async (response) => {
        this.isLoading.set(false);
        await this.showToast('Autenticación exitosa', 'success');
        await this.router.navigate(['/tabs']);
      },
      error: async (error) => {
        this.isLoading.set(false);
        const message = error.error?.message || 'Código inválido o expirado';
        await this.showToast(message, 'danger');
      }
    });
  }

  async goBack() {
    await this.router.navigate(['/auth/login']);
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
