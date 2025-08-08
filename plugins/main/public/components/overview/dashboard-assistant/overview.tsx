import React, { useState } from 'react';
import { EuiPanel, EuiGlobalToastList } from '@elastic/eui';
import { ModelsTable } from './components';

const toastConfig = {
  lifeTimeMs: 6000,
  successToast: {
    title: 'Deployment completed',
    color: 'success' as const,
    text: 'The dashboard assistant has been configured correctly and is ready to use.',
    iconType: 'check',
  },
};

export const AssistantOverview = () => {
  const [toasts, setToasts] = useState<any[]>([]);

  const removeToast = (removedToast: any) => {
    setToasts(toasts.filter(toast => toast.id !== removedToast.id));
  };

  return (
    <div style={{ padding: '24px' }}>
      <EuiPanel>
        <ModelsTable onAddModel />
      </EuiPanel>
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={removeToast}
        toastLifeTimeMs={toastConfig.lifeTimeMs}
      />
    </div>
  );
};
