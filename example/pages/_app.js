import App from 'next/app';
import React from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import styledNormalize from 'styled-normalize';

export default class MyApp extends App {
    render() {
        const { Component, pageProps } = this.props;
        return (
            <>
                {/* Adds some basic body styles */}
                <DefaultStyles />

                <ThemeProvider
                    theme={{
                        pageBackgroundColor: '#101010',
                        pageContentFontColor: '#e2e5ec',
                        pageContentLinkHoverColor: 'aquamarine',
                        pageContentSelectionColor: 'aquamarine',
                        headerNavFontColor: '#e2e5ec',
                        accentColor: '#1f1f1f'
                    }}
                >
                    <Component {...pageProps} />
                </ThemeProvider>
            </>
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
