import { useDefineAppContext } from '@openmrs/esm-framework';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWardSummaryMetrics } from '../../hooks/useSummaryMetrics';
import useWardLocation from '../../hooks/useWardLocation';
import { useWardPatientGrouping } from '../../hooks/useWardPatientGrouping';
import { type WardViewContext } from '../../types';
import WardPatientsTable from '../../ward-patients/ward-patients-table';
import Filters from '../linelist-wards/Filters';
import Header from '../linelist-wards/Header';
import Metrics from '../linelist-wards/Metrics';
import WardViewContentWrapper from '../ward-view-content-wrapper';
import Ward from '../ward.component';
import DefaultWardBeds from './default-ward-beds.component';
import DefaultWardPatientCardHeader from './default-ward-patient-card-header.component';
import DefaultWardPendingPatients from './default-ward-pending-patients.component';
import DefaultWardUnassignedPatients from './default-ward-unassigned-patients.component';

const DefaultWardView = () => {
  const { location } = useWardLocation();
  const { t } = useTranslation();
  const wardPatientGroupDetails = useWardPatientGrouping();
  const summary = useWardSummaryMetrics();
  useDefineAppContext<WardViewContext>('ward-view-context', {
    wardPatientGroupDetails,
    WardPatientHeader: DefaultWardPatientCardHeader,
  });
  const cards = useMemo(() => {
    return [
      {
        label: t('awaitingAdmission', 'Awaiting Admission'),
        value: `${summary.awaitingAdmissionPatient}`,
      },
      { label: t('admitted', 'Admitted'), value: `${summary.admittedPatients}` },
      { label: t('dischargIn', 'Discaharg In'), value: `${summary.dischargeInPatients}` },
      { label: t('discharge', 'Discharge'), value: `${summary.dischargedPatients}` },
    ];
  }, [t, summary]);
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
        tableView={<WardPatientsTable />}
      />
    </>
  );
};

export default DefaultWardView;
