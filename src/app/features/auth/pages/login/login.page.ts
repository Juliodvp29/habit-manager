import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkDoneOutline, eyeOffOutline, eyeOutline, languageOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';
import { TranslationService } from 'src/app/core/services/translation-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonSpinner,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonIcon,
    IonButton,
    TranslateModule
  ],
})
export class LoginPage implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  public translationService = inject(TranslationService);

  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  loginForm: FormGroup;

  constructor() {
    addIcons({ checkmarkDoneOutline, languageOutline, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    return;
  }

  togglePassword() {
    this.showPassword.update(value => !value);
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.showToast(
        this.translationService.translate('AUTH.VALIDATION.COMPLETE_FORM'),
        'warning'
      );
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: async (response) => {
        if (response.requires2FA) {
          await this.router.navigate(['/auth/verify-2fa'], {
            state: {
              userId: response.userId,
              email: response.email
            }
          });
        } else if (response.token && response.user) {
          if (response.user.preferredLanguage?.code) {
            this.translationService.syncWithUserPreference(response.user.preferredLanguage.code);
          }

          await this.showToast(
            this.translationService.translate('AUTH.LOGIN.SUCCESS'),
            'success'
          );
          await this.router.navigate(['/tabs']);
        }
        this.isLoading.set(false);
      },
      error: async (error) => {
        this.isLoading.set(false);
        const message = error.error?.message ||
          this.translationService.translate('AUTH.LOGIN.ERROR');
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
