import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * A single image element in a masonry style image grid
 */
const GridImage = ({ index, key, left, onClick, photo, top }) => {
    const { alt, caption, height, src, width } = photo;
    return (
        <ImageContainer
            index={index}
            key={`${key}-${index}`}
            onClick={(e) => onClick(e, { index })}
            style={{ height, left, top, width }}
        >
            <OverlayContainer>
                <Image alt={alt} caption={caption} src={src} />
                <Caption>
                    <h4>{caption}</h4>
                </Caption>
            </OverlayContainer>
        </ImageContainer>
    );
};

GridImage.propTypes = {
    containerHeight: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    key: PropTypes.string.isRequired,
    left: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    photo: PropTypes.shape({
        alt: PropTypes.string.isRequired,
        caption: PropTypes.string.isRequired,
        height: PropTypes.number.isRequired,
        src: PropTypes.string.isRequired,
        width: PropTypes.number.isRequired,
    }).isRequired,
    top: PropTypes.number.isRequired,
};

export default GridImage;

const Caption = styled.div`
    position: absolute;
    bottom: 0;
    width: 100%;
    background-color: ${({ theme }) => theme.accentColor};
    color: ${({ theme }) => theme.pageContentLinkHoverColor};
    h4 {
        text-align: center;
        margin: 1em 0;
    }
`;

const OverlayContainer = styled.div`
    position: relative;
    height: 100%;
    overflow: hidden;
`;

const ImageContainer = styled.div`
    display: block;
    position: absolute;
    cursor: pointer;
    border-width: 2px;
    border-color: transparent;
    border-style: solid;
    :hover {
        border-color: ${({ theme }) => theme.pageContentLinkHoverColor};
    }
`;

const Image = styled.img`
    width: inherit;
    height: inherit;
    position: absolute;
`;
