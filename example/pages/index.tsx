import * as React from 'react';
import styled from 'styled-components';
import GalleryLightbox from '../components/GalleryLightbox';
import InlineLightbox from '../components/InlineLightbox';
import Image from 'next/image';

const images: React.ReactNode[] = [
    <div key="0">
        <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            frameBorder="0"
            height="384"
            src="https://www.youtube.com/embed/fkrCWWumg1I?si=le414o7EvI8Wijn-"
            title="YouTube video player"
            width="450"
        ></iframe>
    </div>,
    <div key="1">
        <h2>hello!</h2>
    </div>,
    <Image
        alt="dark mode"
        height={2035}
        key="2"
        src="https://timellenberger.com/static/blog-content/dark-mode/win10-dark-mode.jpg"
        width={2848}
    />,
    <img
        key="3"
        src="https://timellenberger.com/static/blog-content/dark-mode/macos-dark-mode.png"
    />,
    <img
        key="4"
        src="https://timellenberger.com/static/blog-content/dark-mode/android-9-dark-mode.jpg"
    />,
];

const getRandomImages = (numImages: number) => {
    const imageArray = [...new Array(numImages)];

    const getRandomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    };

    const altCaption = 'picsum photo';
    const randomizedArray = imageArray.map(() => {
        const imageURL = `https://picsum.photos/id/${getRandomInt(
            1,
            200,
        )}/1920/1280`;

        return <img alt={altCaption} key={imageURL} />;
    });

    return randomizedArray;
};

const HomePage = () => {
    const [inlineImages, setInlineImages] = React.useState(getRandomImages(15));

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
                    <InlineLightbox images={images} />
                    <OtherInlineContent>
                        🎉🎉Inline content🎉🎉
                    </OtherInlineContent>
                </InlineLightboxExample>
                <Button
                    onClick={() =>
                        setInlineImages(getRandomImages(inlineImages.length))
                    }
                >
                    Generate new images
                </Button>
                <Button
                    onClick={() => {
                        if (inlineImages.length === 1) {
                            setInlineImages(getRandomImages(15));
                        } else {
                            setInlineImages(getRandomImages(1));
                        }
                    }}
                >
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
