import type { ImagesList } from '../../../../types/ImagesList';
import styled, { css } from 'styled-components';
import * as React from 'react';

type ISSRImagePagerProps = {
    currentIndex: number;
    images: ImagesList;
};

const SSRImagePager = ({ currentIndex, images }: ISSRImagePagerProps) => {
    return (
        <ImagePagerContainer>
            {images.map(({ alt, src }, i) => {
                return (
                    <Image
                        $isCurrentImage={i === currentIndex}
                        alt={alt}
                        key={`${alt}-${src}-${i}`}
                        src={src}
                    />
                );
            })}
        </ImagePagerContainer>
    );
};

export default SSRImagePager;

const ImagePagerContainer = styled.div`
    width: 100%;
    height: inherit;
`;

const Image = styled.img<{ $isCurrentImage: boolean }>`
    ${({ $isCurrentImage }) =>
        !$isCurrentImage &&
        css`
            visibility: hidden;
            display: none;
        `}
    height:100%;
    width: 100%;
    object-fit: contain;
`;
