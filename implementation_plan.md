# Implementation Plan - Math Mastery Modes & Reporting

The goal is to enhance the existing Math Mastery application by introducing two distinct modes per operation: **Latihan (Training)** and **Ujian (Exam)**, along with expanded history and a new Report Card (Raport) feature.

## User Review Required
> [!IMPORTANT]
> **Exam Mode Constraints**: Exam mode will strictly have 50 questions with a 7-second limit per question. Failing to answer within 7 seconds constitutes an incorrect answer (or automatic skip to next, practically incorrect).

> [!NOTE]
> **Data Storage**: Previous history data structure is simple. We will add a `type` field ('practice' vs 'exam') to new records. Old records will be treated as 'practice' by default to maintain backward compatibility.

## Proposed Changes

### UI Components (`index.html`)

#### [MODIFY] [index.html](file:///d:/Guru/antigravity/index.html)
- **Mode Selection Modal**: A new modal/popup that appears after selecting a main Operation (e.g., Perkalian). It will offer:
    - Button: "Latihan" (Default behavior)
    - Button: "Ujian" (New mode)
    - Button: "Lihat Raport" (View Report Card for this operation)
- **Game Screen**:
    - Add **Countdown Bar/Timer** for the 7s limit (visible only in Exam mode).
    - Add **"Hentikan Ujian" (Stop Exam)** button (visible only in Exam mode).
- **Report Card Modal**: A new section/modal to display the "Raport" (Last 3 Exam results).
    - **Design**: Elegant, certificate-like or official card look, suitable for screenshots.
    - **Content**:
        - Student Name & Class.
        - Exam Description (e.g., "Ujian Perkalian").
        - List of recent Exam Results (Score, Date).
        - **Average Score** of these exams.
        - **Grade/Description** based on average.
        - **Motivational Quote**.
- **History Section**: Update to show up to 10 items.

### Styles (`style.css`)

#### [MODIFY] [style.css](file:///d:/Guru/antigravity/style.css)
- Styles for the new Mode Selection Modal.
- Styles for the Countdown Timer (progress bar or circular).
- Styles for the "Stop Exam" button (likely distinct, e.g., red/warning color).

### Logic (`script.js`)

#### [MODIFY] [script.js](file:///d:/Guru/antigravity/script.js)
1. **State Management**:
    - Update `state.game` to include `subMode` ('practice', 'exam').
    - Update `GAME_CONFIG` to support variable settings (questions count, timer).
2. **Navigation**:
    - `startGame(operation)` will now trigger the *Mode Selection Modal* instead of starting immediately.
    - New function `confirmStart(subMode)` to actually begin the game.
3. **Game Loop**:
    - `initGame()`: Handling 50 questions for Exam, 10 for Practice.
    - **Timer Logic**:
        - Implement `questionTimer` for Exam mode (7s countdown).
        - If timer runs out -> `handleTimeout()` -> treat as wrong/next.
    - **Stop Exam**: `stopGame()` function that aborts without saving.
4. **Data & Persistence**:
    - `endGame()`: Save result with `type` ('practice'/'exam').
    - `saveResult()`: Increase history limit from 5 to 10.
    - `getRaportData(operation)`: Filter history for `type === 'exam'` and specific operation, take last 3.
5. **Reporting**:
    - `renderHistory()`: Show 10 items. Show duration.
    - `renderRaport()`: Display the report card data.

## Verification Plan

### Manual Verification
1. **Flow Test**:
    - Click "Perkalian" -> Verify Mode Selection Modal appears.
    - Click "Latihan" -> Verify game starts with 10 questions, no 7s timer.
    - Complete Latihan -> Verify result saved to History.
2. **Exam Mode Test**:
    - Click "Perkalian" -> "Ujian".
    - Verify 50 questions total.
    - Verify 7s countdown per question.
    - Wait for 7s on a question -> Verify it marks incorrect/moves to next.
    - Click "Hentikan Ujian" -> Verify returns to menu, NO result saved.
    - Complete Exam -> Verify result saved to History AND Raport.
3. **Raport Test**:
    - Go to "Perkalian" -> "Lihat Raport".
    - Verify it shows the last 3 *Exam* results for Perkalian.
4. **History Test**:
    - Verify "Riwayat" shows up to 10 items.
    - Verify duration is displayed.
