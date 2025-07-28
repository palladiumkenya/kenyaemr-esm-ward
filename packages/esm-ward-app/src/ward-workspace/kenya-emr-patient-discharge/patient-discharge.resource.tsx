import {
  type Encounter,
  type FetchResponse,
  openmrsFetch,
  type OpenmrsResource,
  restBaseUrl,
  showSnackbar,
  useAppContext,
  useConfig,
  useSession,
  type Visit,
} from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { type WardPatient } from '../../types';
import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { WardConfigObject } from '../../config-schema';

export function removePatientFromBed(bedId: number, patientUuid: string) {
  return openmrsFetch(`${restBaseUrl}/beds/${bedId}?patientUuid=${patientUuid}`, {
    method: 'DELETE',
  });
}

const createDischargeEncounterPayload = (
  patientUuid: string,
  encounterType: OpenmrsResource,
  location: OpenmrsResource,
  currentProvider: OpenmrsResource,
  visitUuid: string,
  clinicianEncounterRole: OpenmrsResource,
) => {
  const encounterPayload = {
    patient: patientUuid,
    encounterType,
    location: location?.uuid,
    encounterProviders: [
      {
        provider: currentProvider?.uuid,
        encounterRole: clinicianEncounterRole?.uuid,
      },
    ],
    obs: [],
    visit: visitUuid,
  };
  return encounterPayload;
};

const createDischargeEncounter = (encounterPayload: any) => {
  return openmrsFetch(`${restBaseUrl}/encounter`, {
    method: 'POST',
    body: encounterPayload,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Custom hook for handling patient discharge operations
 *
 * This hook provides functionality to discharge a patient by:
 * 1. Creating a discharge encounter
 * 2. Removing the patient from their bed (if applicable)
 * 3. Updating the ward patient group details
 *
 * @returns {Object} An object containing the handleDischarge function
 * @property {Function} handleDischarge - Function to handle the patient discharge process
 */
export const usePatientDischarge = () => {
  const { t } = useTranslation();
  const { wardPatientGroupDetails } =
    useAppContext<{ wardPatientGroupDetails: { mutate: () => void } }>('ward-view-context') ?? {};
  const session = useSession();

  /**
   * Handles the patient discharge process
   *
   * @param {Encounter} encounter - The current encounter
   * @param {WardPatient} wardPatient - The ward patient information
   * @param {Record<string, unknown>} emrConfiguration - EMR configuration containing encounter types and roles
   * @param {Visit} visit - The current visit
   * @returns {Promise<void>} A promise that resolves when the discharge process is complete
   */
  const handleDischarge = async (
    encounter: Encounter,
    wardPatient: WardPatient,
    emrConfiguration: Record<string, unknown>,
    visit: Visit,
  ) => {
    try {
      const encounterPayload = createDischargeEncounterPayload(
        wardPatient.patient.uuid,
        emrConfiguration.exitFromInpatientEncounterType as OpenmrsResource,
        session?.sessionLocation as OpenmrsResource,
        session?.currentProvider as OpenmrsResource,
        visit.uuid,
        emrConfiguration.clinicianEncounterRole as OpenmrsResource,
      );

      const dischargeResponse = await createDischargeEncounter(encounterPayload);

      if (!dischargeResponse?.ok) {
        throw new Error('Failed to create discharge encounter');
      }

      if (wardPatient?.bed?.id) {
        const bedRemovalResponse = await removePatientFromBed(wardPatient.bed.id, wardPatient?.patient?.uuid);
        if (!bedRemovalResponse?.ok) {
          throw new Error('Failed to remove patient from bed');
        }
      }

      showSnackbar({
        title: t('patientWasDischarged', 'Patient was discharged'),
        kind: 'success',
      });
    } catch (err) {
      showSnackbar({
        title: t('errorDischargingPatient', 'Error discharging patient'),
        subtitle: err instanceof Error ? err.message : 'Unknown error occurred',
        kind: 'error',
      });
    } finally {
      wardPatientGroupDetails?.mutate();
    }
  };

  return { handleDischarge };
};
export enum PaymentStatus {
  POSTED = 'POSTED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  CREDITED = 'CREDITED',
  CANCELLED = 'CANCELLED',
  ADJUSTED = 'ADJUSTED',
  EXEMPTED = 'EXEMPTED',
}
type Bill = OpenmrsResource & {
  voided: boolean;
  voidReason?: string;
  dateCreated: string;
  patient: OpenmrsResource;
  status: PaymentStatus;
  lineItems: Array<{
    paymentStatus: PaymentStatus;
    billableService: string;
    quantity: number;
  }>;
};
export const usePatientBills = (patientUuid: string, startingDate?: Date, endDate?: Date) => {
  const rep = 'custom:(uuid,display,voided,voidReason,dateCreated,patient:(uuid,display))';
  const { dailyBedFeeBillableService } = useConfig<WardConfigObject>();
  const startingDateISO = startingDate?.toISOString();
  const endDateISO = endDate.toISOString();
  const url = `${restBaseUrl}/cashier/bill?v=${rep}&patientUuid=${patientUuid}&createdOnOrAfter=${startingDateISO}&createdOnOrBefore=${endDateISO}`;
  const { data, isLoading, error } = useSWR<FetchResponse<{ results: Array<Bill> }>>(startingDate ? url : null);
  const bills = useMemo(
    () => (data?.data?.results ?? []).filter((b) => b.patient.uuid === patientUuid),
    [data, patientUuid],
  );
  const pendingBills = useMemo(() => bills.filter((bill) => bill.status === PaymentStatus.PENDING), [bills]);

  const dailyBedFeeSettled = useCallback(
    (daysInWard?: number) => {
      if (!daysInWard) return true;
      const dailyBedFeesLineItems = bills.reduce<Bill['lineItems']>((prev, curr) => {
        const b = (curr.lineItems ?? []).filter((item) => item.billableService === dailyBedFeeBillableService);
        prev.push(...b);
        return prev;
      }, []);
      const totalQuantity = dailyBedFeesLineItems.reduce((prev, curr) => prev + curr.quantity, 0);
      return totalQuantity === daysInWard;
    },
    [dailyBedFeeBillableService, bills],
  );

  return {
    error,
    isLoading,
    bills,
    pendingBills,
    dailyBedFeeSettled,
  };
};
