# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite)
npm run build      # production build
npm run lint       # ESLint
npx tsc --noEmit   # type-check only
```

No test suite exists. There is no test runner configured.

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS. No router library — routing is manual hash-based (`#/strict`, `#/aerobico`, `#/autoplay`) via a `useHashRoute()` hook in `App.tsx`.

**State flow:** `App.tsx` is the single state owner. It holds aerobic workout state and execution flags. Editor components own their own exercise lists internally, reporting changes upward via callbacks/refs. When "Treinar" is clicked, exercises are lifted to App and an execution page replaces the editor.

### Workout modes

Three independent modes, each with its own editor and execution path:

| Mode | Editor | Execution |
|------|--------|-----------|
| Strict (weight/reps) | `WorkoutEditor` → `StrictWorkout` | `StrictTrainingPage` |
| Autoplay (timed) | `WorkoutEditor` (with `defaultExerciseType="duration"`) → `StrictWorkout` | `StrictTrainingPage` |
| Aerobic | `AerobicEditor` → `AerobicWorkout` | `AerobicExecutionPage` |

> `AutoplayEditor` + `AutoplayWorkout` exist but are **not wired into App.tsx**. They are unused dead code.

### Exercise library bridge

`ExerciseLibrary` (right sidebar) calls exercises from `src/services/nexurApi.ts` (`fetchExercises()`). To pass a selected exercise into the editor, App uses refs (`addExerciseFnRef`, `autoplayAddFnRef`) that point to a function registered by `StrictWorkout` via `onRegisterAdd`.

### Key types (`src/types/`)

- `workout.ts` — `ExerciseType`, `Exercise`, `StrictExercise`, `FlexExercise`
- `autoplay.ts` — `AutoplayItem`, `AutoplayBlock`
- `aerobic.ts` — `AerobicWorkout`, `WorkoutBlock`, `BlockStep`
- `media.ts` — `Media`, `MediaType`, `MediaStatus`, `MediaOrientation`, `getMediaPreviewUrl()`

Exercises carry `media1: Media | null` and `media2: Media | null` (not `thumbnail`).

### Persistence

`src/hooks/useLocalStorage.ts` — generic hook used to persist workout state across reloads:
- `nexur-strict-exercises` — StrictWorkout exercises
- `nexur-autoplay-exercises` — Autoplay exercises
- `nexur-aerobic-workout` — Aerobic workout object

### Known pre-existing TS errors (ignore)

- Unused variables in `AerobicWorkout.tsx`, `CardioWorkout.tsx`, `WorkoutHeader.tsx`, `index.tsx`
- Missing `onAddRestAfter` prop in `StrictWorkout.tsx` ~line 471

### Reference project

The real production frontend is at `/Users/robertojunior/Documents/nexur/nexur-front`. Use it as reference for data shapes and API contracts when in doubt.
