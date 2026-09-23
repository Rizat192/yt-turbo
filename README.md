# YT Turbo

A Chrome extension (Manifest V3) that removes the delays YouTube's own interface adds on your
machine. It does not touch the network, so it cannot make a video download faster. It removes
the waiting that the page itself creates.

## The problem

YouTube is built on Polymer and does a lot of work you never see. It animates everything, keeps
a glow effect around the player that samples video frames on the GPU, takes snapshots of parts
of the page on every layout change, and deliberately waits before reacting to a click. None of
that is network time. All of it is time you spend waiting at your own computer.

I measured these delays on a live YouTube page and then removed them one by one.

## What I measured

**Click to pause: 305 ms before, 7 to 50 ms after.** YouTube waits about 300 ms after a click to
see whether it becomes a double click. The extension catches the click earlier, in the capture
phase, and toggles playback itself. A real double click still opens fullscreen, so nothing is
lost.

**Settings panel: 97 ms on first open, 15 ms after.** The gear panel is built only when you first
ask for it, which is why the first open feels slow. The extension builds it in advance and
invisibly, so the first open is as fast as every later one.

## Settings

Every option is a switch in the extension popup and applies immediately.

| Option | What it does |
| --- | --- |
| Remove all animations | Every transition and animation is cut to 1 ms. The `transitionend` events still fire, so YouTube's own code does not get stuck waiting for them. |
| Hard mode | Sets `transition: none` and `animation: none`. Truly zero, but loading spinners freeze in place. |
| No ripples or highlights | Hides `yt-touch-feedback-shape` (76 of them on a video page) and `yt-light-shape` (23 of them). They recalculate CSS variables every time the mouse moves over them. |
| Disable ambient mode | Removes `#cinematics` from the page. That is the glow around the player, and it samples video frames on the GPU without stopping. |
| Disable View Transitions | YouTube marks `#below` and `#secondary` with `view-transition-name`, so every layout change snapshots those subtrees. The names are removed and `document.startViewTransition` is replaced with a function that calls the callback immediately. |
| Fast fullscreen | Removes transitions from the player, the side columns and `ytd-app`, and stops hidden blocks from rendering with `content-visibility`. |
| Instant click to pause | Described above. |
| Prewarm the settings panel | Described above. |
| Comments right away | The comment block is placed in the viewport as an invisible layer for 1.5 seconds so YouTube's own `IntersectionObserver` fires and starts loading. The page does not scroll. |
| Do not render offscreen | Applies `content-visibility: auto` to feeds, recommendations and comments. |
| No hover previews | Turns off the inline player on thumbnails and animated covers. |
| No blur | Sets `backdrop-filter: none`. |
| Instant scroll | Sets `scroll-behavior: auto`. |

## What it will not speed up

The window actually entering fullscreen is done by Chrome and Windows, and no script can touch
that. Network time is also untouched: the first request for comments, the video download itself
and YouTube's server responses. Video decoding is untouched too.

If fullscreen is still slow, open `chrome://gpu` and check that hardware acceleration is on.

## Install

1. Open `chrome://extensions` and turn on Developer mode.
2. Click "Load unpacked" and select this folder.
3. Open YouTube. The settings are behind the extension icon.

## Files

`manifest.json` declares two content scripts: `main.js` runs in the page world, `content.js` runs
in the isolated world. `content.js` injects the CSS for whichever options are on and handles the
DOM work (ambient mode, prewarming, comments). `main.js` replaces `document.startViewTransition`.
`popup.html` and `popup.js` are the switches.
