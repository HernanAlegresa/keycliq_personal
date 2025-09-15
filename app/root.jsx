// app/root.jsx
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useMatches } from "@remix-run/react";
import tailwind from "./styles/tailwind.css?url";
import globalsCss from "./styles/globals.css?url";
import componentsCss from "./styles/components.css?url";
import pagesCss from "./styles/pages.css?url";
import welcomeCss from "./styles/welcome.css?url";
import authCss from "./styles/auth.css?url";
import settingsCss from "./styles/settings.css?url";
import { Header } from "./components/layout/Header";
import { FooterNav } from "./components/layout/FooterNav";
import { BackButton } from "./components/ui/BackButton";
import { DynamicBackButton } from "./components/ui/DynamicBackButton";

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&family=Raleway:wght@400;600;700&display=swap" },
  { rel: "stylesheet", href: tailwind },
  { rel: "stylesheet", href: globalsCss },
  { rel: "stylesheet", href: componentsCss },
  { rel: "stylesheet", href: pagesCss },
  { rel: "stylesheet", href: welcomeCss },
  { rel: "stylesheet", href: authCss },
  { rel: "stylesheet", href: settingsCss },
];

export const meta = () => ([
  { title: "KeyCliq" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
]);

export default function App() {
  const matches = useMatches();
  
  // Find if any route wants to hide footer or has custom header
  const currentMatch = matches[matches.length - 1];
  const shouldHideFooter = matches.some(match => match.handle?.hideFooter);
  const shouldHideHeader = matches.some(match => match.handle?.hideHeader);
  const headerProps = currentMatch?.handle;

  // Create leftSlot if back button is needed
  const leftSlot = headerProps?.showBackButton ? (
    headerProps.backTo === 'dynamic' ? (
      <DynamicBackButton />
    ) : (
      <BackButton 
        to={headerProps.backTo || "/"} 
        ariaLabel="Go back" 
      />
    )
  ) : null;

  return (
    <html lang="en">
      <head><Meta /><Links /></head>
      <body>
        {!shouldHideHeader && (
          <Header 
            title={headerProps?.title || "KeyCliq"}
            leftSlot={leftSlot}
            rightSlot={headerProps?.stepLabel}
          />
        )}
        
        {/* Page content */}
        <main className={shouldHideFooter ? "" : "container stack with-bottombar"}>
          <Outlet />
        </main>

        {!shouldHideFooter && <FooterNav />}

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}