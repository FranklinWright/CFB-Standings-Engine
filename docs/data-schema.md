# Data Schema Documentation

This document outlines the structures for the primary data objects used in the engine.

## Team Object
Used in `src/data/teams.js`.
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier (e.g., 'bc', 'clem'). |
| `name` | String | Full display name of the college. |
| `conf` | String | Current conference association. |
| `color` | String | Hex code for team branding. |
| `rating` | Number | Integer representing team strength. |
| `logo` | String | URL to the team logo or `/favicon.ico`. |
| `description` | String | Brief summary of the program's history/tradition. |

## Master Schedule Object
Used in `src/data/teams.js`.
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Number | Unique numeric identifier for the game. |
| `date` | String | Scheduled date (e.g., "Aug 29"). |
| `away` | String | `id` of the visiting team. |
| `home` | String | `id` of the hosting team. |
| `location` | String | Venue name or game details. |
| `time` | String | Scheduled kickoff time. |

## Playoff Data Object
Used in state management for `PlayoffBracket.jsx`.
*   **Structure**: A configuration object defining the postseason environment.
*   **Contents**:
    *   `games`: Array of game objects (CCGs, CFP, and Bowls) with additional flags: `isCCG` (Boolean), `isBowl` (Boolean), and `detail` (String).
    *   `seedMap`: Object mapping team IDs to their respective CFP seed.
    *   `ccGames`: Specific subset of conference championship games.
    *   `ccgsComplete`: Boolean tracking if the championship round has concluded.
    *   `bowlGames`: Array of non-playoff bowl matchups.

## Historical Data Object
Used in `src/data/history.js`.
*   **Structure**: A dictionary keyed by season year (e.g., `"2025"`).
*   **Contents**:
    *   `nationalChampion`: ID of the team that won the title.
    *   `conferenceChampions`: Object mapping conference names to winning team IDs.
    *   `schedules`: Object mapping team IDs to an array of game objects.
        *   *Game Object*: Contains `opponentId`, `opponentName`, `ourScore`, `theirScore`, `result` ('W'/'L'), and `type` ('Regular', 'CCG', 'Bowl', etc.).