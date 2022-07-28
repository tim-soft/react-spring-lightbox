import React from 'react';
import ReactDOM from 'react-dom';

type ICreatePortal = {
    children: React.ReactNode;
};

/**
 * Creates a SSR + next.js friendly React Portal inside <body />
 *
 * Child components are rendered on the client side only

 * @see https://reactjs.org/docs/portals.html
 */
class CreatePortal extends React.Component<ICreatePortal> {
    portalContainer: HTMLDivElement;
    body: HTMLElement;

    // Only executes on the client-side
    componentDidMount() {
        // Get the document body
        this.body = document.body;

        // Create a container <div /> for React Portal
        this.portalContainer = document.createElement('div');
        this.portalContainer.setAttribute('class', 'lightbox-portal');

        // Append the container to the document body
        this.body.appendChild(this.portalContainer);

        // Force a re-render as we're on the client side now
        // children prop will render to portalContainer
        this.forceUpdate();

        // Add event listener to prevent trackpad/ctrl+mousewheel zooming of lightbox
        // Zooming is handled specifically within /ImageStage/components/Image
        this.portalContainer.addEventListener('wheel', this.preventWheel);
    }

    componentWillUnmount() {
        // Remove wheel event listener
        this.portalContainer.removeEventListener('wheel', this.preventWheel);

        // Cleanup Portal from DOM
        this.body.removeChild(this.portalContainer);
    }

    preventWheel = (e: WheelEvent) => e.preventDefault();

    render() {
        // Return null during SSR
        if (this.portalContainer === undefined) return null;

        const { children } = this.props;

        return <>{ReactDOM.createPortal(children, this.portalContainer)}</>;
    }
}

export default CreatePortal;
