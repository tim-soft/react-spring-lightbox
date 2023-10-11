import styled, { css } from 'styled-components';
import * as React from 'react';

type ISSRImagePagerProps = {
    currentIndex: number;
    images: React.ReactNode[];
};

const SSRImagePager = ({ currentIndex, images }: ISSRImagePagerProps) => {
    return (
        <ImagePagerContainer>
            {images.map((el, i) => {
                return (
                    <PageContainer $isCurrentPage={i === currentIndex} key={i}>
                        {el}
                    </PageContainer>
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

const PageContainer = styled.div<{ $isCurrentPage: boolean }>`
    ${({ $isCurrentPage }) =>
        !$isCurrentPage &&
        css`
            visibility: hidden;
            display: none;
        `}
    height:100%;
    width: 100%;
    object-fit: contain;
`;
