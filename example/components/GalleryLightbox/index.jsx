// import { FiHeart, FiPrinter, FiShare } from 'react-icons/fi';
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Color from 'color';
import Gallery from 'react-photo-gallery';
import Lightbox from 'react-spring-lightbox';
import GridImage from './components/GridImage';
import LightboxHeader from './components/LightboxHeader';
import LightboxArrowButton from './components/LightboxArrowButton';

const mosaicImages = [
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

class BlogImageGallery extends React.Component {
    static propTypes = {
        galleryTitle: PropTypes.string.isRequired,
        imageMasonryDirection: PropTypes.oneOf(['column', 'row']),
        images: PropTypes.arrayOf(
            PropTypes.shape({
                alt: PropTypes.string.isRequired,
                caption: PropTypes.string.isRequired,
                height: PropTypes.number,
                src: PropTypes.string.isRequired,
                width: PropTypes.number,
            }),
        ).isRequired,
    };

    static defaultProps = {
        imageMasonryDirection: 'column',
    };

    constructor() {
        super();

        this.state = {
            clientSide: false,
            currentImageIndex: 0,
            lightboxIsOpen: false,
        };
    }

    componentDidMount() {
        this.setState({ clientSide: true });
    }

    openLightbox = (e, { index }) => {
        this.setState({
            currentImageIndex: index,
            lightboxIsOpen: true,
        });
    };

    closeLightbox = () => {
        this.setState({
            lightboxIsOpen: false,
        });
    };

    gotoPrevious = () => {
        const { currentImageIndex } = this.state;

        // If the current image isn't the first in the list, go to the previous
        if (currentImageIndex > 0) {
            this.setState({
                currentImageIndex: currentImageIndex - 1,
            });
        }
    };

    gotoNext = () => {
        const { images } = this.props;
        const { currentImageIndex } = this.state;

        // If the current image isn't the list in the list, go to the next
        if (currentImageIndex + 1 < images.length) {
            this.setState({
                currentImageIndex: currentImageIndex + 1,
            });
        }
    };

    /**
     * Sets breakpoints for column width based on containerWidth
     *
     * @int containerWidth The current width of the image grid
     */
    columnConfig = (containerWidth) => {
        let columns = 1;
        if (containerWidth >= 500) columns = 2;
        if (containerWidth >= 900) columns = 3;
        if (containerWidth >= 1500) columns = 4;

        return columns;
    };

    render() {
        const { clientSide, currentImageIndex, lightboxIsOpen } = this.state;
        const { galleryTitle, imageMasonryDirection, images } = this.props;

        return (
            <GalleryContainer>
                {clientSide && (
                    <Gallery
                        columns={this.columnConfig}
                        direction={imageMasonryDirection}
                        margin={6}
                        onClick={this.openLightbox}
                        photos={mosaicImages}
                        renderImage={GridImage}
                    />
                )}
                <StyledLightbox
                    currentIndex={currentImageIndex}
                    galleryTitle={galleryTitle}
                    images={images}
                    isOpen={lightboxIsOpen}
                    onClose={this.closeLightbox}
                    onNext={this.gotoNext}
                    onPrev={this.gotoPrevious}
                    renderHeader={() => (
                        <LightboxHeader
                            currentIndex={currentImageIndex}
                            galleryTitle={galleryTitle}
                            images={images}
                            onClose={this.closeLightbox}
                        />
                    )}
                    // renderImageOverlay={() => (
                    //     <ImageOverlay>
                    //         <p>Create your own UI</p>
                    //         <FiPrinter size="3em" />
                    //         <FiShare size="3em" />
                    //         <FiHeart size="3em" />
                    //     </ImageOverlay>
                    // )}
                    renderNextButton={({ canNext }) => (
                        <LightboxArrowButton
                            disabled={!canNext}
                            onClick={this.gotoNext}
                            position="right"
                        />
                    )}
                    renderPrevButton={({ canPrev }) => (
                        <LightboxArrowButton
                            disabled={!canPrev}
                            onClick={this.gotoPrevious}
                            position="left"
                        />
                    )}
                    singleClickToZoom
                />
            </GalleryContainer>
        );
    }
}

export default BlogImageGallery;

const GalleryContainer = styled.div`
    overflow-y: auto;
    max-height: calc(100% - 4em);
    padding: 2em;
`;

const StyledLightbox = styled(Lightbox)`
    background: ${({ theme }) =>
        Color(theme.accentColor).alpha(0.95).hsl().string()};
    * ::selection {
        background: ${({ theme }) => theme.pageContentSelectionColor};
    }
    * ::-moz-selection {
        background: ${({ theme }) =>
            new Color(theme.pageContentSelectionColor).darken(0.57).hex()};
    }
`;

// const ImageOverlay = styled.div`
//     position: absolute;
//     top: 0%;
//     right: 0%;
//     border: ${({ theme }) => theme.pageContentSelectionColor} 1px solid;
//     background: rgba(39, 39, 39, 0.5);
//     p {
//         color: ${({ theme }) => theme.pageContentSelectionColor};
//         text-align: center;
//         font-weight: bold;
//         font-size: 1.2em;
//         margin: 0.5em 0;
//     }
//     svg {
//         border: white 1px solid;
//         fill: ${({ theme }) => theme.pageContentSelectionColor};
//         margin: 10px;
//         padding: 5px;
//         :hover {
//             border: ${({ theme }) => theme.pageContentSelectionColor} 1px solid;
//             fill: ${({ theme }) =>
//                 new Color(theme.pageContentSelectionColor).darken(0.57).hex()};
//             cursor: pointer;
//         }
//     }
// `;
