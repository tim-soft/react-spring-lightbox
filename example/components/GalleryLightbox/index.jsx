import PropTypes from 'prop-types';
import React from 'react';
import { FiHeart, FiPrinter, FiShare } from 'react-icons/fi';
import Gallery from 'react-photo-gallery';
import Lightbox from 'react-spring-lightbox';

import GridImage from './components/GridImage';
import LightboxArrowButton from './components/LightboxArrowButton';
import LightboxHeader from './components/LightboxHeader';

const overlayIcon =
    'm-2.5 box-content inline border align-baseline border-white fill-highlight p-[5px] hover:cursor-pointer hover:border-highlight hover:fill-highlight-dark';

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
            })
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
        // oxlint-disable-next-line react/no-did-mount-set-state -- renders the gallery only in the browser, after hydration
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
        if (containerWidth >= 500) {
            columns = 2;
        }
        if (containerWidth >= 900) {
            columns = 3;
        }
        if (containerWidth >= 1500) {
            columns = 4;
        }

        return columns;
    };

    render() {
        const { clientSide, currentImageIndex, lightboxIsOpen } = this.state;
        const { galleryTitle, imageMasonryDirection, images } = this.props;

        // remove the height and width props for the lightbox images array
        const listboxImages = [...images].map((image) => {
            const newImage = { ...image };
            delete newImage.height;
            delete newImage.width;

            return newImage;
        });

        return (
            <div className="max-h-[calc(100%-4em)] overflow-y-auto p-[2em]">
                {clientSide && (
                    <Gallery
                        columns={this.columnConfig}
                        direction={imageMasonryDirection}
                        margin={6}
                        onClick={this.openLightbox}
                        photos={images}
                        renderImage={GridImage}
                    />
                )}
                <Lightbox
                    aria-label={galleryTitle}
                    className="bg-accent/95 selection:bg-highlight"
                    currentIndex={currentImageIndex}
                    images={listboxImages}
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
                    renderImageOverlay={() => (
                        <div className="absolute top-0 right-0 border border-highlight bg-[rgba(39,39,39,0.5)]">
                            <p className="my-[0.5em] text-center text-[1.2em] font-bold text-highlight">
                                Create your own UI
                            </p>
                            <FiPrinter
                                className={overlayIcon}
                                size="3em"
                            />
                            <FiShare
                                className={overlayIcon}
                                size="3em"
                            />
                            <FiHeart
                                className={overlayIcon}
                                size="3em"
                            />
                        </div>
                    )}
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
            </div>
        );
    }
}

export default BlogImageGallery;
