import Link from "next/link";

type AuthCardProps = {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  children: React.ReactNode;
};

export function AuthCard({
  title,
  subtitle,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  children,
}: AuthCardProps) {
  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center sm:min-h-[calc(100vh-3rem)]">
        <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>
          </div>

          {children}

          <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-600">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="font-medium text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
