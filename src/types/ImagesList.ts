export type ImagesListItem = Omit<
    React.HTMLProps<HTMLImageElement>,
    'draggable' | 'onClick' | 'onDragStart' | 'ref'
> & {
    alt: string;
    aspectRatio?: string; // Optional aspect ratio override for videos
    loading?: 'auto' | 'eager' | 'lazy';
    src: string;
    type?: 'image' | 'video'; // Optional type field, defaults to 'image' if not specified
    videoId?: string; // Optional YouTube video ID
};

export type ImagesList = ImagesListItem[];
