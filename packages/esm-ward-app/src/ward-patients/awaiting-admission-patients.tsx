import {
  DataTable, DataTableSkeleton, OverflowMenu, OverflowMenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableHeader, TableRow
} from '@carbon/react';
import { formatDatetime, launchWorkspace, parseDate, useAppContext } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WardPatient, WardPatientWorkspaceProps, WardViewContext } from '../types';
import { getOpenmrsId } from '../ward-view/ward-view.resource';
import AdmitPatientButton from '../ward-workspace/admit-patient-button.component';
import { EmptyState, ErrorState } from './table-state-components';

const AwaitingAdmissionPatients = () => {
  const { t } = useTranslation();
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { inpatientRequests, isLoading, error } = wardPatientGroupDetails?.inpatientRequestResponse ?? {};

  const headers = [
    { key: 'admissionDate', header: t('dateQueued', 'Date Queued') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('durationOnWard', 'Days In Queue') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const launchPatientTransferForm = (wardPatient: WardPatient) => {
    launchWorkspace<WardPatientWorkspaceProps>('patient-transfer-request-workspace', {
      wardPatient,
    });
  };

  const launchCancelAdmissionForm = (wardPatient: WardPatient) => {
    launchWorkspace<WardPatientWorkspaceProps>('cancel-admission-request-workspace', {
      wardPatient,
    });
  };
  const tableRows = useMemo(() => {
    return inpatientRequests?.map((request, index) => {
      const admissionDate = request.dispositionEncounter?.encounterDatetime
        ? formatDatetime(parseDate(request.dispositionEncounter?.encounterDatetime))
        : '--';
      const daysAdmitted = request.dispositionEncounter?.encounterDatetime
        ? dayjs()
            .startOf('day')
            .diff(dayjs(request.dispositionEncounter?.encounterDatetime).startOf('day'), 'days')
        : '--';
      const wardPatient = {
        patient: request.patient,
        visit: request.visit,
        bed: null,
        inpatientRequest: request,
        inpatientAdmission: null,
      };
      const isTransfer = wardPatient.inpatientRequest.dispositionType == 'TRANSFER';

      return {
        id: request?.patient?.uuid ?? index,
        admissionDate,
        idNumber: getOpenmrsId(request.patient?.identifiers ?? []) ?? '--',
        name: request?.patient?.person?.display ?? '--',
        gender: request?.patient?.person?.gender ?? '--',
        age: request?.patient?.person?.age ?? '--',
        bedNumber: '--',
        daysAdmitted,
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem
              itemText={
                isTransfer ? t('transferElsewhere', 'Transfer elsewhere') : t('admitElsewhere', 'Admit elsewhere')
              }
              onClick={() => launchPatientTransferForm(wardPatient)}
            />
            <AdmitPatientButton
              wardPatient={wardPatient}
              dispositionType={wardPatient.inpatientRequest.dispositionType}
              onAdmitPatientSuccess={() => {}}
              component="menu"
            />
            <OverflowMenuItem itemText={t('cancel', 'Cancel')} onClick={() => launchCancelAdmissionForm(wardPatient)} />
          </OverflowMenu>
        ),
      };
    });
  }, [inpatientRequests]);

  if (isLoading) return <DataTableSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!inpatientRequests || !inpatientRequests.length)
    return <EmptyState message={t('noPatientInAdmisionQueue', 'No patients in admission queue')} />;
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

export default AwaitingAdmissionPatients;
