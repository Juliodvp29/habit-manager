import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from 'src/environments/environment';

// Inicializar Firebase usando la configuración de environment
const app = initializeApp(firebaseConfig);

// Exportar Storage
export const storage = getStorage(app);

// También exportar la app por si la necesitas en otros lugares
export const firebaseApp = app;