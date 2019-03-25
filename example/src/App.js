/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import styledNormalize from 'styled-normalize';
import Lightbox from 'react-spring-lightbox';

/**
 * A demo showcasing react-spring-lightbox
 */
export default class LightboxDemo extends React.Component {
  render() {
    return (
      <Container>
        {/* Adds some basic body styles */}
        <DefaultStyles />

        {/* The Lightbox component */}
        <Lightbox />
      </Container>
    );
  }
}

/**
 * Adds global styles and normalize.css to the entire app
 *
 * http://nicolasgallagher.com/about-normalize-css/
 * https://www.styled-components.com/docs/api#createglobalstyle
 */
const DefaultStyles = createGlobalStyle`
 ${styledNormalize}
 body {
   margin: 0;
   background: #1D1E1F;
   font-family: 'Montserrat', sans-serif;
   -ms-text-size-adjust: 100%;
   -webkit-text-size-adjust: 100%;
   -moz-osx-font-smoothing: grayscale;
   -webkit-font-smoothing: antialiased;
 }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  height: 100vh;
  user-select: none;
  overflow: hidden;
  background: #272727;
`;
