import {
  DataTable,
  DataTableSkeleton,
  Layer,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
} from '@carbon/react';
import { ConfigurableLink, ErrorState, useConfig } from '@openmrs/esm-framework';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { useTranslation } from 'react-i18next';
import React, { useMemo } from 'react';
import { useAdmisiionLocations } from '../../hooks/useAdmissionLocation';
import styles from './linelist-wards.scss';

import { type AdmissionLocationFetchResponse } from '../../types';
import { EmptyState } from '../../ward-patients/table-state-components';
import WardPendingOutCell from './WardPendingOutCell';
import { type WardConfigObject } from '../../config-schema';

const LineListTable = () => {
  const {
    admissionLocations,
    error,
    isLoading,
    paginated,
    currentPage,
    pageSizes,
    goTo,
    currPageSize,
    setCurrPageSize,
    totalCount,
  } = useAdmisiionLocations();
  const { t } = useTranslation();
  const headerTitle = t('wards', 'Wards');
  const { mortuaryAdmissionLoctionTagUuid } = useConfig<WardConfigObject>();

  const filteredAdmissionLocations = useMemo(() => {
    if (!mortuaryAdmissionLoctionTagUuid) return admissionLocations;

    return admissionLocations.filter((location) => {
      const hasMortuaryTag = location.ward.tags?.some((tag) => tag.uuid === mortuaryAdmissionLoctionTagUuid);
      return !hasMortuaryTag;
    });
  }, [admissionLocations, mortuaryAdmissionLoctionTagUuid]);

  const headers = [
    { key: 'ward', header: t('wardName', 'Ward Name') },
    { key: 'numberOfBeds', header: t('numberofbeds', 'Number of Beds') },
    { key: 'occupiedBeds', header: t('occupiedBeds', 'Occupied Beds') },
    { key: 'freebeds', header: t('freebeds', 'Free Beds') },
    { key: 'bedOccupancy', header: t('bedOccupancy', 'Bed Occupancy%') },
    { key: 'pendingOut', header: t('pendingOut', 'Pending Out') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const calculateOccupancy = (location: AdmissionLocationFetchResponse) => {
    if (!location.totalBeds || !location.occupiedBeds) return 0;
    return (((location.totalBeds - location.occupiedBeds) / location.totalBeds) * 100).toFixed(2);
  };

  const tableRows = useMemo(() => {
    return filteredAdmissionLocations.map((location) => {
      const url = '${openmrsSpaBase}/home/ward/${locationUuid}';

      return {
        id: location.ward.uuid,
        ward: (
          <ConfigurableLink to={url} className={styles.link} templateParams={{ locationUuid: location.ward.uuid }}>
            {location.ward.display}
          </ConfigurableLink>
        ),
        numberOfBeds: location.totalBeds,
        occupiedBeds: location.occupiedBeds,
        freebeds: location.totalBeds - location.occupiedBeds,
        bedOccupancy: calculateOccupancy(location),
        pendingOut: <WardPendingOutCell locationUuid={location.ward.uuid} />,
      };
    });
  }, [filteredAdmissionLocations]);

  if (isLoading)
    return (
      <Layer className={styles.tableContainer}>
        <DataTableSkeleton />
      </Layer>
    );

  if (error)
    return (
      <Layer className={styles.tableContainer}>
        <ErrorState headerTitle={headerTitle} error={error} />
      </Layer>
    );

  return (
    <Tile className={styles.tableContainer}>
      <CardHeader title={headerTitle}>
        <></>
      </CardHeader>
      <DataTable rows={tableRows} headers={headers} isSortable useZebraStyles>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getCellProps }) => (
          <TableContainer className={styles.claimsTable}>
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
            {rows.length === 0 && <EmptyState message={t('noWards', 'No wards found')} />}
            {paginated && !isLoading && (
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
            )}
          </TableContainer>
        )}
      </DataTable>
    </Tile>
  );
};

export default LineListTable;
