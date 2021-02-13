export type ImagesListItem = Omit<
    React.HTMLProps<HTMLImageElement>,
    'draggable' | 'onClick' | 'onDragStart' | 'ref'
> & { alt: string; loading?: 'auto' | 'eager' | 'lazy'; src: string };

export type ImagesList = ImagesListItem[];
