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
