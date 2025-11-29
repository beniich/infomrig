import '../styles/globals.css';
import { isRaptorMiniEnabled } from '../lib/featureFlags';

export const metadata = {
  title: 'Gestionnaire de Rendez-vous - Style Infomaniak',
  description: 'Application professionnelle de gestion de rendez-vous avec interface moderne'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {isRaptorMiniEnabled && (
          <div className="w-full bg-primary text-black text-center py-2 text-sm font-medium">
            Mode prévisualisation activé
          </div>
        )}
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
