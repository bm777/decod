# Decod 2D matrix

## How to run
First, you need to install devvit [instructions here](https://developers.reddit.com/docs/quickstart)

```bash
# login first
devvit login

# clone this repo
git clone https://github.com/bm777/decod.git
cd decod

# upload the app
devvit upload

# playtest the app
devvit playtest <name>
```

### Hierarchy diagram

```mermaid
graph TD
A[main.tsx] --> B[PostView]
B --> C[CanvasView]
B --> D[LeaderboardView]
B --> E[HelpView]

C --> F[PixelText]
D --> F
E --> F

C --> G[canvas.js]
C --> H[decodeMatrix.js]
C --> I[leaderboard.js]

D --> I

G --> J[Challenge Management]
H --> K[Word Detection]
I --> L[User Scoring/Ranking]

classDef logic fill:#f9f,stroke:#333,stroke-width:2px;
classDef component fill:#bbf,stroke:#333,stroke-width:2px;
classDef utility fill:#bfb,stroke:#333,stroke-width:2px;

class A,B,C,D,E component;
class G,H,I logic;
class F,J,K,L utility;
```

### Functional diagram 

```mermaid
flowchart TD
    A[main.tsx] -->|Entry Point| B[Configures Devvit]
    A -->|Registers| C[Custom Post Type: Decod]
    A -->|Adds| D[Subreddit Menu Item]
    
    C -->|Renders| E[PostView]
    E -->|State: home| F[Home Screen]
    E -->|State: canvas| G[CanvasView]
    E -->|State: leaderboard| H[LeaderboardView]
    E -->|State: help| I[HelpView]
    
    G -->|Places pixel| J[placePixel function]
    G -->|Checks for words| K[decodeWordMatrix function]
    G -->|Updates scores| L[leaderboard functions]
    
    J -->|Updates| M[Redis Canvas Data]
    K -->|Detects| N[Valid English Words]
    L -->|Updates| O[User Rankings]
    
    style A fill:#ff9,stroke:#333,stroke-width:2px
    style G,H,I fill:#bbf,stroke:#333,stroke-width:2px
    style J,K,L fill:#f9f,stroke:#333,stroke-width:2px
    style M,N,O fill:#bfb,stroke:#333,stroke-width:2px
```

### Data flow diagram

```mermaid
graph LR
    A[User Input] -->|Place Pixel| B[CanvasView]
    B -->|Update Canvas| C[Redis]
    B -->|Real-time Updates| D[Other Users]
    B -->|Word Detection| E[decodeMatrix]
    E -->|Valid Words Found| F[Leaderboard]
    
    G[New Challenge] -->|Create Post| H[Reddit API]
    H -->|Store Link| C
    
    I[View Leaderboard] -->|Get Rankings| J[LeaderboardView]
    J -->|Fetch Data| C
    
    style A,G,I fill:#ff9,stroke:#333,stroke-width:2px
    style B,J fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#bfb,stroke:#333,stroke-width:2px
```

### main Tech Stack
```mermaid
graph LR
    A[User Input] -->|Place Pixel| B[CanvasView]
    B -->|Update Canvas| C[Redis]
    B -->|Real-time Updates| D[Other Users]
    B -->|Word Detection| E[decodeMatrix]
    E -->|Valid Words Found| F[Leaderboard]
    
    G[New Challenge] -->|Create Post| H[Reddit API]
    H -->|Store Link| C
    
    I[View Leaderboard] -->|Get Rankings| J[LeaderboardView]
    J -->|Fetch Data| C
    
    style A,G,I fill:#ff9,stroke:#333,stroke-width:2px
    style B,J fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#bfb,stroke:#333,stroke-width:2px
```