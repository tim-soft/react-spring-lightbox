export type ImagesListItem = Omit<
    React.HTMLProps<HTMLImageElement>,
    'draggable' | 'onClick' | 'onDragStart' | 'ref'
> & { alt: string; src: string };

export type ImagesList = ImagesListItem[];
