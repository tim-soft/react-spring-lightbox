import * as React from 'react';
import styled from 'styled-components';
import GalleryLightbox from '../components/GalleryLightbox';
import InlineLightbox from '../components/InlineLightbox';

const HomePage = () => (
    <Container>
        <GalleryLightboxExample>
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
        </GalleryLightboxExample>
        <hr />
        <InlineLightboxExampleContainer>
            <StyledH2>Inline Lightbox</StyledH2>
            <InlineLightboxExample>
                <OtherInlineContent>🎉🎉Inline content🎉🎉</OtherInlineContent>
                <InlineLightbox />
                <OtherInlineContent>🎉🎉Inline content🎉🎉</OtherInlineContent>
            </InlineLightboxExample>
        </InlineLightboxExampleContainer>
    </Container>
);

export default HomePage;

const Container = styled.div`
    height: 100%;
    width: 100%;
    user-select: none;
    background: #272727;
    color: #fff;
`;

const GalleryLightboxExample = styled.div`
    height: 100%;
    width: 100%;
`;

const InlineLightboxExampleContainer = styled.div`
    height: 100%;
    width: 100%;
`;
const InlineLightboxExample = styled.div`
    width: 100%;
    display: flex;
`;

const OtherInlineContent = styled.div`
    width: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
`;

const StyledH2 = styled.h2`
    text-align: center;
`;
