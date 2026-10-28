<p align="center">
  <img src="public/assets/logo/logo-main.png" alt="Chips-in logo" width="120">
</p>

<h1 align="center">Chips-in</h1>

<p align="center">
  A digital chip app for playing <strong>Poker</strong> and <strong>Blackjack</strong> with friends.
  Create a room, share its code, and manage the game together at one table.
</p>

<p align="center">
  <a href="https://chips-in-online.onrender.com/"><strong>Play Chips-in</strong></a>
  &nbsp;·&nbsp;
  <a href="README.md">Bahasa Indonesia</a> ·
  <a href="https://github.com/MKsafr/chips-in">GitHub</a>
</p>

Chips-in syncs rooms, players, chips, bets, and game results. Cards are still played physically; the app tracks chips and helps manage the game.

Current app version: **3.9** (the client/server version, separate from the Node.js package version).

## Table of contents

- [Features](#features)
- [How to use](#how-to-use)
- [Project structure](#project-structure)
- [Credits](#credits)

## Features

- Separate rooms with a unique code for each table.
- Poker and Blackjack modes.
- Chip balances, bets, pots, and game history.
- A border store with side-by-side single-color and animated two-color sections, featuring square border previews players can purchase for chips.
- Purchased borders can be applied separately to the spotlight or player avatar, or bought together as a matching bundle with 25% off.
- Profile borders use circular previews and are grouped into single-color and two-color categories, just like matching border bundles.
- The unique chip leader can freely choose an RGB or store border style from the matching single-color or two-color category; it only appears while they hold the lead and does not grant permanent ownership.
- The unique chip leader can unlock all non-RGB trial border styles for 5,000 chips; the unlock stays with the player, while the chosen trial style only applies during their lead.
- The general store offers theme and MVP music options; themes apply on the local device. If a Poker or Blackjack winner owns MVP music, their purchased track plays on every device in the room and follows the sound-effects volume. For Blackjack, the track is chosen randomly from winners who own MVP music; if none of the winners own it, `bjwin.mp3` plays. Background music pauses while the MVP track plays, then resumes. A Poker winner without MVP music leaves the default music playing. The winner sound is suppressed for players whose chip balance is empty.
- Interactive Poker and Blackjack guides explaining hands, rules, and how to play.
- A dealer panel to configure the table and manage players.
- Player management: change seating order, add or remove chips, offer the dealer role, and remove players.
- Players can join with a room code and set up their profile.
- Player and dealer sessions can be resumed after a connection loss, while the room and session are still available.
- Installable as a progressive web app (PWA) on supported browsers and devices.
- Indonesian and English interface, with theme options.
- FAQ and a bug-report form are available from the lobby help button.
- Support contact: chips.in.support@gmail.com.
- Bug reports open as public GitHub Issues; users must sign in and submit the report on GitHub.

## How to use

### Dealer

1. Open [Chips-in](https://chips-in-online.onrender.com/) and select **Create Room**.
2. Change your name and choose an avatar.
3. Share the room code with the players.
4. Open **Dealer Controls** to choose Poker or Blackjack, set the starting chips, and—for Poker—set the Small Blind and Big Blind.
5. Manage players in **Dealer Controls**: change seating order, add or remove chips, offer the dealer role, or remove players.
6. Play each round at the table:
   - **Poker:** select **Start New Hand**. When prompted to reveal community cards, reveal them on the physical table, then select **Confirm Cards** in the app. At **Showdown**, select the winner for each pot (including side pots), then select **Award Pot**.
   - **Blackjack:** players place their bets first. Select **Lock Bets & Deal**, then record each player's result after the physical card game. The bulk result buttons resolve all bets with the same result; **Cancel** returns the bets for that round.
7. **Reset All Chips** is available when no round is in progress.

### Player

1. Enter the room code from the dealer, then select **Join Room**.
2. Change your name and choose an avatar.
3. Open the **Store** and select the **Border Store** tab to use or purchase borders. Single-color borders cost 5,000 chips and animated two-color borders cost 10,000 chips. Purchases are available between rounds and are saved in the room. Buy a matching spotlight and profile border together for 25% off. While leading in chips, you can also choose a free RGB or store border style; it stops applying if you lose the lead and does not count as a purchase. The **Music Store** tab lists MVP music that can be previewed for up to 15 seconds before purchase; previews are only audible on your device. If a track owner wins a round, their track plays on every device in the room. If the winner does not own MVP music, all devices continue using the default music. To add tracks, place MP3 files in `public/assets/sounds/mvp/` and register each in `tracks.json` with an `id`, `title`, and `src`.
4. Play according to the selected mode:
   - **Poker:** take your turn by folding, calling/checking, raising, or going all-in. If you run out of chips while all-in, wait for the showdown and for the dealer to award the pot.
   - **Blackjack:** choose chips to set your bet before the dealer deals. During a round, use **Double** or **Split** when available.
5. Chip balances, bets, and room updates are synced automatically.

If your connection drops or the tab closes, reopen the site in the same browser. If the room and session are still available, you can choose to resume as a player or dealer. Players return with their previous balance; a returning dealer resumes their role. A session cannot be resumed if the room is no longer available, for example, after the server restarts.

## Project structure

```text
.
├── app/
│   ├── Config/
│   │   └── paths.js
│   ├── Controllers/
│   │   └── RoomController.js
│   └── Views/
│       └── index.html
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── app.css
│   │   │   └── legal.css
│   │   ├── images/
│   │   │   └── poker-felt-pattern.svg
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── blackjack.js
│   │   │   ├── dealer.js
│   │   │   ├── display.js
│   │   │   ├── html5-qrcode.min.js
│   │   │   ├── i18n.js
│   │   │   ├── legal.js
│   │   │   ├── player-row.js
│   │   │   ├── poker.js
│   │   │   ├── profile.js
│   │   │   ├── room.js
│   │   │   ├── sound.js
│   │   │   ├── state.js
│   │   │   └── ui-controls.js
│   │   ├── logo/
│   │   │   ├── logo-main.png
│   │   │   └── logo-small.png
│   │   └── sounds/
│   │       ├── allin.mp3
│   │       ├── award.mp3
│   │       ├── bet.mp3
│   │       ├── bgmusic.mp3
│   │       ├── bjlose.mp3
│   │       ├── bjwin.mp3
│   │       ├── call.mp3
│   │       ├── check.mp3
│   │       ├── double.mp3
│   │       ├── fold.mp3
│   │       ├── kick.mp3
│   │       ├── raise.mp3
│   │       ├── reset.mp3
│   │       ├── showdown.mp3
│   │       ├── split.mp3
│   │       ├── stage.mp3
│   │       ├── transfer.mp3
│   │       ├── win.mp3
│   │       └── mvp/
│   │           └── tracks.json
│   ├── pages/
│   │   ├── about.html
│   │   ├── privacy.html
│   │   └── terms.html
│   ├── manifest.json
│   ├── robots.txt
│   ├── sitemap.xml
│   └── sw.js
├── package-lock.json
├── package.json
├── README.en.md
├── README.md
├── server.js
└── start.bat
```

- `server.js` is the application entry point.
- `app/Controllers/RoomController.js` handles the HTTP server, rooms, and game logic.
- `app/Views/index.html` is the main page.
- `public/pages/` contains the About, Privacy, and Terms pages; `public/assets/css/legal.css` and `public/assets/js/legal.js` support those pages.
- `public/robots.txt` and `public/sitemap.xml` provide crawler directives and the public page list for search engines.
- `public/assets/` contains stylesheets, browser scripts, the QR scanner, images, logos, and sounds.
- Browser scripts are loaded in order from `app/Views/index.html` because some files use state and helpers defined by earlier files.
- Room data is stored in server memory, so unfinished rooms do not persist when the server process restarts.

## Credits

Created by **Ado, Anoy, Isan, and Kholid**.

Built entirely with the help of AI.

Website: https://chips-in-online.onrender.com/ · Repository: https://github.com/MKsafr/chips-in
