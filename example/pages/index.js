import * as React from 'react';
import styled from 'styled-components';
import GalleryLightbox from '../components/GalleryLightbox';

const HomePage = () => (
    <Container>
        <GalleryLightbox
            galleryTitle="Dark Mode: OS Level Control In Your CSS"
            imageMasonryDirection="column"
            images={[
                {
                    alt: 'Windows 10 Dark Mode Setting',
                    caption: 'Windows 10 Dark Mode Setting',
                    height: 2035,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'macOS Mojave Dark Mode Setting',
                    caption: 'macOS Mojave Dark Mode Setting',
                    height: 1218,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
                    width: 1200,
                },
                {
                    alt: 'Android 9.0 Dark Mode Setting',
                    caption: 'Android 9.0 Dark Mode Setting',
                    height: 600,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    width: 1280,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting#',
                    caption: 'Windows 10 Dark Mode Setting#',
                    height: 2035,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting',
                    caption: 'Windows 10 Dark Mode Setting',
                    height: 2035,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'macOS Mojave Dark Mode Setting',
                    caption: 'macOS Mojave Dark Mode Setting',
                    height: 1218,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
                    width: 1200,
                },
                {
                    alt: 'Android 9.0 Dark Mode Setting',
                    caption: 'Android 9.0 Dark Mode Setting',
                    height: 600,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    width: 1280,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting#',
                    caption: 'Windows 10 Dark Mode Setting#',
                    height: 2035,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
                {
                    alt: 'Android 9.0 Dark Mode Setting',
                    caption: 'Android 9.0 Dark Mode Setting',
                    height: 600,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    width: 1280,
                },
                {
                    alt: 'Windows 10 Dark Mode Setting#',
                    caption: 'Windows 10 Dark Mode Setting#',
                    height: 2035,
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    width: 2848,
                },
            ]}
        />
    </Container>
);

export default HomePage;

const Container = styled.div`
    height: 100vh;
    width: 100%;
    user-select: none;
    overflow: hidden;
    background: #272727;
`;
