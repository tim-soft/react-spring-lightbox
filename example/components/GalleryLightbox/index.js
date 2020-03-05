import { FiHeart, FiPrinter, FiShare } from 'react-icons/fi';
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Color from 'color';
import Gallery from 'react-photo-gallery';
import Lightbox from 'react-spring-lightbox';
import GridImage from './components/GridImage';
import LightboxHeader from './components/LightboxHeader';
import LightboxArrowButton from './components/LightboxArrowButton';

class BlogImageGallery extends React.Component {
    static propTypes = {
        galleryTitle: PropTypes.string.isRequired,
        imageMasonryDirection: PropTypes.oneOf(['column', 'row']),
        images: PropTypes.arrayOf(
            PropTypes.shape({
                src: PropTypes.string.isRequired,
                caption: PropTypes.string.isRequired,
                alt: PropTypes.string.isRequired,
                width: PropTypes.number,
                height: PropTypes.number
            })
        ).isRequired
    };

    static defaultProps = {
        imageMasonryDirection: 'column'
    };

    constructor() {
        super();

        this.state = {
            currentImageIndex: 0,
            lightboxIsOpen: false,
            clientSide: false
        };
    }

    componentDidMount() {
        this.setState({ clientSide: true });
    }

    openLightbox = (e, { index }) => {
        this.setState({
            currentImageIndex: index,
            lightboxIsOpen: true
        });
    };

    closeLightbox = () => {
        this.setState({
            lightboxIsOpen: false
        });
    };

    gotoPrevious = () => {
        const { currentImageIndex } = this.state;

        // If the current image isn't the first in the list, go to the previous
        if (currentImageIndex > 0) {
            this.setState({
                currentImageIndex: currentImageIndex - 1
            });
        }
    };

    gotoNext = () => {
        const { images } = this.props;
        const { currentImageIndex } = this.state;

        // If the current image isn't the list in the list, go to the next
        if (currentImageIndex + 1 < images.length) {
            this.setState({
                currentImageIndex: currentImageIndex + 1
            });
        }
    };

    /**
     * Sets breakpoints for column width based on containerWidth
     *
     * @int containerWidth The current width of the image grid
     */
    columnConfig = containerWidth => {
        let columns = 1;
        if (containerWidth >= 500) columns = 2;
        if (containerWidth >= 900) columns = 3;
        if (containerWidth >= 1500) columns = 4;

        return columns;
    };

    render() {
        const { currentImageIndex, lightboxIsOpen, clientSide } = this.state;
        const { images, galleryTitle, imageMasonryDirection } = this.props;

        return (
            <GalleryContainer>
                {clientSide && (
                    <Gallery
                        columns={this.columnConfig}
                        onClick={this.openLightbox}
                        photos={images}
                        margin={6}
                        direction={imageMasonryDirection}
                        renderImage={GridImage}
                    />
                )}
                <StyledLightbox
                    isOpen={lightboxIsOpen}
                    onClose={this.closeLightbox}
                    onPrev={this.gotoPrevious}
                    onNext={this.gotoNext}
                    images={images}
                    currentIndex={currentImageIndex}
                    galleryTitle={galleryTitle}
                    renderHeader={() => (
                        <LightboxHeader
                            galleryTitle={galleryTitle}
                            images={images}
                            currentIndex={currentImageIndex}
                            onClose={this.closeLightbox}
                        />
                    )}
                    renderPrevButton={({ canPrev }) => (
                        <LightboxArrowButton
                            position="left"
                            onClick={this.gotoPrevious}
                            disabled={!canPrev}
                        />
                    )}
                    renderNextButton={({ canNext }) => (
                        <LightboxArrowButton
                            position="right"
                            onClick={this.gotoNext}
                            disabled={!canNext}
                        />
                    )}
                    renderImageOverlay={() => (
                        <ImageOverlay
                            onClick={e => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                            }}
                        >
                            <p>Create your own UI</p>
                            <FiPrinter size="3em" />
                            <FiShare size="3em" />
                            <FiHeart size="3em" />
                        </ImageOverlay>
                    )}
                />
            </GalleryContainer>
        );
    }
}

export default BlogImageGallery;

const GalleryContainer = styled.section`
    overflow-y: auto;
    max-height: calc(100% - 4em);
    padding: 2em;
`;

const StyledLightbox = styled(Lightbox)`
    background: ${({ theme }) =>
        Color(theme.accentColor)
            .alpha(0.95)
            .hsl()
            .string()};
    * ::selection {
        background: ${({ theme }) => theme.pageContentSelectionColor};
    }
    * ::-moz-selection {
        background: ${({ theme }) =>
            new Color(theme.pageContentSelectionColor).darken(0.57).hex()};
    }
`;

const ImageOverlay = styled.div`
    position: absolute;
    top: 0%;
    right: 0%;
    border: ${({ theme }) => theme.pageContentSelectionColor} 1px solid;
    background: rgba(39, 39, 39, 0.5);
    p {
        color: ${({ theme }) => theme.pageContentSelectionColor};
        text-align: center;
        font-weight: bold;
        font-size: 1.2em;
        margin: 0.5em 0;
    }
    svg {
        border: white 1px solid;
        fill: ${({ theme }) => theme.pageContentSelectionColor};
        margin: 10px;
        padding: 5px;
        :hover {
            border: ${({ theme }) => theme.pageContentSelectionColor} 1px solid;
            fill: ${({ theme }) =>
                new Color(theme.pageContentSelectionColor).darken(0.57).hex()};
            cursor: pointer;
        }
    }
`;
