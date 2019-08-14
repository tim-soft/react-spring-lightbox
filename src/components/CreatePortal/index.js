import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Creates a SSR + next.js friendly React Portal inside <body />
 *
 * Child components are rendered on the client side only
 *
 * @param {array|node} children Child components will be rendered to the portal
 * @see https://reactjs.org/docs/portals.html
 */
export default class CreatePortal extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.element
    ]).isRequired
  };

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
    this.portalContainer.addEventListener('wheel', e => e.preventDefault());
  }

  componentWillUnmount() {
    // Remove wheel event listener
    this.portalContainer.removeEventListener('wheel', e => e.preventDefault());

    // Cleanup Portal from DOM
    this.body.removeChild(this.portalContainer);
  }

  render() {
    // Return null during SSR
    if (this.portalContainer === undefined) return null;

    const { children } = this.props;

    return ReactDOM.createPortal(children, this.portalContainer);
  }
}
