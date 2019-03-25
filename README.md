# React Spring Lightbox

> A flexible image gallery lightbox built with spring physics based animations and gestures

**react-spring-lightbox**

**Demo** [https://next-portfolio-git-master.tim-soft.now.sh/portfolio](https://next-portfolio-git-master.tim-soft.now.sh/portfolio)

[![npm](https://img.shields.io/npm/v/react-spring-lightbox.svg?color=brightgreen&style=popout-square)](https://www.npmjs.com/package/react-spring-lightbox)
[![NPM](https://img.shields.io/npm/l/react-spring-lightbox.svg?color=brightgreen&style=popout-square)](https://github.com/tim-soft/react-spring-lightbox/blob/master/LICENSE)

## ✨ Features

- Touch friendly swipe/zoom gestures
- Keyboard controls
- Spring based animations

## Install

```bash
yarn add react-spring-lightbox
```

## Usage

```jsx
import React from 'react';
import Lightbox from 'react-spring-lightbox';

export default () => <Lightbox />;
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
yarn start
```

Changes to the library code should hot reload in the demo app

## License

MIT © [Tim Ellenberger](https://github.com/tim-soft)
