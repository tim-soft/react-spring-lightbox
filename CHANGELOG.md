# Changelog

All notable changes to this project will be documented in this file.

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
