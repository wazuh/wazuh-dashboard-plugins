import React, { useEffect, useState } from 'react';
import { EuiButtonEmpty, EuiSpacer } from '@elastic/eui';
import { UseFormReturn } from '../../../../common/form/types';

type FormField = UseFormReturn['fields'][string] | undefined;

interface AdvancedOptionsProps {
  /* The fields the section holds. They decide whether it starts open, and the
  content is only mounted while it is: a collapsed section is not somewhere the
  operator can be expected to look. */
  fields: FormField[];
  children: React.ReactNode;
}

const fieldHasValue = (field: FormField) =>
  String(field?.value ?? '').trim().length > 0;

const fieldHasError = (field: FormField) => Boolean(field?.error);

/**
 * A step's optional inputs, folded away behind a link so the common path is
 * the short one.
 *
 * What is folded away is still in effect, so the section opens itself rather
 * than hiding something the operator has not seen: a value already in one of
 * the fields -- the endpoint's port and path prefix arrive from the app
 * configuration -- opens it on arrival, and an error opens it whenever one
 * appears, since an error that cannot be seen cannot be corrected and the
 * deployment commands stay blocked until it is.
 */
const AdvancedOptions = ({ fields, children }: AdvancedOptionsProps) => {
  const sectionHasError = fields.some(fieldHasError);
  const [isOpen, setIsOpen] = useState(
    () => fields.some(fieldHasValue) || sectionHasError,
  );

  useEffect(() => {
    if (sectionHasError) {
      setIsOpen(true);
    }
  }, [sectionHasError]);

  return (
    <>
      <EuiButtonEmpty
        size='xs'
        flush='left'
        iconType={isOpen ? 'arrowDown' : 'arrowRight'}
        iconSide='left'
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
      >
        {isOpen ? 'Hide advanced options' : 'View advanced options'}
      </EuiButtonEmpty>
      {isOpen ? (
        <>
          <EuiSpacer size='s' />
          {children}
        </>
      ) : null}
    </>
  );
};

export default AdvancedOptions;
