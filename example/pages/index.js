import * as React from 'react';
import styled from 'styled-components';
import GalleryLightbox from '../components/GalleryLightbox';
import InlineLightbox from '../components/InlineLightbox';

const HomePage = () => (
    <Container>
        <StyledH2>Gallery Lightbox</StyledH2>
        <GalleryLightbox
            galleryTitle="Dark Mode: OS Level Control In Your CSS"
            imageMasonryDirection="column"
            images={[
                {
                    alt: 'Windows 10 Dark Mode Setting',
                    caption: 'Windows 10 Dark Mode Setting',
                    height: 2035,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'macOS Mojave Dark Mode Setting',
                    caption: 'macOS Mojave Dark Mode Setting',
                    height: 1218,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
                    width: 1200,
                },
                {
                    alt: 'Android 9.0 Dark Mode Setting',
                    caption: 'Android 9.0 Dark Mode Setting',
                    height: 600,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    width: 1280,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting#',
                    caption: 'Windows 10 Dark Mode Setting#',
                    height: 2035,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting',
                    caption: 'Windows 10 Dark Mode Setting',
                    height: 2035,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'macOS Mojave Dark Mode Setting',
                    caption: 'macOS Mojave Dark Mode Setting',
                    height: 1218,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
                    width: 1200,
                },
                {
                    alt: 'Android 9.0 Dark Mode Setting',
                    caption: 'Android 9.0 Dark Mode Setting',
                    height: 600,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    width: 1280,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting#',
                    caption: 'Windows 10 Dark Mode Setting#',
                    height: 2035,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'Android 9.0 Dark Mode Setting',
                    caption: 'Android 9.0 Dark Mode Setting',
                    height: 600,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    width: 1280,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting#',
                    caption: 'Windows 10 Dark Mode Setting#',
                    height: 2035,
                    src: 'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
            ]}
        />
        <hr />
        <StyledH2>Inline Lightbox</StyledH2>
        <InlineLightbox />
    </Container>
);

export default HomePage;

const Container = styled.div`
    height: 100%;
    width: 100%;
    user-select: none;
    background: #272727;
`;

const StyledH2 = styled.h2`
    color: #fff;
    text-align: center;
`;
