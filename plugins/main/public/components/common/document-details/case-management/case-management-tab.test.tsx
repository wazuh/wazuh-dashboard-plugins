import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CaseManagementTab } from './case-management-tab';
import { CaseData, getFindingsCase } from './case-management-service';

jest.mock('../../../../react-services/generic-request', () => ({
  GenericRequest: { request: jest.fn() },
}));

jest.mock('./case-management-service', () => ({
  ...jest.requireActual('./case-management-service'),
  getFindingsCase: jest.fn(),
  updateDocumentCase: jest.fn(),
  cleanDocumentCase: jest.fn(),
}));

jest.mock('../../../../react-services', () => ({
  formatUIDate: (date: string) => date,
}));

jest.mock('../../../../kibana-services', () => ({
  getToasts: () => ({ add: jest.fn() }),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const documentRef = { _index: 'wazuh-findings-v5-security', _id: 'doc-1' };

const fullCase: CaseData = {
  title: 'a title',
  description: 'a description',
  status: 'active',
  severity: 'high',
  priority: 'urgent',
  tlp: 'TLP:AMBER',
  tags: ['one'],
  comments: [],
  created_at: '2026-06-30T08:00:00.000Z',
  updated_at: '2026-06-30T08:00:00.000Z',
  user: { name: 'admin' },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CaseManagementTab required fields', () => {
  it('create: enables the save button only when status, title and severity are set', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: null,
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    const createButton = await screen.findByRole('button', {
      name: 'Create case',
    });
    expect(screen.getByLabelText('Case title')).toHaveValue('Case_doc-1');
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case status'), {
      target: { value: 'active' },
    });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case severity'), {
      target: { value: 'high' },
    });
    expect(createButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Case title'), {
      target: { value: '   ' },
    });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case title'), {
      target: { value: 'my case' },
    });
    expect(createButton).toBeEnabled();
  });

  it('edit: keeps the save button disabled until dirty and while a required field is blank', async () => {
    (getFindingsCase as jest.Mock).mockResolvedValue({
      case: fullCase,
      username: 'admin',
    });

    render(<CaseManagementTab document={documentRef} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));

    const updateButton = screen.getByRole('button', { name: 'Update case' });
    expect(updateButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Case severity'), {
      target: { value: 'critical' },
    });
    expect(updateButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText('Case title'), {
      target: { value: '' },
    });
    expect(updateButton).toBeDisabled();
  });
});
