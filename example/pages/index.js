import styled from 'styled-components';
import GalleryLightbox from '../components/GalleryLightbox';

const HomePage = () => (
    <Container>
        <GalleryLightbox
            galleryTitle="Dark Mode: OS Level Control In Your CSS"
            imageMasonryDirection="column"
            images={[
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    caption: 'Windows 10 Dark Mode Setting',
                    alt: 'Windows 10 Dark Mode Setting',
                    width: 2848,
                    height: 2035,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
                    caption: 'macOS Mojave Dark Mode Setting',
                    alt: 'macOS Mojave Dark Mode Setting',
                    width: 1200,
                    height: 1218,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    caption: 'Android 9.0 Dark Mode Setting',
                    alt: 'Android 9.0 Dark Mode Setting',
                    width: 1280,
                    height: 600,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    caption: 'Windows 10 Dark Mode Setting#',
                    alt: 'Windows 10 Dark Mode Setting#',
                    width: 2848,
                    height: 2035,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    caption: 'Windows 10 Dark Mode Setting',
                    alt: 'Windows 10 Dark Mode Setting',
                    width: 2848,
                    height: 2035,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png',
                    caption: 'macOS Mojave Dark Mode Setting',
                    alt: 'macOS Mojave Dark Mode Setting',
                    width: 1200,
                    height: 1218,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    caption: 'Android 9.0 Dark Mode Setting',
                    alt: 'Android 9.0 Dark Mode Setting',
                    width: 1280,
                    height: 600,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    caption: 'Windows 10 Dark Mode Setting#',
                    alt: 'Windows 10 Dark Mode Setting#',
                    width: 2848,
                    height: 2035,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg',
                    caption: 'Android 9.0 Dark Mode Setting',
                    alt: 'Android 9.0 Dark Mode Setting',
                    width: 1280,
                    height: 600,
                },
                {
                    src:
                        'https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg',
                    caption: 'Windows 10 Dark Mode Setting#',
                    alt: 'Windows 10 Dark Mode Setting#',
                    width: 2848,
                    height: 2035,
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
