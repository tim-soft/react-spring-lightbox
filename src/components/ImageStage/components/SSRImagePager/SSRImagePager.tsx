import type { ImagesList } from '../../../../types/ImagesList';
import * as React from 'react';

type ISSRImagePagerProps = {
    currentIndex: number;
    images: ImagesList;
};

const SSRImagePager = ({ currentIndex, images }: ISSRImagePagerProps) => {
    return (
        <div style={{ height: 'inherit', width: '100%' }}>
            {images.map(({ alt, src }, i) => {
                const isCurrentImage = i === currentIndex;
                return (
                    <img
                        alt={alt}
                        key={`${alt}-${src}-${i}`}
                        src={src}
                        style={{
                            ...(!isCurrentImage && {
                                display: 'none',
                                visibility: 'hidden',
                            }),
                            height: '100%',
                            objectFit: 'contain',
                            width: '100%',
                        }}
                    />
                );
            })}
        </div>
    );
};

export default SSRImagePager;
