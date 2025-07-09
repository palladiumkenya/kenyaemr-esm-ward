import { OverflowMenuItem } from '@carbon/react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@carbon/react';
import { OverflowMenu } from '@carbon/react';
import { formatDatetime, formatPartialDate, parseDate, useAppContext } from '@openmrs/esm-framework';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WardViewContext } from '../types';
import { DataTableSkeleton } from '@carbon/react';
import { EmptyState, ErrorState } from './table-state-components';
import { getOpenmrsId } from '../ward-view/ward-view.resource';
import dayjs from 'dayjs';

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
              itemText={t('queueToAnother', 'Queue to another')}
              //   onClick={() => handleClaimAction(row.id, 'retry')}
            />
            <OverflowMenuItem
              itemText={t('admitPatient', 'Admit Patient')}
              //   onClick={() => handleClaimAction(row.id, 'update')}
            />
            <OverflowMenuItem
              itemText={t('cancel', 'Cancel')}
              //   onClick={() => handleClaimAction(row.id, 'update')}
            />
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
