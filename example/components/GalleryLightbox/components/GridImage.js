import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * A single image element in a masonry style image grid
 */
const GridImage = ({ key, index, left, top, photo, onClick }) => {
  const { height, width, src, alt, caption } = photo;
  return (
    <ImageContainer
      key={key}
      index={index}
      onClick={e => onClick(e, { index })}
      style={{ left, top, height, width }}
    >
      <OverlayContainer>
        <Image src={src} alt={alt} caption={caption} />
        <Caption>
          <h4>{caption}</h4>
        </Caption>
      </OverlayContainer>
    </ImageContainer>
  );
};

GridImage.propTypes = {
  key: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  photo: PropTypes.shape({
    alt: PropTypes.string.isRequired,
    caption: PropTypes.string.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    src: PropTypes.string.isRequired
  }).isRequired
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
