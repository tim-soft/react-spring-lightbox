# react-spring-lightbox

[![npm](https://img.shields.io/npm/v/react-spring-lightbox.svg?color=brightgreen&style=popout-square)](https://www.npmjs.com/package/react-spring-lightbox)
[![NPM](https://img.shields.io/npm/l/react-spring-lightbox.svg?color=brightgreen&style=popout-square)](https://github.com/tim-soft/react-spring-lightbox/blob/master/LICENSE)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-spring-lightbox.svg?style=popout-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=popout-square)
[![Travis (.org)](https://img.shields.io/travis/tim-soft/react-spring-lightbox?style=flat-square)](https://travis-ci.org/tim-soft/react-spring-lightbox)

React-spring-lightbox is a flexible image gallery lightbox with native-feeling touch gestures and buttery smooth animations.

<p align="middle">
  <a href="https://71hts.csb.app/">
    <img src="https://thumbs.gfycat.com/CrispGeneralEquestrian-size_restricted.gif" />
  </a>
  <br />
  <a href="https://timellenberger.com/libraries/react-spring-lightbox">Docs</a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://codesandbox.io/s/react-spring-lightbox-mosaic-71hts?fontsize=14&module=%2Fsrc%2FImageGallery%2Findex.js">Codesandbox</a>
</p>

## ✨ Features

-   :point_up: &nbsp;&nbsp;&nbsp;`Mousewheel`, swipe or click+drag to page photos
-   :keyboard: &nbsp;Keyboard controls <kbd>&leftarrow;</kbd> <kbd>&rightarrow;</kbd> <kbd>Esc</kbd>
-   :mouse2: &nbsp;<kbd>Ctrl</kbd> + `Mousewheel` or `Trackpad Pinch` to zoom
-   :mag_right: &nbsp;Double/Single-tap or double/single-click to zoom in/out
-   :ok_hand: &nbsp;&nbsp;&nbsp;Pinch to zoom
-   :point_left: &nbsp;Panning on zoomed-in images
-   :movie_camera: &nbsp;YouTube video support with event tracking
-   :checkered_flag: &nbsp;Highly performant spring based animations via [react-spring](https://github.com/react-spring/react-spring)
-   No external CSS
-   Implement your own UI
-   Supports IE 11, Edge, Safari, Chrome, Firefox and Opera
-   Full typescript support
-   Supports any `<img />` attribute including `loading` (lazy loading), `srcset` and `aria-*`

## Install

```bash
yarn add react-spring-lightbox
```

## Usage

The `images` prop now accepts a list of objects whose properties can be _almost_ any valid React `<img />` prop including `srcset`, `loading` (lazy loading) and `aria-*` attributes.

If you use typescript, the exact type can be imported from `import { ImagesListType } from 'react-spring-lightbox';`

```typescript
import React, { useState } from 'react';
import Lightbox, { ImagesListType } from 'react-spring-lightbox';

const images: ImagesListType = [
    {
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        loading: 'lazy',
        alt: 'Windows 10 Dark Mode Setting',
    },
    {
        src: 'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
        loading: 'lazy',
        alt: 'macOS Mojave Dark Mode Setting',
    },
    {
        src: 'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
        loading: 'lazy',
        alt: 'Android 9.0 Dark Mode Setting',
    },
];

const CoolLightbox = () => {
    const [currentImageIndex, setCurrentIndex] = useState(0);

    const gotoPrevious = () =>
        currentImageIndex > 0 && setCurrentIndex(currentImageIndex - 1);

    const gotoNext = () =>
        currentImageIndex + 1 < images.length &&
        setCurrentIndex(currentImageIndex + 1);

    return (
        <Lightbox
            isOpen={true}
            onPrev={gotoPrevious}
            onNext={gotoNext}
            images={images}
            currentIndex={currentImageIndex}
            /* Add your own UI */
            // renderHeader={() => (<CustomHeader />)}
            // renderFooter={() => (<CustomFooter />)}
            // renderPrevButton={() => (<CustomLeftArrowButton />)}
            // renderNextButton={() => (<CustomRightArrowButton />)}
            // renderImageOverlay={() => (<ImageOverlayComponent >)}

            /* Add styling */
            // className="cool-class"
            // style={{ background: "grey" }}

            /* Handle closing */
            // onClose={handleClose}

            /* Use single or double click to zoom */
            // singleClickToZoom

            /* react-spring config for open/close animation */
            // pageTransitionConfig={{
            //   from: { transform: "scale(0.75)", opacity: 0 },
            //   enter: { transform: "scale(1)", opacity: 1 },
            //   leave: { transform: "scale(0.75)", opacity: 0 },
            //   config: { mass: 1, tension: 320, friction: 32 }
            // }}
        />
    );
};

export default CoolLightbox;
```

## Props

| Prop                 | Description                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| isOpen               | Flag that dictates if the lightbox is open or closed                                                               |
| onClose              | Function that closes the Lightbox                                                                                  |
| onPrev               | Function that changes currentIndex to previous image in images                                                     |
| onNext               | Function that changes currentIndex to next image in images                                                         |
| currentIndex         | Index of image in images array that is currently shown                                                             |
| renderHeader         | A React component that renders above the image pager                                                               |
| renderFooter         | A React component that renders below the image pager                                                               |
| renderPrevButton     | A React component that is used for previous button in image pager                                                  |
| renderNextButton     | A React component that is used for next button in image pager                                                      |
| renderImageOverlay   | A React component that renders within the image stage, useful for creating UI overlays on top of the current image |
| singleClickToZoom    | Overrides the default behavior of double clicking causing an image zoom to a single click                          |
| images               | Array of image objects to be shown in Lightbox                                                                     |
| className            | Classes are applied to the root lightbox component                                                                 |
| style                | Inline styles are applied to the root lightbox component                                                           |
| pageTransitionConfig | React-Spring useTransition config for page open/close animation                                                    |
| showVideo            | Whether to show video instead of images                                                                            |
| videoId              | YouTube video ID for embedding video content                                                                       |
| onPlayerEvent        | Callback for YouTube player events (play, pause, end, etc.)                                                        |

## Video Support

The Lightbox supports YouTube video embeds alongside images. Key features include:

-   Support for embedding YouTube videos within the lightbox
-   Event handling for video playback and interactions
-   Seamless integration with existing image gallery functionality

### VideoEmbed Component

The `VideoEmbed` component is an internal component used by the Lightbox to handle YouTube video playback:

| Prop               | Description                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| videoId            | YouTube video ID for embedding video content                                         |
| onPlayerEvent      | Callback for YouTube player events (play, pause, end, etc.)                          |
| className          | Optional CSS class name                                                              |
| inline             | Affects width calculation method, depending on whether the Lightbox is inline or not |
| onNext             | Function to navigate to next item                                                    |
| onPrev             | Function to navigate to previous item                                                |
| onVideoInteraction | Callback when video interaction starts/ends                                          |
| style              | Optional inline styles                                                               |
| title              | Optional title for the iframe (default: "YouTube video player")                      |

```typescript
import { VideoEmbed } from 'react-spring-lightbox';

// Usage
<VideoEmbed
    videoId="youtube-video-id"
    className="custom-video-class"
    inline={false}
    onNext={() => console.log('Next')}
    onPrev={() => console.log('Previous')}
    onPlayerEvent={(event) => {
        console.log('Player event:', event);
        // event.type: 'ready' | 'play' | 'pause' | 'end' | 'error' | 'stateChange' | 'playbackRateChange' | 'playbackQualityChange'
        // event.data: any
        // event.player: YouTube player instance
    }}
    onVideoInteraction={(isInteracting) => {
        console.log('Video interaction:', isInteracting);
    }}
    style={{ maxWidth: '100%' }}
    title="Custom video title"
/>
```

The component uses the YouTube IFrame Player API via `react-youtube` and provides:

-   Automatic player initialization and cleanup
-   Event tracking for video interactions
-   Responsive sizing within the lightbox
-   Support for all YouTube player events

The component handles the following events:

-   `ready`: When the player is ready to receive commands
-   `play`: When the video starts playing
-   `pause`: When the video is paused
-   `end`: When the video reaches the end
-   `error`: When an error occurs in the player
-   `stateChange`: When the player's state changes
-   `playbackRateChange`: When the playback rate changes
-   `playbackQualityChange`: When the playback quality changes

### Lightbox Video Example

Here's an example of how to use the Lightbox with video support:

```javascript
<Lightbox
    showVideo={true}
    videoId="youtube-video-id"
    onPlayerEvent={(event) => {
        // Handle video events
    }}
    // ... other Lightbox props
/>
```

## Local Development

Clone the repo

```bash
git clone https://github.com/tim-soft/react-spring-lightbox.git react-spring-lightbox
cd react-spring-lightbox
```

Setup symlinks

```bash
yarn link
cd example
yarn link react-spring-lightbox
```

Run the library in development mode

```bash
yarn start
```

Run the example app in development mode

```bash
cd example
yarn dev
```

Changes to the library code should hot reload in the demo app

## License

MIT © [Tim Ellenberger](https://github.com/tim-soft)
