import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { MonitoringProvider } from '@/components/providers/MonitoringProvider';

export const metadata = {
  title: 'Yanghua Cable - Professional Cable Solutions',
  description: 'Leading manufacturer of flexible busbars and cable solutions for industrial applications.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <MonitoringProvider>
            {children}
          </MonitoringProvider>
        </QueryProvider>
      </body>
    </html>
  );
}