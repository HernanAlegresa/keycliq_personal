// app/root.jsx
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useMatches } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import tailwind from "./styles/tailwind.css?url";
import globalsCss from "./styles/globals.css?url";
import componentsCss from "./styles/components.css?url";
import pagesCss from "./styles/pages.css?url";
import welcomeCss from "./styles/welcome.css?url";
import authCss from "./styles/auth.css?url";
import settingsCss from "./styles/settings.css?url";
import scanGuidelinesCss from "./styles/scan-guidelines.css?url";
import legalCss from "./styles/legal.css?url";
import { Header } from "./components/layout/Header";
import { FooterNav } from "./components/layout/FooterNav";
import { BackButton } from "./components/ui/BackButton";
import { DynamicBackButton } from "./components/ui/DynamicBackButton";
import { HeaderProvider, useHeader } from "./contexts/HeaderContext";

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
  { rel: "stylesheet", href: scanGuidelinesCss },
  { rel: "stylesheet", href: legalCss },
];

export const meta = () => ([
  { title: "KeyCliq" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
]);

// Prevent HTML caching to ensure users always get the latest version
export const headers = () => {
  return {
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
  };
};

// Force HTTPS redirect in production (Heroku handles SSL termination)
// Heroku sets X-Forwarded-Proto header, so we check that instead of the direct connection
export async function loader({ request }) {
  const url = new URL(request.url);
  
  // In production, check X-Forwarded-Proto header (Heroku proxy)
  // In development, check the actual protocol
  const protocol = 
    process.env.NODE_ENV === "production"
      ? request.headers.get("X-Forwarded-Proto") || url.protocol.slice(0, -1)
      : url.protocol.slice(0, -1);
  
  // Redirect HTTP to HTTPS in production
  if (process.env.NODE_ENV === "production" && protocol === "http") {
    url.protocol = "https:";
    return redirect(url.toString(), 301);
  }
  
  return null;
}

function AppContent() {
  const matches = useMatches();
  const { rightSlot: dynamicRightSlot } = useHeader();
  
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

  // Use dynamic rightSlot if available, otherwise use stepLabel from handle
  const rightSlot = dynamicRightSlot || headerProps?.stepLabel;

  return (
    <>
      {!shouldHideHeader && (
        <Header 
          title={headerProps?.title || "KeyCliq"}
          leftSlot={leftSlot}
          rightSlot={rightSlot}
        />
      )}
      
      {/* Page content */}
      <main className={shouldHideFooter ? "" : "container stack with-bottombar"}>
        <Outlet />
      </main>

      {!shouldHideFooter && <FooterNav />}
    </>
  );
}

export default function App() {
  return (
    <html lang="en">
      <head><Meta /><Links /></head>
      <body>
        <HeaderProvider>
          <AppContent />
        </HeaderProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}