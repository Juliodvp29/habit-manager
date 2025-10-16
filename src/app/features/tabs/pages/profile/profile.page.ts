import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  IonAvatar,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkOutline,
  chevronForwardOutline,
  closeOutline,
  imagesOutline,
  keyOutline,
  languageOutline,
  logOutOutline,
  mailOutline,
  moonOutline,
  notificationsOutline,
  pencilOutline,
  personOutline,
  shieldCheckmarkOutline,
  timeOutline,
  trashOutline
} from 'ionicons/icons';
import { User, UserSettings } from 'src/app/core/models/user.model';
import { AuthService } from 'src/app/core/services/auth-service';
import { FcmNotificationService } from 'src/app/core/services/fcm-notification-service';
import { ThemeService } from 'src/app/core/services/theme-service';
import { TranslationService } from 'src/app/core/services/translation-service';
import { UserService } from 'src/app/core/services/user-service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonInput,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonAvatar,
    IonSpinner,
    TranslateModule]
})
export class ProfilePage implements OnInit {

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private themeService = inject(ThemeService);
  private translationService = inject(TranslationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private actionSheetController = inject(ActionSheetController);

  // Signals
  user = signal<User | null>(null);
  settings = signal<UserSettings | null>(null);
  isLoading = signal(false);
  isEditingProfile = signal(false);
  isSavingProfile = signal(false);
  isSavingSettings = signal(false);

  // Forms
  profileForm: FormGroup;

  // Computed
  isDarkMode = computed(() => this.themeService.isDarkMode());
  currentLanguage = computed(() => this.translationService.currentLanguage());
  availableLanguages = this.translationService.availableLanguages;

  constructor() {
    addIcons({
      personOutline,
      mailOutline,
      keyOutline,
      moonOutline,
      languageOutline,
      notificationsOutline,
      timeOutline,
      logOutOutline,
      trashOutline,
      cameraOutline,
      checkmarkOutline,
      closeOutline,
      pencilOutline,
      shieldCheckmarkOutline,
      chevronForwardOutline,
      imagesOutline
    });

    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading.set(true);
    this.userService.getProfile().subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.settings.set(userData.settings || null);

        // Actualizar formulario
        this.profileForm.patchValue({
          fullName: userData.fullName,
          email: userData.email
        });

        // Sincronizar tema e idioma
        if (userData.settings) {
          this.themeService.setTheme(userData.settings.theme === 'dark');
        }
        if (userData.preferredLanguage?.code) {
          this.translationService.syncWithUserPreference(userData.preferredLanguage.code);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error loading profile:', error);
        this.showToast(
          this.translationService.translate('COMMON.ERROR'),
          'danger'
        );
      }
    });
  }

  toggleEditProfile() {
    this.isEditingProfile.update(v => !v);
    if (!this.isEditingProfile()) {
      // Restaurar valores originales si se cancela
      const currentUser = this.user();
      if (currentUser) {
        this.profileForm.patchValue({
          fullName: currentUser.fullName
        });
      }
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.showToast(
        this.translationService.translate('AUTH.VALIDATION.COMPLETE_FORM'),
        'warning'
      );
      return;
    }

    this.isSavingProfile.set(true);

    const updateData = {
      fullName: this.profileForm.value.fullName
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.isEditingProfile.set(false);
        this.isSavingProfile.set(false);
        this.showToast(
          this.translationService.translate('COMMON.SUCCESS'),
          'success'
        );
      },
      error: (error) => {
        this.isSavingProfile.set(false);
        console.error('Error updating profile:', error);
        this.showToast(
          this.translationService.translate('COMMON.ERROR'),
          'danger'
        );
      }
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.updateSettings({ theme: this.isDarkMode() ? 'dark' : 'light' });
  }

  changeLanguage(event: any) {
    const newLang = event.detail.value;
    this.translationService.setLanguage(newLang);
    this.showToast(
      this.translationService.translate('PROFILE.LANGUAGE_CHANGED'),
      'success'
    );
  }

  toggleNotifications(event: any) {
    const enabled = event.detail.checked;
    this.updateSettings({ notificationEnabled: enabled });
  }

  changeReminderTime(event: any) {
    const time = event.detail.value;
    this.updateSettings({ reminderTime: time });
  }

  toggleWeeklySummary(event: any) {
    const enabled = event.detail.checked;
    this.updateSettings({ weeklySummary: enabled });
  }

  private updateSettings(updates: Partial<UserSettings>) {
    this.isSavingSettings.set(true);

    this.userService.updateSettings(updates).subscribe({
      next: (updatedSettings) => {
        this.settings.set(updatedSettings);
        this.isSavingSettings.set(false);
      },
      error: (error) => {
        this.isSavingSettings.set(false);
        console.error('Error updating settings:', error);
        this.showToast(
          this.translationService.translate('COMMON.ERROR'),
          'danger'
        );
      }
    });
  }

  async selectProfilePicture() {
    const actionSheet = await this.actionSheetController.create({
      header: this.translationService.translate('PROFILE.CHANGE_PICTURE'),
      buttons: [
        {
          text: this.translationService.translate('PROFILE.TAKE_PHOTO'),
          icon: 'camera-outline',
          handler: () => {
            this.showToast('Funcionalidad de cámara próximamente', 'warning');
          }
        },
        {
          text: this.translationService.translate('PROFILE.CHOOSE_FROM_GALLERY'),
          icon: 'images-outline',
          handler: () => {
            this.showToast('Funcionalidad de galería próximamente', 'warning');
          }
        },
        {
          text: this.translationService.translate('COMMON.CANCEL'),
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async changePassword() {
    const alert = await this.alertController.create({
      header: this.translationService.translate('PROFILE.CHANGE_PASSWORD'),
      message: this.translationService.translate('PROFILE.CHANGE_PASSWORD_MESSAGE'),
      buttons: [
        {
          text: this.translationService.translate('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translationService.translate('COMMON.OK'),
          handler: () => {
            this.router.navigate(['/auth/forgot-password']);
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: this.translationService.translate('PROFILE.LOGOUT_CONFIRM'),
      message: this.translationService.translate('PROFILE.LOGOUT_MESSAGE'),
      buttons: [
        {
          text: this.translationService.translate('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translationService.translate('PROFILE.LOGOUT'),
          role: 'destructive',
          handler: () => {
            this.logout();
          }
        }
      ]
    });
    await alert.present();
  }



  async logout() {
    const fcmService = inject(FcmNotificationService);

    // ✅ NUEVO: Desregistrar token FCM antes de logout
    if ('PushNotifications' in window) {
      (window as any).PushNotifications.getToken().then((token: any) => {
        fcmService.unregisterFcmToken(token.value).subscribe({
          next: () => {
            console.log('✅ Token FCM desregistrado');
            // Proceder con logout
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          },
          error: (err) => {
            console.error('⚠️ Error desregistrando token:', err);
            // Aún así hacer logout localmente
            this.authService.logout();
            this.router.navigate(['/auth/login']);
            this.showToast(
              this.translationService.translate('COMMON.SUCCESS'),
              'success'
            );
          }
        });
      });
    } else {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
      this.showToast(
        this.translationService.translate('COMMON.SUCCESS'),
        'success'
      );
    }
  }
  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: this.translationService.translate('PROFILE.DELETE_ACCOUNT'),
      message: this.translationService.translate('PROFILE.DELETE_ACCOUNT_WARNING'),
      inputs: [
        {
          name: 'confirmation',
          type: 'text',
          placeholder: this.translationService.translate('PROFILE.TYPE_DELETE')
        }
      ],
      buttons: [
        {
          text: this.translationService.translate('COMMON.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translationService.translate('COMMON.DELETE'),
          role: 'destructive',
          handler: (data) => {
            if (data.confirmation.toLowerCase() === 'eliminar' ||
              data.confirmation.toLowerCase() === 'delete') {
              this.deleteAccount();
              return true;
            } else {
              this.showToast(
                'Confirmación incorrecta',
                'warning'
              );
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  deleteAccount() {
    this.userService.deleteAccount().subscribe({
      next: () => {
        this.showToast(
          this.translationService.translate('COMMON.SUCCESS'),
          'success'
        );
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error deleting account:', error);
        this.showToast(
          this.translationService.translate('COMMON.ERROR'),
          'danger'
        );
      }
    });
  }

  getUserInitials(): string {
    const currentUser = this.user();
    if (!currentUser) return '?';

    const names = currentUser.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return currentUser.fullName.substring(0, 2).toUpperCase();
  }

  getJoinedDate(): string {
    const currentUser = this.user();
    if (!currentUser || !currentUser.createdAt) return '';

    const date = new Date(currentUser.createdAt);
    return date.toLocaleDateString(
      this.currentLanguage() === 'es' ? 'es-ES' : 'en-US',
      { year: 'numeric', month: 'long' }
    );
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }

}
