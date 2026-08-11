# CLAUDE.md

Guidelines for writing frontend code in this Next.js app.

## Project stack

- **Next.js** (App Router)
- **React**
- **Tailwind CSS**
- **shadcn/ui**
- **motion** (for animations)

## Golden rule

**Do not install or import any other library.** If something can't be built with the
stack above, write it by hand with plain React. Never suggest `npm install`.

If a task seems to need a missing library, say so and propose a simple alternative
instead of adding a dependency.

---

## 1. Write the easiest code possible

Code should be readable by a beginner. Boring code is good code.

- Prefer simple `if` statements over clever ternaries or `&&` chains.
- One component does one thing. If a file grows past ~150 lines, split it.
- Avoid advanced patterns: no render props, no HOCs, no custom hook factories,
  no `useReducer` when `useState` works, no `useMemo`/`useCallback` unless there's a
  real, visible performance problem.
- Use plain `.map()` and `.filter()`. Skip `reduce` when a `for` loop is clearer.
- Keep nesting shallow. Return early instead of wrapping everything in `else`.

```jsx
// Good — easy to follow
function UserBadge({ user }) {
  if (!user) {
    return <p>No user found</p>;
  }

  return <span className="rounded bg-blue-100 px-2 py-1">{user.name}</span>;
}

// Avoid — clever, but harder to read
const UserBadge = ({ user }) =>
  user ? <span className="...">{user.name}</span> : <p>No user found</p>;
```

## 2. Clear variable and function names

Names should say what the thing is or does, with no guessing.

- Booleans start with `is`, `has`, or `can`: `isLoading`, `hasError`, `canSubmit`.
- Event handlers start with `handle`: `handleSubmit`, `handleDeleteClick`.
- Props that pass a function start with `on`: `onSelect`, `onClose`.
- Lists are plural: `products`, not `productList` or `data`.
- No abbreviations: write `selectedProduct`, not `selProd` or `sp`.
- Components are `PascalCase`, everything else is `camelCase`.

```jsx
// Good
const isCheckoutDisabled = cartItems.length === 0;
function handleAddToCart(product) { ... }

// Avoid
const dis = arr.length === 0;
function add(p) { ... }
```

## 3. Short and clear comments

- Comment **why**, not **what**. The code already says what it does.
- One line, plain English. No comment blocks or JSDoc unless asked.
- Add a comment when logic isn't obvious at a glance: a workaround, a business
  rule, a magic number.
- Never leave commented-out code behind.

```jsx
// Good
// Stripe rejects amounts under 50 cents
if (amount < 0.5) return;

// Avoid
// set the amount variable
const amount = 0.5;
```

## 4. Only use installed libraries

| Need | Use |
| --- | --- |
| UI components | shadcn/ui (`@/components/ui/...`) |
| Styling | Tailwind utility classes |
| Icons | `lucide-react` (ships with shadcn) |
| Animation | `motion` |
| State | React `useState` / `useContext` |
| Forms | Plain React state and a normal `<form>` |
| Dates, fetching, tables, charts | Write it by hand |

Check `components/ui/` first — if a shadcn component already exists, use it instead
of building a new one. If it's missing, mention that it needs to be added with the
shadcn CLI rather than writing a replacement from scratch.

Style with Tailwind classes directly in `className`. No CSS files, no CSS-in-JS,
no inline `style` objects (except for truly dynamic values like a computed width).

## 5. Make components easy to call

A component should be usable after reading only its name and props.

- Keep the prop count small — aim for 5 or fewer.
- Give every optional prop a default value so `<Card />` works on its own.
- Use `children` for content instead of a `content` prop.
- Prefer simple prop types: strings, numbers, booleans, arrays, and functions.
  Avoid deeply nested config objects.
- Use a `variant` string prop rather than several boolean flags.
- Always export a **named** function component at the top of the file.

```jsx
// Good — obvious at the call site
<ProductCard
  title="Blue Mug"
  price={12}
  onAddToCart={handleAddToCart}
/>

// Avoid — caller has to read the source to use it
<ProductCard config={{ data: { t: "Blue Mug", p: 12 } }} cb={fn} />
```

```jsx
// Defaults make the component safe to call with almost nothing
export function ProductCard({ title, price = 0, isSoldOut = false, onAddToCart }) {
  ...
}
```

---

## File and folder conventions

```
app/                  Routes and pages
components/           Shared components
components/ui/        shadcn components (don't edit by hand)
lib/                  Small helper functions
```

- One component per file, file named after the component: `ProductCard.jsx`.
- Import with the `@/` alias: `import { Button } from "@/components/ui/button";`
- Add `"use client"` at the top only when the file uses hooks, browser APIs, or
  event handlers. Server components are the default.

## Animation with motion

Keep animations short and subtle. Fade and small slides are usually enough.

```jsx
"use client";
import { motion } from "motion/react";

export function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

## Checklist before finishing

- [ ] Could a beginner read this without asking questions?
- [ ] Do all names explain themselves?
- [ ] Are comments short, and only where needed?
- [ ] Are all imports from React, Next.js, Tailwind, shadcn, or motion?
- [ ] Can the component be called with just a few obvious props?
