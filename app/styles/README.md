# KeyCliq Style System

## CSS Architecture

### File Structure
- `globals.css` - Global variables, reset, and base styles
- `components.css` - Reusable component styles (Button, Card, Header, etc.)
- `pages.css` - Page-specific styles and layout variables
- `tailwind.css` - Tailwind CSS utilities

### Brand Colors (CSS Variables)
```css
--color-primary: #006209;        /* Primary Green */
--color-secondary: #595959;      /* Secondary Grey */
--color-white: #FFFFFF;          /* White */
--color-black: #000000;          /* Black */
--color-light-grey: #F5F5F5;     /* Light Grey (UI) */
```

### Extended Colors
```css
--color-primary-dark: #004d07;        /* Darker green for hover */
--color-primary-light: #dcfce7;       /* Light green for success */
--color-success-text: #166534;        /* Dark green for success text */
--color-error: #dc2626;               /* Red for errors */
--color-error-light: #fef2f2;         /* Light red for error backgrounds */
--color-warning: #d97706;             /* Orange for warnings */
--color-warning-light: #fef3c7;       /* Light orange for warning backgrounds */
--color-info: #1d4ed8;                /* Blue for info */
--color-info-light: #dbeafe;          /* Light blue for info backgrounds */
--color-slate-900: #1e293b;           /* Dark slate for camera placeholder */
--color-slate-400: #94a3b8;           /* Medium slate for placeholders */
--color-slate-50: #f8fafc;            /* Very light slate for backgrounds */
```

### Typography
```css
--font-heading: "Raleway", system-ui, sans-serif;
--font-body: "Open Sans", system-ui, sans-serif;
--text-h1: 24px;
--text-h2: 20px;
--text-body: 16px;
--text-caption: 12px;
```

### Spacing & Layout
```css
--radius: 12px;
--shadow-sm: 0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04);
--shadow-md: 0 6px 16px rgba(0,0,0,.08);
```

### Scan Flow Variables (Customizable)
```css
/* Scan Capture (Step 1) */
--scan-camera-height: 500px;        /* Camera placeholder height */
--scan-hint-margin-top: 30px;       /* Space above hint text */
--scan-hint-margin-bottom: 40px;    /* Space below hint text */
--scan-actions-margin-top: 60px;    /* Space above buttons */
--scan-buttons-gap: 30px;           /* Space between buttons */
--scan-actions-padding-bottom: 32px; /* Bottom padding */

/* Scan Review (Step 2) */
--review-image-height: 500px;        /* Image preview height */
--review-banner-to-image-gap: 30px;  /* Banner to image spacing */
--review-image-to-buttons-gap: 60px; /* Image to buttons spacing */
--review-actions-gap: 30px;          /* Space between buttons */
```

### Utility Classes
- `.scan-capture--compact-camera` - Smaller camera placeholder
- `.scan-capture--tall-camera` - Larger camera placeholder
- `.scan-capture--close-hint` - Reduced hint spacing
- `.scan-capture--far-hint` - Increased hint spacing
- `.scan-capture--close-buttons` - Reduced button spacing
- `.scan-capture--far-buttons` - Increased button spacing
- `.scan-review--compact-image` - Smaller image preview
- `.scan-review--large-image` - Larger image preview
- `.scan-review--close-spacing` - Reduced overall spacing
- `.scan-review--far-spacing` - Increased overall spacing

## Usage Guidelines

1. **Always use CSS variables** instead of hardcoded colors
2. **Use utility classes** for quick spacing adjustments
3. **Maintain consistency** with the established design system
4. **Test responsive behavior** on mobile devices
5. **Ensure accessibility** with proper contrast ratios
