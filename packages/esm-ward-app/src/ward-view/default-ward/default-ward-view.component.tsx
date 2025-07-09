import { useDefineAppContext } from '@openmrs/esm-framework';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useWardLocation from '../../hooks/useWardLocation';
import { useWardPatientGrouping } from '../../hooks/useWardPatientGrouping';
import { type WardViewContext } from '../../types';
import Filters from '../linelist-wards/Filters';
import Header from '../linelist-wards/Header';
import Metrics from '../linelist-wards/Metrics';
import WardViewContentWrapper from '../ward-view-content-wrapper';
import Ward from '../ward.component';
import DefaultWardBeds from './default-ward-beds.component';
import DefaultWardPatientCardHeader from './default-ward-patient-card-header.component';
import DefaultWardPendingPatients from './default-ward-pending-patients.component';
import DefaultWardUnassignedPatients from './default-ward-unassigned-patients.component';
import WardOccupancyTable from '../linelist-wards/WardOccupancyTable';

const DefaultWardView = () => {
  const { location } = useWardLocation();
  const { t } = useTranslation();
  const wardPatientGroupDetails = useWardPatientGrouping();
  const cards = useMemo(() => {
    return [
      { label: t('awaitingAdmission', 'Awaiting Admission'), value: '40' },
      { label: t('admitted', 'Admitted'), value: '150' },
      { label: t('dischargIn', 'Discaharg In'), value: '20' },
      { label: t('discharge', 'Discharge'), value: '50%' },
    ];
  }, [t]);
  useDefineAppContext<WardViewContext>('ward-view-context', {
    wardPatientGroupDetails,
    WardPatientHeader: DefaultWardPatientCardHeader,
  });

  const wardBeds = <DefaultWardBeds />;
  const wardUnassignedPatients = <DefaultWardUnassignedPatients />;
  const wardPendingPatients = <DefaultWardPendingPatients />;

  return (
    <>
      <Header title={location.display} />
      <Filters />
      <Metrics metrics={cards} />
      {/* <WardViewHeader {...{ wardPendingPatients }} /> */}
      <WardViewContentWrapper
        cardView={<Ward {...{ wardBeds, wardUnassignedPatients }} />}
        tableView={<WardOccupancyTable />}
      />
    </>
  );
};

export default DefaultWardView;
