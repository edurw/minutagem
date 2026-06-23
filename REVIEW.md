---
phase: code-review
reviewed: 2026-06-23T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/hooks/useCustomScrollbar.ts
  - src/components/ScrollArea.tsx
  - src/components/UserAvatar.tsx
findings:
  critical: 1
  warning: 5
  info: 2
  total: 8
status: issues_found
---

# Code Review Report

**Reviewed:** 2026-06-23
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed 3 files: a custom scrollbar hook and two React components. Found 1 critical security issue (XSS via unsanitized photoURL), 5 warnings (logic errors, memory leaks, incorrect calculations), and 2 info-level findings. The photoURL in UserAvatar is used directly in an img src without URL scheme validation - if an attacker modifies a user's photoURL to `javascript:alert(1)`, it could execute in some contexts.

## Critical Issues

### CR-01: Unsanitized photoURL Used in img src Attribute

**File:** `src/components/UserAvatar.tsx:31,52`
**Issue:** The `photoURL` from Firebase Auth/Profile is used directly in the `src` attribute of an `<img>` tag without validating the URL scheme. A malicious actor who gains control of a user's photoURL could set it to a `javascript:` URI or other dangerous scheme, potentially causing XSS in certain contexts.

```tsx
{photoURL ? (
  <img src={photoURL} alt={displayName} className="user-avatar-img" />
```

**Fix:**
```tsx
{photoURL ? (
  <img
    src={photoURL}
    alt={displayName}
    className="user-avatar-img"
    onError={(e) => { e.currentTarget.style.display = 'none'; }}
  />
```

Additionally, validate the URL scheme before rendering:
```tsx
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}
const safePhotoURL = photoURL && isValidUrl(photoURL) ? photoURL : null
```

## Warnings

### WR-01: Division by Zero in ScrollArea Thumb Calculation

**File:** `src/components/ScrollArea.tsx:28`
**Issue:** When `el.scrollHeight - el.clientHeight` equals 0 (content fits exactly in viewport), the calculation `(el.scrollTop / (el.scrollHeight - el.clientHeight)) * maxTop` produces `Infinity` or `NaN`, causing incorrect thumb positioning.

```tsx
setThumbTop(Math.min((el.scrollTop / (el.scrollHeight - el.clientHeight)) * maxTop, maxTop))
```

**Fix:**
```tsx
const scrollable = el.scrollHeight - el.clientHeight
if (scrollable <= 0) {
  setThumbTop(0)
  return
}
setThumbTop(Math.min((el.scrollTop / scrollable) * maxTop, maxTop))
```

### WR-02: Incorrect Scroll Ratio Calculation in ScrollArea Drag Handler

**File:** `src/components/ScrollArea.tsx:61-62`
**Issue:** The drag scroll ratio is calculated as `el.scrollHeight / el.clientHeight`, which produces values greater than 1. This causes the content to scroll faster than the physical thumb movement during drag operations.

```tsx
const scrollRatio = el.scrollHeight / el.clientHeight
el.scrollTop = dragStartScroll.current + delta * scrollRatio
```

**Fix:** The ratio should represent how much the content scrolls relative to thumb movement:
```tsx
const contentScrollable = el.scrollHeight - el.clientHeight
const trackScrollable = el.clientHeight - thumbHeight // approximated
if (contentScrollable <= 0 || trackScrollable <= 0) return
const scrollRatio = contentScrollable / trackScrollable
el.scrollTop = dragStartScroll.current + delta * scrollRatio
```

### WR-03: Non-null Assertion on Potential Undefined Element

**File:** `src/hooks/useCustomScrollbar.ts:177`
**Issue:** The code uses a non-null assertion (`!`) on `querySelector` result. If the DOM structure is unexpectedly altered, this will throw a runtime error.

```tsx
const inner = el.querySelector<HTMLElement>('.custom-scrollbar-inner')!
```

**Fix:** Add a guard clause:
```tsx
const inner = el.querySelector<HTMLElement>('.custom-scrollbar-inner')
if (!inner) return
```

### WR-04: Memory Leak - Maps Not Cleared on Cleanup

**File:** `src/hooks/useCustomScrollbar.ts:146-147, 224-233`
**Issue:** The Maps `rafRef.current` and `thumbRef.current` accumulate entries across hook lifecycles but are never cleared. If the component using this hook unmounts and remounts, stale entries persist. Additionally, `styleElRef` is appended to document.head but never removed.

```tsx
rafRef.current.set(id, el)
thumbRef.current.set(id, thumb)
```

**Fix:** Clear Maps and remove injected style on cleanup:
```tsx
return () => {
  observer.disconnect()
  mo.disconnect()
  window.removeEventListener('resize', resizeAll)
  resizeObserversRef.current.forEach(observer => observer.disconnect())
  if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)

  // Clean up Maps
  rafRef.current.clear()
  thumbRef.current.clear()

  // Remove injected style
  if (styleElRef.current) {
    styleElRef.current.remove()
    styleElRef.current = null
  }
}
```

### WR-05: Variable Shadowing in Cleanup

**File:** `src/hooks/useCustomScrollbar.ts:229`
**Issue:** The cleanup function uses `observer` as a loop variable name, shadowing the MutationObserver created earlier in the useEffect. While this does not cause a bug because the MutationObserver is disconnected before the loop, it is confusing and could lead to maintenance errors.

```tsx
resizeObserversRef.current.forEach(observer => observer.disconnect())
```

**Fix:** Use a distinct variable name:
```tsx
resizeObserversRef.current.forEach((ro) => ro.disconnect())
```

## Info

### IN-01: Redundant Class Name Concatenation

**File:** `src/components/UserAvatar.tsx:47`
**Issue:** The className always includes `user-avatar-btn` twice when `showName` is true.

```tsx
className={`user-avatar-btn${showName ? ' user-avatar-btn' : ''}`}
```

**Fix:**
```tsx
className={`user-avatar-btn${showName ? ' user-avatar-btn-named' : ''}`}
```

### IN-02: Dead Commented Code

**File:** `src/components/UserAvatar.tsx:56-58`
**Issue:** There is commented-out code that appears to have been intentionally disabled. This should either be removed or implemented.

```tsx
{/* {showName && user && (
  <span className="user-avatar-topbar-name">{profile?.name || displayName}</span>
)} */}
```

---

_Reviewed: 2026-06-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_