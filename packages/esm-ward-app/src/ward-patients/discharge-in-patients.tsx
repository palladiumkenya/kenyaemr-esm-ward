import {
  OverflowMenu,
  OverflowMenuItem,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './table-state-components';
import { formatDatetime, launchWorkspace, parseDate, useAppContext } from '@openmrs/esm-framework';
import { WardPatient, WardViewContext } from '../types';
import { bedLayoutToBed, getOpenmrsId } from '../ward-view/ward-view.resource';
import dayjs from 'dayjs';

const DischargeInPatients = () => {
  const { t } = useTranslation();
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { bedLayouts, wardAdmittedPatientsWithBed, isLoading } = wardPatientGroupDetails ?? {};

  const headers = [
    { key: 'admissionDate', header: t('admissionDate', 'Admission Date') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('durationOnWard', 'Duration on Ward') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const patients = useMemo(() => {
    const DOCTORE_VISIT_ENCOUNTER_TYPE = '14b36860-5033-4765-b91b-ace856ab64c2';

    return (
      bedLayouts
        ?.map((bedLayout) => {
          const { patients } = bedLayout;
          const bed = bedLayoutToBed(bedLayout);
          const wardPatients: WardPatient[] = patients.map((patient): WardPatient => {
            const inpatientAdmission = wardAdmittedPatientsWithBed?.get(patient.uuid);
            if (inpatientAdmission) {
              const { patient, visit, currentInpatientRequest } = inpatientAdmission;
              return { patient, visit, bed, inpatientAdmission, inpatientRequest: currentInpatientRequest || null };
            } else {
              // for some reason this patient is in a bed but not in the list of admitted patients, so we need to use the patient data from the bed endpoint
              return {
                patient: patient,
                visit: null,
                bed,
                inpatientAdmission: null, // populate after BED-13
                inpatientRequest: null,
              };
            }
          });
          return wardPatients;
        })
        ?.flat() ?? []
    ).filter((pat) => {
      const noteEncounter = pat?.visit?.encounters?.find(
        (encounter) => encounter.encounterType?.uuid === DOCTORE_VISIT_ENCOUNTER_TYPE,
      );
      if (!noteEncounter) return false;
      return true;
    });
  }, [bedLayouts, wardAdmittedPatientsWithBed]);
  const tableRows = useMemo(() => {
    return patients.map((patient, index) => {
      const { encounterAssigningToCurrentInpatientLocation } = patient.inpatientAdmission ?? {};

      const admissionDate = encounterAssigningToCurrentInpatientLocation?.encounterDatetime
        ? formatDatetime(parseDate(encounterAssigningToCurrentInpatientLocation!.encounterDatetime!))
        : '--';
      const daysAdmitted = encounterAssigningToCurrentInpatientLocation?.encounterDatetime
        ? dayjs(encounterAssigningToCurrentInpatientLocation?.encounterDatetime).diff(dayjs(), 'days')
        : '--';
      return {
        id: patient.patient?.uuid ?? index,
        admissionDate,
        idNumber: getOpenmrsId(patient.patient?.identifiers ?? []) ?? '--',
        name: patient.patient?.person?.display ?? '--',
        gender: patient.patient?.person?.gender ?? '--',
        age: patient.patient?.person?.age ?? '--',
        bedNumber: patient.bed?.bedNumber ?? '--',
        daysAdmitted,
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem itemText={t('goToBilling', 'Go to Billing')} onClick={() => {}} />
            <OverflowMenuItem itemText={t('waivePatient', 'Waive Patient')} onClick={() => {}} />
            <OverflowMenuItem itemText={t('patientAbscondend', 'Patient Absconded')} onClick={() => {}} />
            <OverflowMenuItem
              itemText={t('discharge', 'Discharge')}
              onClick={() => {
                const IN_PATIENT_DISCHARGE_FORM_UUID = '98a781d2-b777-4756-b4c9-c9b0deb3483c';
                launchWorkspace('patient-discharge-workspace', {
                  wardPatient: patient,
                  patientUuid: patient.patient.uuid,
                  formUuid: IN_PATIENT_DISCHARGE_FORM_UUID,
                });
              }}
            />
          </OverflowMenu>
        ),
      };
    });
  }, [patients]);

  if (!patients.length) return <EmptyState message={t('noDischargeInpatients', 'No Discharge in patients')} />;

  return (
    <DataTable rows={tableRows} headers={headers} isSortable useZebraStyles>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getCellProps }) => (
        <TableContainer>
          <Table {...getTableProps()} aria-label="sample table">
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader
                    key={header.key}
                    {...getHeaderProps({
                      header,
                    })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                return (
                  <TableRow key={row.id} {...getRowProps({ row })}>
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id} {...getCellProps({ cell })}>
                        {cell.value}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {/* {paginated && !isLoading && (
               <Pagination
                 forwardText=""
                 backwardText=""
                 page={currentPage}
                 pageSize={currPageSize}
                 pageSizes={pageSizes}
                 totalItems={totalCount}
                 size={'sm'}
                 onChange={({ page: newPage, pageSize }) => {
                   if (newPage !== currentPage) {
                     goTo(newPage);
                   }
                   setCurrPageSize(pageSize);
                 }}
               />
             )} */}
        </TableContainer>
      )}
    </DataTable>
  );
};

export default DischargeInPatients;
