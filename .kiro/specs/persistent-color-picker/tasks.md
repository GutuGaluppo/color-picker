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
  - Wire menu item clicks to handler functions
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Add application icons for system tray
  - Create or obtain icon files for system tray (16x16 and 32x32 PNG for macOS/Linux, ICO for Windows)
  - Place icons in `electron/assets/` directory
  - Update tray creation to use correct icon path based on platform
  - _Requirements: 1.1, 7.2_

- [x] 3. Integrate system tray into main process lifecycle
  - [x] 3.1 Modify `electron/main.ts` to import and initialize tray manager
    - Import `createTray` and `destroyTray` from tray module
    - Call `createTray()` in `app.whenReady()` handler before creating explore window
    - Add tray cleanup in `app.on('before-quit')` handler
    - _Requirements: 1.1, 1.5_
  
  - [x] 3.2 Connect tray menu actions to existing window functions
    - Wire "Start Capture" menu item to call `hideExploreWindow()` and `createCaptureWindow()`
    - Wire "Show Window" menu item to call `showExploreWindow()`
    - Wire "Quit" menu item to call `app.quit()`
    - _Requirements: 1.4, 1.5_

- [x] 4. Implement persistent background operation
  - [x] 4.1 Modify window-all-closed handler in `electron/main.ts`
    - Remove or comment out `app.quit()` call for all platforms
    - Add comment explaining app continues in background with tray
    - _Requirements: 2.1, 2.5_
  
  - [x] 4.2 Update explore window close behavior
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

- [x] 5. Enhance window state management
  - [x] 5.1 Add window state tracking to `electron/windows.ts`
    - Define `WindowState` interface with visibility flags
    - Add module-level `windowState` variable
    - Update `hideExploreWindow()` to track previous state
    - Update `showExploreWindow()` to update state flags
    - _Requirements: 5.3, 5.4_
  
  - [x] 5.2 Implement window state restoration after capture
    - Create `restoreExploreWindowState()` function
    - Call restoration function in capture completion handlers
    - Update `close-capture` IPC handler to restore state
    - Update `cancel-capture` IPC handler to restore state
    - _Requirements: 5.4_
  
  - [ ]* 5.3 Write property test for window visibility round-trip
    - **Property 13: Window visibility round-trip**
    - **Validates: Requirements 5.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Handle duplicate application launches
  - [ ] 7.1 Implement second-instance detection
    - Use Electron's `app.requestSingleInstanceLock()` API
    - Add handler for `second-instance` event in `electron/main.ts`
    - Show explore window when second instance is detected
    - Focus the window if already visible
    - _Requirements: 3.2_
  
  - [ ]* 7.2 Write property test for duplicate launch behavior
    - **Property 5: Duplicate launch shows window**
    - **Validates: Requirements 3.2**

- [ ] 8. Add error handling for system tray operations
  - [ ] 8.1 Add try-catch around tray creation in `electron/main.ts`
    - Wrap `createTray()` call in try-catch block
    - Log error with details if tray creation fails
    - Show explore window as fallback
    - Optionally add user notification about tray unavailability
    - _Requirements: 1.1_
  
  - [ ] 8.2 Add error handling for shortcut registration in `electron/shortcuts.ts`
    - Check return value of `globalShortcut.register()`
    - Log warning if registration fails
    - Continue app operation without shortcut
    - _Requirements: 3.3_
  
  - [ ] 8.3 Add error handling for screen capture in `electron/main.ts`
    - Wrap capture handler in try-catch (already exists)
    - Ensure capture window closes on error
    - Restore explore window state on error
    - Log error details for debugging
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 8.4 Write unit tests for error conditions
    - Test tray creation failure fallback
    - Test shortcut registration failure handling
    - Test screen capture failure recovery
    - _Requirements: 1.1, 3.3, 4.1_

- [ ] 9. Set up testing infrastructure
  - [ ] 9.1 Install testing dependencies
    - Install Jest or Vitest for unit testing
    - Install fast-check for property-based testing
    - Install @testing-library/react for component testing if needed
    - Configure test scripts in package.json
    - _Requirements: All (testing foundation)_
  
  - [ ] 9.2 Create test directory structure
    - Create `tests/unit/` directory for unit tests
    - Create `tests/property/` directory for property-based tests
    - Create test configuration files (jest.config.js or vitest.config.ts)
    - Set up test utilities and helpers
    - _Requirements: All (testing foundation)_

- [ ] 10. Implement property tests for capture workflow
  - [ ]* 10.1 Write property test for capture mode overlay
    - **Property 6: Capture mode displays overlay**
    - **Validates: Requirements 4.1**
  
  - [ ]* 10.2 Write property test for color capture and clipboard
    - **Property 7: Color capture and clipboard**
    - **Validates: Requirements 4.2, 4.3**
  
  - [ ]* 10.3 Write property test for capture completion
    - **Property 8: Capture completion restores state**
    - **Validates: Requirements 4.4**
  
  - [ ]* 10.4 Write property test for capture cancellation
    - **Property 9: Capture cancellation restores state**
    - **Validates: Requirements 4.5**

- [ ] 11. Implement property tests for window management
  - [ ]* 11.1 Write property test for explore window close behavior
    - **Property 10: Explore window close behavior**
    - **Validates: Requirements 5.1**
  
  - [ ]* 11.2 Write property test for tray show window action
    - **Property 11: Tray show window action**
    - **Validates: Requirements 5.2**
  
  - [ ]* 11.3 Write property test for capture mode window hiding
    - **Property 12: Capture mode hides explore window**
    - **Validates: Requirements 5.3**
  
  - [ ]* 11.4 Write property test for window always on top
    - **Property 14: Explore window always on top**
    - **Validates: Requirements 5.5**

- [ ] 12. Implement property tests for background operation
  - [ ]* 12.1 Write property test for shortcut functionality in background
    - **Property 3: Background state preserves shortcut functionality**
    - **Validates: Requirements 2.3, 2.4**
  
  - [ ]* 12.2 Write property test for explicit quit requirement
    - **Property 4: Explicit quit requirement**
    - **Validates: Requirements 2.5**

- [ ] 13. Add unit tests for tray menu functionality
  - [ ]* 13.1 Write unit tests for tray creation
    - Test tray icon is created on startup
    - Test tray menu contains expected items
    - Test platform-specific icon paths are correct
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 13.2 Write unit tests for menu actions
    - Test "Start Capture" triggers capture mode
    - Test "Show Window" displays explore window
    - Test "Quit" terminates application
    - _Requirements: 1.4, 1.5_

- [ ] 14. Verify platform-specific keyboard shortcut handling
  - [ ]* 14.1 Write property test for platform-appropriate shortcuts
    - **Property 15: Platform-appropriate keyboard shortcuts**
    - **Validates: Requirements 6.5**
  
  - [ ] 14.2 Verify shortcut registration uses CommandOrControl
    - Confirm existing code in `electron/shortcuts.ts` uses 'CommandOrControl' modifier
    - Test on macOS uses Cmd key
    - Test on Windows/Linux uses Ctrl key
    - _Requirements: 6.5_

- [ ] 15. Update electron-builder configuration for packaging
  - [ ] 15.1 Update `electron-builder.json` or `package.json` build config
    - Configure app name, description, and app ID
    - Add icon paths for each platform (icns for macOS, ico for Windows, png for Linux)
    - Configure build output directories
    - Set up code signing if desired
    - _Requirements: 3.4, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 15.2 Test packaging on target platforms
    - Build application for Windows using `npm run electron:build`
    - Build application for macOS using `npm run electron:build`
    - Build application for Linux using `npm run electron:build`
    - Verify installers are created correctly
    - Verify application icons appear correctly in OS
    - Test that installed app launches and tray icon appears
    - _Requirements: 6.1, 7.3, 7.4, 7.5_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Update documentation
  - [ ] 17.1 Update README with usage instructions
    - Document system tray functionality
    - Document global shortcut (Ctrl+Shift+C / Cmd+Shift+C)
    - Document how to quit the application (system tray menu)
    - Add screenshots of tray menu and application windows
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5, 3.3_
  
  - [ ] 17.2 Add troubleshooting section
    - Document what to do if tray icon doesn't appear
    - Document what to do if global shortcut doesn't work
    - Document platform-specific issues and solutions
    - Add FAQ section for common questions
    - _Requirements: 1.1, 3.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Tasks 1-5 are complete: system tray, lifecycle management, and window state tracking are implemented
- Remaining work focuses on: error handling, testing infrastructure, packaging, and documentation
- All property tests should run minimum 100 iterations
- Each property test must include a comment tag referencing the design document property
- Testing infrastructure (task 9) should be completed before implementing property and unit tests
