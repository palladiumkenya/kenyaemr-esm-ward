import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import React from 'react';
import AdmissionRequest from './admission-request.component';
import { useTranslation } from 'react-i18next';
import InpatientDetailView from './inpatient-detail-view.component';

type InPatientProps = {
  patientUuid: string;
  patient: fhir.Patient;
};

const InPatient: React.FC<InPatientProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  return (
    <Tabs>
      <TabList contained>
        <Tab>{t('admissionRequests', 'Admission Requests')}</Tab>
        <Tab>{t('inpatientDetails', 'Inpatient Detail')}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <AdmissionRequest patientUuid={patientUuid} />
        </TabPanel>
        <TabPanel>
          <InpatientDetailView patientUuid={patientUuid} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default InPatient;
