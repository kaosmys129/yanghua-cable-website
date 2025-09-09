import { redirect } from 'next/navigation';

export default function RootRedirect() {
  // Redirect root path to the default locale homepage
  redirect('/en');
}