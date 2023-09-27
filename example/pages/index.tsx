import * as React from 'react';
import styled from 'styled-components';
import GalleryLightbox from '../components/GalleryLightbox';
import InlineLightbox from '../components/InlineLightbox';

const images = [
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
];

const HomePage = () => {
    const getRandomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    };

    const getRandomImageURL = React.useCallback(() => {
        return `https://picsum.photos/id/${getRandomInt(1, 200)}/1920/1280`;
    }, []);

    const getRandomImages = React.useCallback(
        (imageArray) => {
            const altCaption = 'picsum photo';
            const randomizedArray = imageArray.map((imageObj) => {
                const imageURL = getRandomImageURL();
                return {
                    ...imageObj,
                    alt: altCaption,
                    caption: altCaption,
                    src: imageURL,
                };
            });
            return randomizedArray;
        },
        [getRandomImageURL],
    );

    const [inlineImages, setInlineImages] = React.useState(images);
    const [showLargeArray, setShowLargeArray] = React.useState(true);

    React.useEffect(() => {
        const largeArray = getRandomImages([...Array(15)]);
        const smallArray = getRandomImages([...Array(1)]);
        if (showLargeArray) {
            setInlineImages(largeArray);
        } else {
            setInlineImages(smallArray);
        }
    }, [showLargeArray, getRandomImages]);

    return (
        <Container>
            <GalleryLightboxExample>
                <StyledH2>Gallery Lightbox</StyledH2>
                <GalleryLightbox
                    galleryTitle="Dark Mode: OS Level Control In Your CSS"
                    imageMasonryDirection="column"
                    images={images}
                />
            </GalleryLightboxExample>
            <hr />
            <InlineLightboxExampleContainer>
                <StyledH2>Inline Lightbox</StyledH2>
                <InlineLightboxExample>
                    <OtherInlineContent>
                        🎉🎉Inline content🎉🎉
                    </OtherInlineContent>
                    <InlineLightbox images={inlineImages} />
                    <OtherInlineContent>
                        🎉🎉Inline content🎉🎉
                    </OtherInlineContent>
                </InlineLightboxExample>
                <Button
                    onClick={() =>
                        setInlineImages(getRandomImages(inlineImages))
                    }
                >
                    Generate new images
                </Button>
                <Button onClick={() => setShowLargeArray(!showLargeArray)}>
                    Switch Image Array
                </Button>
            </InlineLightboxExampleContainer>
        </Container>
    );
};

export default HomePage;

const Container = styled.div`
    height: 100%;
    width: 100%;
    user-select: none;
    background: #272727;
    color: #fff;
    padding: 50px 0;
`;

const Button = styled.button`
    border-radius: 10px;
    background: teal;
    color: #fff;
    padding: 16px 10px;
    margin: 20px auto;
    cursor: pointer;
    :hover {
        background: darkblue;
    }
    :active {
        background: darkseagreen;
    }
`;

const GalleryLightboxExample = styled.div`
    height: 100%;
    width: 100%;
`;

const InlineLightboxExampleContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
`;
const InlineLightboxExample = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const OtherInlineContent = styled.div`
    width: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    background: blueviolet;
`;

const StyledH2 = styled.h2`
    text-align: center;
`;
