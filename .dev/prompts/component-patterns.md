# Component Pattern Library

## Navigation Components

### Top Navigation Bar

```html
<nav
  style="
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: var(--surface);
  border-bottom: 1px solid var(--neutral-light);
"
>
  <div style="display: flex; align-items: center; gap: 32px;">
    <!-- Logo -->
    <div style="font-weight: 700; font-size: 24px; color: var(--primary);">Brand</div>
    <!-- Nav Links -->
    <div style="display: flex; gap: 24px;">
      <a href="#" style="color: var(--neutral); text-decoration: none;">Features</a>
      <a href="#" style="color: var(--neutral); text-decoration: none;">Pricing</a>
      <a href="#" style="color: var(--neutral); text-decoration: none;">About</a>
    </div>
  </div>
  <!-- Actions -->
  <div style="display: flex; gap: 16px; align-items: center;">
    <button>Sign In</button>
    <button style="background: var(--primary); color: white;">Get Started</button>
  </div>
</nav>
```

### Sidebar Navigation

```html
<aside
  style="
  width: 260px;
  height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--neutral-light);
  padding: 24px 16px;
"
>
  <nav style="display: flex; flex-direction: column; gap: 8px;">
    <a
      href="#"
      style="
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--border-radius);
      background: var(--primary-light);
      color: var(--primary);
      text-decoration: none;
    "
    >
      <span>Dashboard</span>
    </a>
    <!-- More items -->
  </nav>
</aside>
```

## Form Components

### Input Group

```html
<div style="margin-bottom: 24px;">
  <label
    style="
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--neutral-dark);
  "
  >
    Label Text
  </label>
  <input
    type="text"
    style="
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--neutral-light);
    border-radius: var(--border-radius);
    font-size: 16px;
    transition: all 0.2s;
  "
    placeholder="Placeholder text"
  />
  <span
    style="
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: var(--neutral);
  "
  >
    Helper text goes here
  </span>
</div>
```

### Select Dropdown

```html
<select
  style="
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--neutral-light);
  border-radius: var(--border-radius);
  background: white;
  font-size: 16px;
  cursor: pointer;
"
>
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</select>
```

### Checkbox/Radio

```html
<label
  style="
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
"
>
  <input
    type="checkbox"
    style="
    width: 20px;
    height: 20px;
    accent-color: var(--primary);
  "
  />
  <span>Checkbox label</span>
</label>
```

### Toggle Switch

```html
<label
  style="
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
"
>
  <input type="checkbox" style="opacity: 0; width: 0; height: 0;" />
  <span
    style="
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background: var(--neutral-light);
    border-radius: 24px;
    transition: 0.3s;
  "
  >
    <span
      style="
      position: absolute;
      content: '';
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    "
    ></span>
  </span>
</label>
```

## Card Components

### Basic Card

```html
<div
  style="
  background: var(--surface);
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
"
>
  <h3 style="margin: 0 0 12px 0;">Card Title</h3>
  <p style="margin: 0; color: var(--neutral);">Card content goes here</p>
</div>
```

### Stats Card

```html
<div
  style="
  background: var(--surface);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
"
>
  <div
    style="
    font-size: 14px;
    color: var(--neutral);
    margin-bottom: 8px;
  "
  >
    Metric Label
  </div>
  <div
    style="
    font-size: 32px;
    font-weight: 700;
    color: var(--neutral-dark);
    margin-bottom: 4px;
  "
  >
    1,234
  </div>
  <div
    style="
    font-size: 12px;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 4px;
  "
  >
    <span>↑</span>
    <span>12% from last month</span>
  </div>
</div>
```

### Pricing Card

```html
<div
  style="
  background: var(--surface);
  border: 2px solid var(--neutral-light);
  border-radius: var(--border-radius);
  padding: 32px;
  text-align: center;
  position: relative;
"
>
  <!-- Popular Badge -->
  <div
    style="
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
    color: white;
    padding: 4px 16px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  "
  >
    POPULAR
  </div>

  <h3 style="margin: 0 0 8px 0;">Plan Name</h3>
  <div
    style="
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin-bottom: 24px;
  "
  >
    <span style="font-size: 48px; font-weight: 700;">$29</span>
    <span style="color: var(--neutral); margin-left: 8px;">/month</span>
  </div>

  <ul
    style="
    list-style: none;
    padding: 0;
    margin: 0 0 24px 0;
    text-align: left;
  "
  >
    <li style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <svg><!-- checkmark --></svg>
      <span>Feature description</span>
    </li>
  </ul>

  <button
    style="
    width: 100%;
    padding: 12px 24px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
  "
  >
    Get Started
  </button>
</div>
```

## Table Components

### Data Table

```html
<table
  style="
  width: 100%;
  background: var(--surface);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
"
>
  <thead>
    <tr style="background: var(--neutral-lightest);">
      <th
        style="
        text-align: left;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 600;
        color: var(--neutral);
        text-transform: uppercase;
      "
      >
        Column 1
      </th>
      <!-- More columns -->
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid var(--neutral-light);">
      <td style="padding: 16px;">Data</td>
    </tr>
  </tbody>
</table>
```

## Modal/Dialog

### Basic Modal

```html
<div
  style="
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
"
>
  <div
    style="
    background: var(--surface);
    border-radius: var(--border-radius-lg);
    padding: 32px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 25px rgba(0,0,0,0.15);
  "
  >
    <h2 style="margin: 0 0 16px 0;">Modal Title</h2>
    <p style="margin: 0 0 24px 0; color: var(--neutral);">Modal content goes here</p>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button style="...">Cancel</button>
      <button style="background: var(--primary); color: white; ...">Confirm</button>
    </div>
  </div>
</div>
```

## Badge/Tag Components

### Status Badge

```html
<span
  style="
  display: inline-block;
  padding: 4px 12px;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
"
>
  Active
</span>
```

### Notification Badge

```html
<div style="position: relative; display: inline-block;">
  <button>Notifications</button>
  <span
    style="
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--error);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
  "
  >
    3
  </span>
</div>
```

## Loading States

### Spinner

```html
<div
  style="
  width: 40px;
  height: 40px;
  border: 4px solid var(--neutral-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
"
></div>

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
```

### Skeleton Loading

```html
<div
  style="
  background: linear-gradient(
    90deg,
    var(--neutral-lightest) 25%,
    var(--neutral-light) 50%,
    var(--neutral-lightest) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  height: 20px;
  border-radius: 4px;
"
></div>

<style>
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
```

## Alert/Toast Components

### Alert Box

```html
<div
  style="
  padding: 16px;
  background: var(--info-light);
  border-left: 4px solid var(--info);
  border-radius: var(--border-radius);
  display: flex;
  gap: 12px;
"
>
  <svg><!-- info icon --></svg>
  <div>
    <div style="font-weight: 600; margin-bottom: 4px;">Information</div>
    <div style="font-size: 14px; color: var(--neutral);">This is an informational message</div>
  </div>
</div>
```

### Toast Notification

```html
<div
  style="
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--neutral-dark);
  color: white;
  padding: 16px 24px;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
"
>
  <svg><!-- check icon --></svg>
  <span>Action completed successfully</span>
</div>

<style>
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
```

## Usage Guidelines

1. **Consistency**: Use the same component patterns throughout the application
2. **Accessibility**: Always include proper ARIA labels and keyboard navigation
3. **Responsiveness**: Ensure components work on all screen sizes
4. **States**: Include hover, focus, active, and disabled states
5. **Animations**: Keep them subtle and respect prefers-reduced-motion
6. **Color Usage**: Follow the design system color hierarchy
7. **Spacing**: Use consistent spacing from the design system scale

Remember: These are patterns to follow, not rigid templates. Adapt them to fit the specific design requirements while maintaining consistency.
