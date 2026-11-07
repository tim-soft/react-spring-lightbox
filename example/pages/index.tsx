import * as React from 'react';
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

// Browser defaults the old styles relied on, which Tailwind's preflight resets
const heading = 'my-[0.83em] text-center text-[1.5em] font-bold';
const button =
    'mx-auto my-5 cursor-pointer rounded-[10px] border-2 border-black bg-[teal] px-2.5 py-4 text-white [border-style:outset] hover:bg-[darkblue] active:bg-[darkseagreen]';
const otherInlineContent =
    'box-content flex w-[400px] items-center justify-center bg-[blueviolet] p-2.5';

const getRandomImages = (numImages: number) => {
    const imageArray = [...new Array(numImages)];

    const getRandomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    };

    const altCaption = 'picsum photo';
    const randomizedArray = imageArray.map((imageObj) => {
        const imageURL = `https://picsum.photos/id/${getRandomInt(
            1,
            200,
        )}/1920/1280`;
        return {
            ...imageObj,
            alt: altCaption,
            caption: altCaption,
            src: imageURL,
        };
    });

    return randomizedArray;
};

const HomePage = () => {
    const [inlineImages, setInlineImages] = React.useState(getRandomImages(15));

    return (
        <div className="h-full w-full bg-[#272727] px-0 py-[50px] text-white select-none">
            <div className="h-full w-full">
                <h2 className={heading}>Gallery Lightbox</h2>
                <GalleryLightbox
                    galleryTitle="Dark Mode: OS Level Control In Your CSS"
                    imageMasonryDirection="column"
                    images={images}
                />
            </div>
            <hr className="my-2 border border-[gray] [border-style:inset]" />
            <div className="flex h-full w-full flex-col">
                <h2 className={heading}>Inline Lightbox</h2>
                <div className="flex w-full justify-center">
                    <div className={otherInlineContent}>
                        🎉🎉Inline content🎉🎉
                    </div>
                    <InlineLightbox images={images} />
                    <div className={otherInlineContent}>
                        🎉🎉Inline content🎉🎉
                    </div>
                </div>
                <button
                    className={button}
                    onClick={() =>
                        setInlineImages(getRandomImages(inlineImages.length))
                    }
                >
                    Generate new images
                </button>
                <button
                    className={button}
                    onClick={() => {
                        if (inlineImages.length === 1) {
                            setInlineImages(getRandomImages(15));
                        } else {
                            setInlineImages(getRandomImages(1));
                        }
                    }}
                >
                    Switch Image Array
                </button>
            </div>
        </div>
    );
};

export default HomePage;
