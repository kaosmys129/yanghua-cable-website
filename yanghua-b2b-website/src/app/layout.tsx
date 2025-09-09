import './globals.css';

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
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}