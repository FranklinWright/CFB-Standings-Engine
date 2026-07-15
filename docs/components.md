# Component & Page Documentation

This document summarizes the core UI components, pages, and data sources for the CFB Standings Engine.

## Pages (`src/pages/`)

*   **`Home.jsx`**: The dashboard landing page.
    *   **Responsibility**: Processes global win/loss results to dynamically generate and display the Top 25 national rankings[cite: 1].
*   **`TeamsDirectory.jsx`**: The central directory for browsing all teams.
    *   **Responsibility**: Provides search, conference filtering, and sorting functionality. Includes access to "Simulation Tools" for adjusting game-logic bias[cite: 1].
*   **`TeamPage.jsx`**: The team profile hub.
    *   **Responsibility**: Orchestrates the display of team-specific data, including the 2026 schedule, historical trophy room, head-to-head stats, and the "Whack-an-Opponent" minigame[cite: 1].
    *   **Key Logic**: Handles localStorage persistence for user rewards and includes image error handling (`onError`) to ensure external asset links fallback to the local favicon[cite: 1].
*   **`ConferenceStandings.jsx`**: League status visualization.
    *   **Responsibility**: Calculates and displays win/loss records grouped by conference, including automatic calculation of conference titles and national ranks[cite: 1].
*   **`PlayoffBracket.jsx`**: Postseason management.
    *   **Responsibility**: Manages the 12-team CFP bracket, conference championships, and bowl game logic[cite: 1].

## Core App Structure
*   **`App.jsx`**: Main entry point defining routing and layout structure[cite: 1].
*   **`src/data/teams.js`**: Central repository for team branding, metadata, and the master season schedule[cite: 1].
*   **`src/data/history.js`**: Central database for multi-year historical seasons, championships, and schedules[cite: 1].

## Build Utilities
*   **`patch-champions.mjs` & `build-history.mjs`**: Utility scripts used for managing and updating historical data integrity[cite: 1].
*   **`Makefile` / `Dockerfile`**: Infrastructure configuration for building and containerizing the engine[cite: 1].