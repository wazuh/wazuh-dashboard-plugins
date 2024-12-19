import React from 'react';
import { I18nProvider, FormattedMessage } from '@osd/i18n/react';

const IMAGE_TYPE_ALTERNATIVE = 'alternative'; // the value can not be imported

export const LoadingServerUserLogging = ({
  useLoadingLogo,
}: {
  useLoadingLogo: () => { url: string; type: string };
}) => {
  const imageSrc = useLoadingLogo();

  // Replicate platform loading based on https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.18.0/src/core/server/rendering/views/template.tsx#L137-L164
  return (
    <div
      className='osdWelcomeView'
      id='osd_loading_message'
      style={{ display: 'flex', width: '100%', height: 'calc(100vh - 48px)' }}
      data-test-subj='osdLoadingMessage'
    >
      <div className='osdLoaderWrap' data-test-subj='loadingLogo'>
        <div className='loadingLogoContainer'>
          <img
            className='loadingLogo'
            src={imageSrc.url}
            alt='Loading logo'
            data-test-subj={`${imageSrc.type}Logo`}
            data-test-image-url={imageSrc.url}
            loading='eager'
          />
        </div>
        <div className='osdWelcomeText'>
          <I18nProvider>
            <FormattedMessage
              id='core.ui.welcomeMessage'
              defaultMessage='Loading ...'
            />
          </I18nProvider>
        </div>
        {/* Show a progress bar if a static custom branded logo is used */}
        {imageSrc.type === IMAGE_TYPE_ALTERNATIVE && (
          <div className='osdProgress' />
        )}
      </div>
    </div>
  );
};
