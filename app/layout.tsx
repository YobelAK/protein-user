import { ColorSchemeScript } from '@mantine/core';
export const metadata = {
  title: "Best Trip Guide",
  description: "User-facing app for booking fastboat/speedboat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Providers = require('./providers').Providers;
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
