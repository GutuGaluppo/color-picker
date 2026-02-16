# Implementation Plan: Persistent Color Picker

## Overview

This implementation plan transforms the existing Electron color picker into a persistent background application with system tray integration. The tasks are organized to build incrementally, starting with core system tray functionality, then enhancing lifecycle management, and finally adding comprehensive testing. Each task builds on previous work and includes checkpoint validation.

## Tasks

- [x] 1. Create system tray manager module
  - Create `electron/tray.ts` file with tray creation and management functions
  - Implement `createTray()` function that creates tray icon with platform-specific icon paths
  - Implement `destroyTray()` function for cleanup
  - Implement `getTray()` function to access tray instance
  - Build context menu with "Start Capture", "Show Window", separator, and "Quit" items
  - Wire menu item clicks to placeholder handlers (to be connected in next tasks)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Add application icons for system tray
  - Create or obtain icon files for system tray (16x16 and 32x32 PNG for macOS/Linux, ICO for Windows)
  - Place icons in appropriate directory (e.g., `electron/assets/` or `resources/`)
  - Update tray creation to use correct icon path based on platform
  - _Requirements: 1.1, 7.2_

- [ ] 3. Integrate system tray into main process lifecycle
  - [ ] 3.1 Modify `electron/main.ts` to import and initialize tray manager
    - Import `createTray` and `destroyTray` from tray module
    - Call `createTray()` in `app.whenReady()` handler before creating explore window
    - Add tray cleanup in `app.on('before-quit')` handler
    - _Requirements: 1.1, 1.5_
  
  - [ ] 3.2 Connect tray menu actions to existing window functions
    - Wire "Start Capture" menu item to call `hideExploreWindow()` and `createCaptureWindow()`
    - Wire "Show Window" menu item to call `showExploreWindow()`
    - Wire "Quit" menu item to call `app.quit()`
    - _Requirements: 1.4, 1.5_

- [ ] 4. Implement persistent background operation
  - [ ] 4.1 Modify window-all-closed handler in `electron/main.ts`
    - Remove or comment out `app.quit()` call for all platforms
    - Add comment explaining app continues in background with tray
    - _Requirements: 2.1, 2.5_
  
  - [ ] 4.2 Update explore window close behavior
    - Modify `electron/windows.ts` to handle window close event
    - Change close behavior to hide window instead of destroying it
    - Update IPC handler for 'close-explore' to hide rather than close
    - _Requirements: 5.1_
  
  - [ ]* 4.3 Write property test for background operation
    - **Property 1: Window closure preserves application lifecycle**
    - **Validates: Requirements 2.1**
  
  - [ ]* 4.4 Write property test for tray persistence
    - **Property 2: Background state maintains tray icon**
    - **Validates: Requirements 2.2**

- [ ] 5. Enhance window state management
  - [ ] 5.1 Add window state tracking to `electron/windows.ts`
    - Define `WindowState` interface with visibility flags
    - Add module-level `windowState` variable
    - Update `hideExploreWindow()` to track previous state
    - Update `showExploreWindow()` to update state flags
    - _Requirements: 5.3, 5.4_
  
  - [ ] 5.2 Implement window state restoration after capture
    - Create `restoreExploreWindowState()` function
    - Call restoration function in capture completion handlers
    - Update `close-capture` IPC handler to restore state
    - Update `cancel-capture` IPC handler to restore state
    - _Requirements: 5.4_
  
  - [ ]* 5.3 Write property test for window visibility round-trip
    - **Property 13: Window visibility round-trip**
    - **Validates: Requirements 5.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Handle duplicate application launches
  - [ ] 7.1 Implement second-instance detection
    - Use Electron's `app.requestSingleInstanceLock()` API
    - Add handler for `second-instance` event
    - Show explore window when second instance is detected
    - _Requirements: 3.2_
  
  - [ ]* 7.2 Write property test for duplicate launch behavior
    - **Property 5: Duplicate launch shows window**
    - **Validates: Requirements 3.2**

- [ ] 8. Add error handling for system tray operations
  - [ ] 8.1 Add try-catch around tray creation
    - Wrap `createTray()` call in try-catch block
    - Log error and show explore window as fallback
    - Add user notification about tray unavailability
    - _Requirements: 1.1_
  
  - [ ] 8.2 Add error handling for shortcut registration
    - Check return value of `globalShortcut.register()`
    - Log warning if registration fails
    - Continue app operation without shortcut
    - _Requirements: 3.3_

- [ ] 9. Implement property tests for capture workflow
  - [ ]* 9.1 Write property test for capture mode overlay
    - **Property 6: Capture mode displays overlay**
    - **Validates: Requirements 4.1**
  
  - [ ]* 9.2 Write property test for color capture and clipboard
    - **Property 7: Color capture and clipboard**
    - **Validates: Requirements 4.2, 4.3**
  
  - [ ]* 9.3 Write property test for capture completion
    - **Property 8: Capture completion restores state**
    - **Validates: Requirements 4.4**
  
  - [ ]* 9.4 Write property test for capture cancellation
    - **Property 9: Capture cancellation restores state**
    - **Validates: Requirements 4.5**

- [ ] 10. Implement property tests for window management
  - [ ]* 10.1 Write property test for explore window close behavior
    - **Property 10: Explore window close behavior**
    - **Validates: Requirements 5.1**
  
  - [ ]* 10.2 Write property test for tray show window action
    - **Property 11: Tray show window action**
    - **Validates: Requirements 5.2**
  
  - [ ]* 10.3 Write property test for capture mode window hiding
    - **Property 12: Capture mode hides explore window**
    - **Validates: Requirements 5.3**
  
  - [ ]* 10.4 Write property test for window always on top
    - **Property 14: Explore window always on top**
    - **Validates: Requirements 5.5**

- [ ] 11. Implement property tests for background operation
  - [ ]* 11.1 Write property test for shortcut functionality in background
    - **Property 3: Background state preserves shortcut functionality**
    - **Validates: Requirements 2.3, 2.4**
  
  - [ ]* 11.2 Write property test for explicit quit requirement
    - **Property 4: Explicit quit requirement**
    - **Validates: Requirements 2.5**

- [ ] 12. Add unit tests for tray menu functionality
  - [ ]* 12.1 Write unit tests for tray creation
    - Test tray icon is created on startup
    - Test tray menu contains expected items
    - Test platform-specific icon paths
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 12.2 Write unit tests for menu actions
    - Test "Start Capture" triggers capture mode
    - Test "Show Window" displays explore window
    - Test "Quit" terminates application
    - _Requirements: 1.4, 1.5_

- [ ] 13. Add unit tests for error conditions
  - [ ]* 13.1 Write unit tests for tray creation failure
    - Test fallback behavior when tray creation fails
    - Test explore window shown as fallback
    - _Requirements: 1.1_
  
  - [ ]* 13.2 Write unit tests for shortcut registration failure
    - Test app continues when shortcut registration fails
    - Test warning is logged
    - _Requirements: 3.3_
  
  - [ ]* 13.3 Write unit tests for screen capture failure
    - Test error handling when capture fails
    - Test window state restoration on error
    - _Requirements: 4.1, 4.2_

- [ ] 14. Update electron-builder configuration for packaging
  - [ ] 14.1 Update `electron-builder.json` or `package.json` build config
    - Configure app name and description
    - Add icon paths for each platform (icns for macOS, ico for Windows, png for Linux)
    - Configure file associations if needed
    - Set up auto-updater if desired
    - _Requirements: 3.4, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 14.2 Test packaging on target platforms
    - Build application for Windows, macOS, and Linux
    - Verify installers are created correctly
    - Verify application icons appear correctly
    - _Requirements: 6.1, 7.3, 7.4, 7.5_

- [ ] 15. Add platform-specific keyboard shortcut handling
  - [ ]* 15.1 Write property test for platform-appropriate shortcuts
    - **Property 15: Platform-appropriate keyboard shortcuts**
    - **Validates: Requirements 6.5**
  
  - [ ] 15.2 Verify shortcut registration uses CommandOrControl
    - Confirm existing code uses 'CommandOrControl' modifier
    - Test on macOS uses Cmd key
    - Test on Windows/Linux uses Ctrl key
    - _Requirements: 6.5_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Update documentation
  - Update README with system tray usage instructions
  - Document global shortcut (Ctrl+Shift+C / Cmd+Shift+C)
  - Document how to quit the application (system tray menu)
  - Add troubleshooting section for common issues
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5, 3.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally: tray → lifecycle → state management → testing
- All property tests should run minimum 100 iterations
- Each property test must include a comment tag referencing the design document property
