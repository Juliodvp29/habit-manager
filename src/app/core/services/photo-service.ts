import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from 'src/app/config/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {


  constructor() { }

  /**
   * Tomar foto con la cámara
   */
  async takePhoto(): Promise<string | null> {
    try {
      // Verificar permisos primero
      const permissions = await Camera.checkPermissions();

      if (permissions.camera === 'denied') {
        console.warn('⚠️ Permisos de cámara denegados');
        // Intentar solicitar permisos
        const request = await Camera.requestPermissions({ permissions: ['camera'] });
        if (request.camera === 'denied') {
          throw new Error('Camera permission denied');
        }
      }

      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 500,
        height: 500,
        saveToGallery: false,
        correctOrientation: true
      });

      if (!image.base64String) {
        throw new Error('No se pudo obtener la imagen');
      }

      console.log('✅ Foto capturada exitosamente');
      return image.base64String;
    } catch (error: any) {
      console.error('❌ Error tomando foto:', error);

      // Si el usuario canceló, no mostrar error
      if (error.message?.includes('cancelled') || error.message?.includes('User cancelled')) {
        console.log('👤 Usuario canceló la captura de foto');
        return null;
      }

      throw error;
    }
  }

  /**
   * Seleccionar foto de la galería
   */
  async selectFromGallery(): Promise<string | null> {
    try {
      // Verificar permisos primero
      const permissions = await Camera.checkPermissions();

      if (permissions.photos === 'denied') {
        console.warn('⚠️ Permisos de galería denegados');
        // Intentar solicitar permisos
        const request = await Camera.requestPermissions({ permissions: ['photos'] });
        if (request.photos === 'denied') {
          throw new Error('Photos permission denied');
        }
      }

      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: 500,
        height: 500,
        correctOrientation: true
      });

      if (!image.base64String) {
        throw new Error('No se pudo obtener la imagen');
      }

      console.log('✅ Foto seleccionada exitosamente');
      return image.base64String;
    } catch (error: any) {
      console.error('❌ Error seleccionando foto:', error);

      // Si el usuario canceló, no mostrar error
      if (error.message?.includes('cancelled') || error.message?.includes('User cancelled')) {
        console.log('👤 Usuario canceló la selección de foto');
        return null;
      }

      throw error;
    }
  }

  /**
   * Subir foto a Firebase Storage
   * @param base64Image - Imagen en formato base64
   * @param userId - ID del usuario
   * @returns URL pública de la imagen
   */
  async uploadProfilePhoto(base64Image: string, userId: number): Promise<string> {
    try {
      // Convertir base64 a Blob
      const blob = this.base64ToBlob(base64Image, 'image/jpeg');

      // Crear referencia única en Firebase Storage
      const fileName = `profile-photos/${userId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);

      // Subir archivo
      console.log('📤 Subiendo foto a Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('✅ Foto subida exitosamente');

      // Obtener URL pública
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 URL de descarga:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('❌ Error subiendo foto:', error);
      throw new Error('Error al subir la foto');
    }
  }

  /**
   * Eliminar foto anterior de Firebase Storage
   * @param photoUrl - URL de la foto a eliminar
   */
  async deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
      if (!photoUrl || !photoUrl.includes('firebase')) {
        console.log('No hay foto anterior de Firebase para eliminar');
        return;
      }

      // Extraer path de la URL
      const path = this.extractPathFromUrl(photoUrl);
      if (!path) {
        console.warn('No se pudo extraer el path de la URL');
        return;
      }

      const photoRef = ref(storage, path);
      await deleteObject(photoRef);
      console.log('🗑️ Foto anterior eliminada de Firebase');
    } catch (error) {
      console.error('⚠️ Error eliminando foto anterior:', error);
      // No lanzar error, ya que la foto nueva ya se subió
    }
  }

  /**
   * Convertir base64 a Blob
   */
  private base64ToBlob(base64: string, contentType: string = ''): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * Extraer path de una URL de Firebase Storage
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch (error) {
      console.error('Error extrayendo path:', error);
      return null;
    }
  }

}
