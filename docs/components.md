# Component & Page Documentation

This document summarizes the core UI components, pages, and data sources for the CFB Standings Engine.

## Pages (`src/pages/`)

*   **`Home.jsx`**: The dashboard landing page.
    *   **Responsibility**: Serves as the introductory landing page, providing users with stylized quick-start instructions and navigation links to other core areas of the site.
*   **`Poll.jsx`**: The Top 25 poll page.
    *   **Responsibility**: Processes global win/loss results to dynamically generate and display the Top 25 national rankings based on projected season results.
*   **`TeamsDirectory.jsx`**: The central directory for browsing all teams.
    *   **Responsibility**: Provides search, conference filtering (including the FCS/Other category), and sorting functionality. Includes access to "Simulation Tools" for adjusting game-logic bias and integrates seamlessly with global URL search parameters.
*   **`TeamPage.jsx`**: The team profile hub.
    *   **Responsibility**: Orchestrates the display of team-specific data, including the 2026 schedule, historical trophy room, head-to-head stats, and the "Whack-an-Opponent" minigame.
    *   **Key Logic**: Handles localStorage persistence for user rewards and includes image error handling (`onError`) to ensure external asset links fallback to the local favicon.
*   **`ConferenceStandings.jsx`**: League status visualization.
    *   **Responsibility**: Calculates and displays win/loss records grouped by conference, including automatic calculation of conference titles and national ranks.
*   **`PlayoffBracket.jsx`**: Postseason management.
    *   **Responsibility**: Manages the 12-team CFP bracket, conference championships, and bowl game logic.
*   **`NotFound.jsx`**: Error handling.
    *   **Responsibility**: Acts as a 404 catch-all page to catch any invalid routes.

## Core App Structure

*   **`App.jsx`**: Main entry point and central state manager.
    *   **Responsibility**: Defines routing, layout structure, and houses the `Navigation` component featuring a global autocomplete search bar (which dynamically calculates rankings and applies SEC/Big Ten priority sorting). Manages global simulation logic and data import/export functionality.
*   **`src/data/teams.js`**: Central repository for team branding, metadata, and the master season schedule.
*   **`src/data/history.js`**: Central database for multi-year historical seasons, championships, and schedules.

## Build Utilities

*   **`patch-champions.mjs` & `build-history.mjs`**: Utility scripts used for managing and updating historical data integrity.
*   **`Makefile` / `Dockerfile`**: Infrastructure configuration for building and containerizing the engine.