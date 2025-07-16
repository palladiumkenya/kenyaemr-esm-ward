import {
  DataTable,
  DataTableSkeleton,
  OverflowMenu,
  OverflowMenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
} from '@carbon/react';
import {
  formatDatetime,
  launchWorkspace,
  type OpenmrsResource,
  parseDate,
  useAppContext,
  useConfig,
  usePagination,
} from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type WardPatient, type WardViewContext } from '../types';
import { bedLayoutToBed, getOpenmrsId } from '../ward-view/ward-view.resource';
import { EmptyState } from './table-state-components';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import { type WardConfigObject } from '../config-schema';
import { HyperLinkPatientCell } from './patient-cells';
const AdmittedPatients = () => {
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { bedLayouts, wardAdmittedPatientsWithBed, isLoading } = wardPatientGroupDetails ?? {};
  const { t } = useTranslation();
  const config = useConfig<WardConfigObject>();
  const headers = [
    { key: 'admissionDate', header: t('admissionDate', 'Admission Date') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('daysInWard', 'Days In Ward') },
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
      if (!ipdDischargeEncounter) return true;
      return false;
      // const obs = ipdDischargeEncounter.obs.find((ob) => ob.concept.uuid === config.referralsConceptUuid);
      // if (!obs) return true;
      // const isDischargedIn = [config.referringToAnotherFacilityConceptUuid, config.dischargeHomeConceptUuid].includes(
      //   (obs.value as OpenmrsResource).uuid,
      // );
      // return isDischargedIn === false;
    });
  }, [bedLayouts, wardAdmittedPatientsWithBed, config]);

  const [pageSize, setPageSize] = useState(5);
  const { paginated, results, totalPages, currentPage, goTo } = usePagination(patients, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, totalPages, currentPage, results.length);
  const tableRows = useMemo(() => {
    return results.map((patient, index) => {
      const { encounterAssigningToCurrentInpatientLocation } = patient.inpatientAdmission ?? {};

      const admissionDate = encounterAssigningToCurrentInpatientLocation?.encounterDatetime
        ? formatDatetime(parseDate(encounterAssigningToCurrentInpatientLocation!.encounterDatetime!))
        : '--';
      const encounterDate = encounterAssigningToCurrentInpatientLocation?.encounterDatetime;
      const daysAdmitted =
        encounterDate && dayjs(encounterDate).isValid()
          ? Math.abs(dayjs().startOf('day').diff(dayjs(encounterDate).startOf('day'), 'days'))
          : '--';

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
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem
              itemText={t('tranfer', 'Tranfer')}
              onClick={() =>
                launchWorkspace('patient-transfer-swap-workspace', {
                  workspaceTitle: 'Trasfer',
                  wardPatient: patient,
                  withContentSwitcher: false,
                  defaultTransfersection: 'transfer',
                })
              }
            />
            <OverflowMenuItem
              itemText={t('bedSwap', 'Bed Swap')}
              onClick={() =>
                launchWorkspace('patient-transfer-swap-workspace', {
                  workspaceTitle: 'Bed Swap',
                  wardPatient: patient,
                  withContentSwitcher: false,
                  defaultTransfersection: 'bed-swap',
                })
              }
            />
            <OverflowMenuItem
              itemText={t('discharge', 'Discharge')}
              onClick={() => {
                launchWorkspace('patient-discharge-workspace', {
                  wardPatient: patient,
                  patientUuid: patient.patient.uuid,
                  formUuid: config.inpatientDischargeFormUuid,
                  dischargePatientOnSuccesfullSubmission: false,
                });
              }}
            />
          </OverflowMenu>
        ),
      };
    });
  }, [results, config, t]);

  if (isLoading) return <DataTableSkeleton />;
  if (!patients.length)
    return <EmptyState message={t('noAdmittedPatientsinCurrentward', 'No admitted patients in the current ward')} />;

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

export default AdmittedPatients;
