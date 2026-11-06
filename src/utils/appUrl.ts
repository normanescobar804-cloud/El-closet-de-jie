/**
 * URLs oficiales del entorno de El Clóset de Jié
 */
export const OFFICIAL_APP_URLS = {
  // URL pública de producción para clientes, redes sociales y Google Play Store (PWABuilder)
  publicUrl: 'https://ais-pre-mxlpvoegxypwao4mnzr336-798504950706.us-east1.run.app',
  // URL de desarrollo en tiempo real
  devUrl: 'https://ais-dev-mxlpvoegxypwao4mnzr336-798504950706.us-east1.run.app',
  // Repositorio de GitHub
  githubRepoUrl: 'https://github.com/normanescobar804-cloud/El-closet-de-jie.git',
  // URL pública en vivo en GitHub Pages
  githubPagesUrl: 'https://normanescobar804-cloud.github.io/El-closet-de-jie/',
  // ID de la aplicación para Google Play Store
  packageId: 'com.elclosetdejie.twa',
};

/**
 * Obtiene la URL en vivo más adecuada según el entorno actual
 */
export function getLiveAppUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Si estamos en un dominio en vivo en la nube (no localhost)
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }
  return OFFICIAL_APP_URLS.publicUrl;
}
