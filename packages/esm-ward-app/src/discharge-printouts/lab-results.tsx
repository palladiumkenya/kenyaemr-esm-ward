import { InlineLoading, InlineNotification } from '@carbon/react';
import type { Order } from '@openmrs/esm-patient-common-lib';
import React, { type FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Encounter } from '../types';
import { getObservationDisplayValue, useOrderConceptByUuid } from './discharge-printout.resource';
import styles from './discharge-printouts.scss';
type LabResultsProps = {
  order: Order;
  labEncounter?: Encounter;
};

const LabResults: FC<LabResultsProps> = ({ order, labEncounter: encounter }) => {
  const { concept, isLoading: isLoadingTestConcepts, error } = useOrderConceptByUuid(order?.concept?.uuid);
  const testResultObs = useMemo(() => {
    if (!encounter || !concept) return null;
    return encounter.obs?.find((obs) => obs.concept.uuid === concept.uuid);
  }, [concept, encounter]);
  const { t } = useTranslation();
  const EMPTY_TEXT = t('noResults', 'No results');

  const testResults = useMemo(() => {
    if (!concept) return [];

    // For panel tests (with set members)
    if (concept.setMembers && concept.setMembers.length > 0) {
      return concept.setMembers.map((memberConcept) => {
        const memberObs = testResultObs?.groupMembers?.find((obs) => obs.concept.uuid === memberConcept.uuid);
        let resultValue: string;
        if (memberObs) {
          resultValue = getObservationDisplayValue(memberObs.value ?? (memberObs as any));
        } else {
          resultValue = EMPTY_TEXT;
        }

        return {
          id: memberConcept.uuid,
          testType: memberConcept.display || EMPTY_TEXT,
          result: resultValue,
          normalRange:
            memberConcept.hiNormal && memberConcept.lowNormal
              ? `${memberConcept.lowNormal} - ${memberConcept.hiNormal}`
              : 'N/A',
        };
      });
    }

    // For single tests (no set members)
    let resultValue: string;
    if (testResultObs) {
      resultValue = getObservationDisplayValue(testResultObs.value ?? (testResultObs as any));
    } else {
      resultValue = EMPTY_TEXT;
    }

    return [
      {
        id: concept.uuid,
        testType: concept.display || EMPTY_TEXT,
        result: resultValue,
        normalRange: concept.hiNormal && concept.lowNormal ? `${concept.lowNormal} - ${concept.hiNormal}` : 'N/A',
      },
    ];
  }, [concept, testResultObs, EMPTY_TEXT]);

  if (isLoadingTestConcepts)
    return (
      <InlineLoading
        status="active"
        iconDescription="Loading"
        description={t('loadinglabresults', 'Loading lab results') + '...'}
      />
    );

  if (error)
    return (
      <InlineNotification
        kind="error"
        title={t('labResultError', 'Error loading lab results')}
        subtitle={error?.message}
      />
    );

  return (
    <p key={order.uuid} className={styles.txtTitle}>
      {testResults.map((res) => (
        <React.Fragment key={res.id}>
          <strong>{res.testType.toLowerCase()}: </strong>
          <span>{res.result}</span>
          {res.result !== EMPTY_TEXT && <span>({res.normalRange})</span>}
        </React.Fragment>
      ))}
    </p>
  );
};

export default LabResults;
