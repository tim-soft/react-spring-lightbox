# Changelog

All notable changes to this project will be documented in this file.

## Upcoming

-   Add `swipe up` to close lightbox

## [1.6.0] - 2021-06-06

-   Upgrade to `@react-spring/web@9.2.1` stable from `@tim-soft/react-spring-web@9.0.0-beta.36`

## [1.5.0] - 2021-02-17

-   Rewrite project with typescript 4
-   Upgrade `react-use-gesture@7.0.15` to `react-use-gesture@9.0.4`
    -   This upgrade should fix some miscellaneous bugs such as `unable to spread non iterable instance` and more consistent trackpad support

### Added

-   The `images` prop now accepts a list of objects whose properties can be _almost_ any valid React `<img />` prop including `srcset` and `loading` (lazy loading)

If you use typescript, the exact type can be imported/used like this

```typescript
import Lightbox, { ImagesListType } from 'react-spring-lightbox';

const images: ImagesListType = [
    {
        alt: 'Windows 10 Dark Mode Setting',
        'aria-details': 'Some details',
        'aria-disabled': 'false',
        loading: 'lazy',
        src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
        srcSet: '/wp-content/uploads/flamingo4x.jpg 4x, /wp-content/uploads/flamingo3x.jpg 3x, /wp-content/uploads/flamingo2x.jpg 2x, /wp-content/uploads/flamingo1x.jpg 1x',
    },
    {
        alt: 'macOS Mojave Dark Mode Setting',
        'aria-details': 'Some details',
        'aria-disabled': 'false',
        loading: 'lazy',
        src: 'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
        srcSet: '/wp-content/uploads/flamingo4x.jpg 4x, /wp-content/uploads/flamingo3x.jpg 3x, /wp-content/uploads/flamingo2x.jpg 2x, /wp-content/uploads/flamingo1x.jpg 1x',
    },
];

const SimpleLightbox = () => <Lightbox images={images} {...otherProps} />;
```

The exact type is:

```typescript
export type ImagesListItem = Omit<
    React.HTMLProps<HTMLImageElement>,
    'draggable' | 'onClick' | 'onDragStart' | 'ref'
> & { alt: string; loading?: 'auto' | 'eager' | 'lazy'; src: string };
```

Which translates to any React `<img />` prop minus `draggable`, `onClick`, `onDragStart` and `ref` as they are used internally. `alt` and `src` are required and explicitly support `loading` as it is an experimental chrome feature not included in `React.HTMLProps<HTMLImageElement>`.

## [1.4.11] - 2020-06-10

### Fixed

-   Use aliased version of react-spring dependencies, fixes "Cannot read property 'ref' of null" error

## [1.4.10] - 2020-05-03

### Added

-   Optimize output bundles with Terser
-   Apply `babel-plugin-styled-components` babel plugin to optimize styled-components styles

## [1.4.9] - 2020-05-02

### Fixed

-   Fix partially off-screen image stage in ie11

### Added

-   Upgrade to `rollup@2.7.6`, `react-use-gesture@7.0.15` and `@babel/****@7.9.6`

## [1.4.8] - 2020-04-08

### Fixed

-   Dropped `lodash.clamp` dependency
-   Call onPrev/onNext callbacks on all paging events, even at the beginning or end of image array to allow for infinite paging

## [1.4.7] - 2020-04-05

### Added

-   Lower distance and velocity gesture threshold for a paging between images
-   Allow click to zoom while a paging animation completes
-   Upgrade to `rollup@2.3.3` and `react-use-gesture@7.0.10`
-   Add `sideEffects: false` to `package.json`

## [1.4.6] - 2020-04-04

### Fixed

-   Handle edge case bugs with `singleClickToZoom` option
-   Fix undefined errors in panning drag handler on initial drags

## [1.4.5] - 2020-03-27

### Added

-   Add optional `singleClickToZoom` prop which allows single click/tap zooming on images

## [1.4.4] - 2020-03-24

### Fixed

-   Add orientationchange event listener for ios devices

## [1.4.3] - 2020-03-23

### Fixed

-   Drop lodash.merge
-   Fix image heights not adjusting on window resize

## [1.4.2] - 2020-03-15

### Fixed

-   Remove need for react-use-measure and @juggle/resize-observer

## [1.4.1] - 2020-03-13

### Fixed

-   Fix image stage height on Safari
-   Upgrade to react-use-gesture@7.0.5
-   Upgrade to rollup@2.0.6

## [1.4.0] - 2020-03-7

### BREAKING CHANGE

-   Replaced inline styles with styled-components. This library now has a peer dependency on `styled-components@5`

### Fixed

-   Gigantic initial image size in Firefox and MS Edge
-   Click background to close functionality

### Added

-   Vendor prefixed styles
-   A resize observer polyfill is now included to support MS Edge

## [1.2.1] - 2020-03-5

### Added

-   Added `renderImageOverlay` prop, renders a React component within the image stage, useful for creating UI overlays on top of the current image

## [1.2.0] - 2020-02-14

-   Upgrade react-use-gesture v6 -> v7
-   Upgrade all deps

## [1.1.7] - 2019-09-23

### Fixed

-   Improved panning performance
-   Tweaked mousewheel swiping threshold
-   Upgrade to react-use-gesture v6

## [1.1.4] - 2019-08-27

### Added

-   Implement mousewheel paging of images

## [1.1.3] - 2019-08-19

### Fixed

-   Prevent vertical dragging from paging images
-   Switch to @react-spring/web package

## [1.1.2] - 2019-08-17

### Fixed

-   Properly dispose wheel event listener

## [1.1.1] - 2019-08-14

### Fixed

-   Adjusted "pan out of bounds" threshold

## [1.1.0] - 2019-08-14

### Added

-   Implement proper <kbd>Ctrl</kbd> + `Mousewheel` and `Trackpad Pinch` zooming

## [1.0.1] - 2019-08-7

Add testing suite and travis-ci config

## [1.0.0] - 2019-08-5

Upgrade deps and release as stable

## [0.0.3] - 2019-08-1

### Changed

-   Renamed onClickNext => onNext
-   Renamed onClickPrev => onPrev

## [0.0.2] - 2019-07-31

Initial Release
