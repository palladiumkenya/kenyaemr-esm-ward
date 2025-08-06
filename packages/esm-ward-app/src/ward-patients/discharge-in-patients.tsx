import {
  DataTable,
  OverflowMenu,
  OverflowMenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import {
  type Encounter,
  formatDatetime,
  parseDate,
  useAppContext,
  useConfig,
  useEmrConfiguration,
  usePagination,
} from '@openmrs/esm-framework';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type WardConfigObject } from '../config-schema';
import { type WardPatient, type WardViewContext } from '../types';
import { bedLayoutToBed, getOpenmrsId } from '../ward-view/ward-view.resource';
import { usePatientDischarge } from '../ward-workspace/kenya-emr-patient-discharge/patient-discharge.resource';
import { HyperLinkPatientCell, PatientBillStatus, UnAssignPatientBedAction } from './patient-cells';
import { EmptyState } from './table-state-components';

const DischargeInPatients = () => {
  const { t } = useTranslation();
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { bedLayouts, wardAdmittedPatientsWithBed, isLoading } = wardPatientGroupDetails ?? {};
  //TODO remove (added for demo purposes)
  const { emrConfiguration, isLoadingEmrConfiguration, errorFetchingEmrConfiguration } = useEmrConfiguration();
  const { handleDischarge } = usePatientDischarge();

  const config = useConfig<WardConfigObject>();
  const headers = [
    { key: 'admissionDate', header: t('admissionDate', 'Admission Date') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('durationOnWard', 'Duration on Ward') },
    { key: 'billStatus', header: t('billStatus', 'Bill Status') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const patients = useMemo(() => {
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
      const ipdDischargeEncounter = pat?.visit?.encounters?.find(
        (encounter) => encounter.encounterType?.uuid === config.ipdDischargeEncounterTypeUuid,
      );
      if (!ipdDischargeEncounter) return false;
      return true;
    });
  }, [bedLayouts, wardAdmittedPatientsWithBed, config]);

  const [pageSize, setPageSize] = useState(5);
  const { paginated, results, totalPages, currentPage, goTo } = usePagination(patients, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, totalPages, currentPage, results.length);

  const tableRows = useMemo(() => {
    return results.map((patient, index) => {
      const { encounterAssigningToCurrentInpatientLocation, visit } = patient.inpatientAdmission ?? {};

      const admissionDate = encounterAssigningToCurrentInpatientLocation?.encounterDatetime
        ? formatDatetime(parseDate(encounterAssigningToCurrentInpatientLocation!.encounterDatetime!))
        : '--';
      const daysAdmitted = encounterAssigningToCurrentInpatientLocation?.encounterDatetime
        ? dayjs(encounterAssigningToCurrentInpatientLocation?.encounterDatetime).diff(dayjs(), 'days')
        : '--';

      // TODO Debug why visit for some patient ainit available

      return {
        id: patient.patient?.uuid ?? index,
        admissionDate,
        idNumber: getOpenmrsId(patient.patient?.identifiers ?? []) ?? '--',
        name: (
          <HyperLinkPatientCell patientName={patient.patient?.person?.display} patientUuid={patient.patient?.uuid} />
        ),
        gender: patient.patient?.person?.gender ?? '--',
        age: patient.patient?.person?.age ?? '--',
        bedNumber: patient.bed?.bedNumber ?? '--',
        daysAdmitted,
        billStatus: (
          <PatientBillStatus
            patientUuid={patient.patient.uuid}
            encounterUuid={encounterAssigningToCurrentInpatientLocation?.uuid}
          />
        ),
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem itemText={t('goToBilling', 'Go to Billing')} onClick={() => {}} />
            <OverflowMenuItem itemText={t('waivePatient', 'Waive Patient')} onClick={() => {}} />
            <OverflowMenuItem itemText={t('patientAbscondend', 'Patient Absconded')} onClick={() => {}} />
            <UnAssignPatientBedAction
              patientUuid={patient.patient.uuid}
              encounterUuid={encounterAssigningToCurrentInpatientLocation?.uuid}
              loading={wardPatientGroupDetails?.admissionLocationResponse?.isLoading}
              onClick={async () => {
                await handleDischarge(
                  {} as Encounter,
                  patient,
                  emrConfiguration as Record<string, any>,
                  patient.visit,
                  wardPatientGroupDetails?.admissionLocationResponse?.admissionLocation?.ward,
                );
              }}
            />
          </OverflowMenu>
        ),
      };
    });
  }, [results, t, emrConfiguration, handleDischarge, wardPatientGroupDetails]);

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
          {paginated && !isLoading && (
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              pageSizes={pageSizes}
              totalItems={(patients ?? []).length}
              onChange={({ page, pageSize }) => {
                goTo(page);
                setPageSize(pageSize);
              }}
            />
          )}
        </TableContainer>
      )}
    </DataTable>
  );
};

export default DischargeInPatients;
