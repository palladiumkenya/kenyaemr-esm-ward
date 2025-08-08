import { type ConfigSchema, Type, validators } from '@openmrs/esm-framework';

export const addressFields = [
  'cityVillage',
  'stateProvince',
  'country',
  'postalCode',
  'countyDistrict',
  'latitude',
  'longitude',
  'address1',
  'address2',
  'address3',
  'address4',
  'address5',
  'address6',
  'address7',
  'address8',
  'address9',
  'address10',
  'address11',
  'address12',
  'address13',
  'address14',
  'address15',
] as const;

type AddressField = keyof typeof addressFields;

export const configSchema: ConfigSchema = {
  patientCardElements: {
    _description:
      'Configuration of various patient card elements. Each configured element must have a unique id, defined in the ward React component being used.',
    obs: {
      _type: Type.Array,
      _description: 'Configures obs values to display.',
      _default: [],
      _elements: {
        id: {
          _type: Type.String,
          _description: 'The unique identifier for this patient card element',
        },
        conceptUuid: {
          _type: Type.UUID,
          _description: 'Identifies the concept to use to identify the desired observations.',
        },
        label: {
          _type: Type.String,
          _description:
            "Optional. The custom label or i18n key to the translated label to display. If not provided, defaults to the concept's name. (Note that this can be set to an empty string to not show a label)",
          _default: null,
        },
        orderBy: {
          _type: Type.String,
          _description:
            "One of 'ascending' or 'descending', specifying whether to display the obs by obsDatetime ascendingly or descendingly.",
          _default: 'descending',
          _validators: [validators.oneOf(['ascending', 'descending'])],
        },
        limit: {
          _type: Type.Number,
          _description:
            'If set to a number greater than one, this will show multiple obs for this concept, which will appear as a list. Set to 0 for unlimited.',
          _default: 1,
        },
        onlyWithinCurrentVisit: {
          _type: Type.Boolean,
          _description:
            'Optional. If true, limits display to only observations within current visit. Defaults to false',
          _default: false,
        },
      },
    },
    pendingItems: {
      _type: Type.Array,
      _description: 'Configures pending orders and transfers to display.',
      _default: [
        {
          id: 'pending-items',
          orders: {
            orderTypes: [{ label: 'Labs', uuid: '52a447d3-a64a-11e3-9aeb-50e549534c5e' }],
          },
          showPendingItems: true,
        },
      ],
      _elements: {
        id: {
          _type: Type.String,
          _description: 'The unique identifier for this patient card element',
        },
        orders: {
          orderTypes: {
            _type: Type.Array,
            _description: 'Configures pending orders and transfers to display.',
            _elements: {
              uuid: {
                _type: Type.UUID,
                _description: 'Identifies the order type.',
              },
              label: {
                _type: Type.String,
                _description:
                  "The label or i18n key to the translated label to display. If not provided, defaults to 'Orders'",
                _default: null,
              },
            },
          },
        },
        showPendingItems: {
          _type: Type.Boolean,
          _description:
            'Optional. If true, pending items (e.g., number of pending orders) will be displayed on the patient card.',
        },
      },
    },
    patientIdentifier: {
      _type: Type.Array,
      _description: `Configures patient identifier to display. An unconfigured element displays the preferred identifier.`,
      _default: [
        {
          id: 'patient-identifier',
          showIdentifierLabel: false,
        },
      ],
      _elements: {
        id: {
          _type: Type.String,
          _description: 'The unique identifier for this patient card element',
        },
        showIdentifierLabel: {
          _type: Type.Boolean,
          _description:
            'If true, the identifier type (eg: "OpenMRS ID") is shown along with the identifier itself. Defaults to false',
        },
      },
    },
    patientAddress: {
      _type: Type.Array,
      _description: 'Configures patient address elements.',
      _default: [
        {
          id: 'patient-address',
          fields: ['cityVillage', 'country'],
        },
      ],
      _elements: {
        fields: {
          id: {
            _type: Type.String,
            _description: 'The unique identifier for this patient card element',
          },
          fields: {
            _type: Type.Array,
            _description: 'The fields of the address to display',
            _elements: {
              _type: Type.String,
              _validators: [validators.oneOf(addressFields)],
            },
          },
        },
      },
    },
    admissionRequestNote: {
      _type: Type.Array,
      _description: 'Configures admission request notes to display.',
      _default: [
        {
          id: 'admission-request-note',
          conceptUuid: '161011AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        },
      ],
      _elements: {
        fields: {
          id: {
            _type: Type.String,
            _description: 'The unique identifier for this patient card element',
          },
          conceptUuid: {
            _type: Type.UUID,
            _description: 'Required. Identifies the concept for the admission request note.',
          },
        },
      },
      coloredObsTags: {
        _type: Type.Array,
        _description: 'Configures observation values to display as Carbon tags.',
        _elements: {
          conceptUuid: {
            _type: Type.UUID,
            _description: 'Required. Identifies the concept to use to identify the desired observations.',
            // Problem list
            _default: '1284AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          },
          summaryLabel: {
            _type: Type.String,
            _description: `Optional. The custom label or i18n key to the translated label to display for the summary tag. The summary tag shows the count of the number of answers that are present but not configured to show as their own tags. If not provided, defaults to the name of the concept.`,
            _default: null,
          },
          summaryLabelI18nModule: {
            _type: Type.String,
            _description: 'Optional. The custom module to use for translation of the summary label',
            _default: null,
          },
          summaryLabelColor: {
            _type: Type.String,
            _description:
              'The color of the summary tag. See https://react.carbondesignsystem.com/?path=/docs/components-tag--overview for a list of supported colors',
            _default: null,
          },
          tags: {
            _type: Type.Array,
            _description: `An array specifying concept sets and color. Observations with coded values that are members of the specified concept sets will be displayed as their own tags with the specified color. Any observation with coded values not belonging to any concept sets specified will be summarized as a count in the summary tag. If a concept set is listed multiple times, the first matching applied-to rule takes precedence.`,
            _default: [],
            _elements: {
              color: {
                _type: Type.String,
                _description:
                  'Color of the tag. See https://react.carbondesignsystem.com/?path=/docs/components-tag--overview for a list of supported colors.',
              },
              appliedToConceptSets: {
                _type: Type.Array,
                _description: `The concept sets which the color applies to. Observations with coded values that are members of the specified concept sets will be displayed as their own tag with the specified color. If an observation's coded value belongs to multiple concept sets, the first matching applied-to rule takes precedence.`,
                _elements: {
                  _type: Type.UUID,
                },
              },
            },
          },
        },
      },
    },
  },
  wards: {
    _description: 'Configuration of what type of ward to use at different ward locations.',
    _type: Type.Array,
    _default: [{ id: 'default-ward' }],
    _elements: {
      id: {
        _type: Type.String,
        _description:
          'The ward type to use. Currently, "default-ward" and "maternal-ward" are supported. This string also serves as the extension slot name for the ward view.',
      },
      appliedTo: {
        _type: Type.Array,
        _description:
          'Optional. Conditions under which this card definition should be used. If not provided, the configuration is applied to all wards.',
        _elements: {
          location: {
            _type: Type.UUID,
            _description: 'The UUID of the location. If not provided, applies to all wards.',
            _default: null,
          },
        },
      },
    },
  },
  hideWorkspaceVitalsLinks: {
    _description: 'Configure whether to hide vital history and record vital links in the ward patient workspace.',
    _type: Type.Boolean,
    _default: false,
  },
  ipdDischargeEncounterTypeUuid: {
    _description: 'IPD Discharge encounter type',
    _type: Type.String,
    _default: '7e618d13-ffdb-4650-9a97-10ccd16ca36d',
  },
  transferRequestEncounterTypeUuid: {
    _description: 'Tranfer request encounter type',
    _type: Type.String,
    _default: 'b2c4d5e6-7f8a-4e9b-8c1d-2e3f8e4a3b8f',
  },
  referralsConceptUuid: {
    _description: 'Referrals concept uuid',
    _type: Type.String,
    _default: '1695AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  referringToAnotherFacilityConceptUuid: {
    _description: 'Referring to another facility concept uuid',
    _type: Type.String,
    _default: '164165AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  inpatientDischargeFormUuid: {
    _description: 'IPD Discharge form uuid',
    _type: Type.String,
    _default: '98a781d2-b777-4756-b4c9-c9b0deb3483c',
  },
  conceptUuidForWardAdmission: {
    _description: 'Concept UUID for ward admission',
    _type: Type.Object,
    _default: {
      paymentMethod: 'ffd8e033-a286-42b4-89d5-c6d6506d3161',
      mpesaPaymentMethod: '9b24f997-6582-46b5-8f58-924b0e39ad9a',
      cashPaymentMethod: 'fc894152-07be-4e77-9dac-2a164e400a13',
      insurancePaymentMethod: '95d2b358-ef3b-4a41-9215-06bfc9ef107e',
      otherInsuaranceType: '5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      insuranceOtherSpecify: '162169AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      primaryDoctor: '2b537713-298c-4b60-83c3-8006ea622d70',
      primaryDoctorPhoneNumber: '159635AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      emmergencyDoctor: '1473AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      emmergencyDoctorPhoneNumber: '163152AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      admissionDateTime: '1640AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      chiefComplaint: '5219AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
  diagnosisConceptSourceUud: {
    _type: Type.UUID,
    _description: 'Diagnosis concept source',
    _default: '39ADDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
  },
  insuaranceTypes: {
    _description: 'Insuarance Types',
    _type: Type.Array,
    _elements: {
      concept: {
        _type: Type.UUID,
        _description: 'Concept Uuid',
      },
      label: {
        _type: Type.String,
        _description: 'Display string',
      },
    },
    _default: [
      {
        concept: '1a7fb8b5-6093-486d-baa2-65f8b4388544',
        label: 'SHA',
      },
      {
        concept: '1917AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        label: 'Policy Holder',
      },
      {
        concept: '5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        label: 'OTHER',
      },
    ],
  },
  inpatientAdmissionEncounterProviderRole: {
    _type: Type.UUID,
    _description: 'Encounter provider role',
    _default: "'a0b03050-c99b-11e0-9572-0800200c9a66'",
  },
  mortuaryAdmissionLoctionTagUuid: {
    _description: 'Mortuary admission location tag uuid',
    _type: Type.String,
    _default: '1dbbfe22-d21f-499c-bf33-cc9f75b6c7e8',
  },
  dailyBedFeeBillableService: {
    _description: 'Daily Bed Fee bILLABLE SERVICE uuid',
    _type: Type.UUID,
    _default: '37ce491f-b2dd-4433-b203-efebb8ba1469',
  },
  drugOrderEncounterType: {
    _description: 'Drug Order encounter type Uuid',
    _type: Type.UUID,
    _default: '7df67b83-1b84-4fe2-b1b7-794b4e9bfcc3',
  },
};

export interface WardConfigObject {
  patientCardElements: {
    obs: Array<ObsElementConfig>;
    pendingItems: Array<PendingItemsElementConfig>;
    patientIdentifier: Array<IdentifierElementConfig>;
    patientAddress: Array<PatientAddressElementConfig>;
    coloredObsTags: Array<ColoredObsTagsElementConfig>;
    admissionRequestNote: Array<AdmissionRequestNoteElementConfig>;
  };
  wards: Array<WardDefinition>;
  hideWorkspaceVitalsLinks: boolean;
  ipdDischargeEncounterTypeUuid: string;
  inpatientDischargeFormUuid: string;
  transferRequestEncounterTypeUuid: string;
  referralsConceptUuid: string;
  referringToAnotherFacilityConceptUuid: string;
  insuaranceTypes: Array<{ label: string; concept: string }>;
  conceptUuidForWardAdmission: {
    paymentMethod: string;
    mpesaPaymentMethod: string;
    cashPaymentMethod: string;
    insurancePaymentMethod: string;
    otherInsuaranceType: string;
    insuranceOtherSpecify: string;
    primaryDoctorPhoneNumber: string;
    primaryDoctor: string;
    emmergencyDoctor: string;
    emmergencyDoctorPhoneNumber: string;
    admissionDateTime: string;
    chiefComplaint: string;
  };
  diagnosisConceptSourceUud: string;
  inpatientAdmissionEncounterProviderRole: string;
  mortuaryAdmissionLoctionTagUuid: string;
  dailyBedFeeBillableService: string;
  drugOrderEncounterType: string;
}

export interface PendingItemsElementConfig {
  id: string;
  showPendingItems: boolean;
  orders: {
    orderTypes: Array<{
      label?: string;
      uuid: string;
    }>;
  };
}

export interface ObsElementConfig {
  id: string;
  conceptUuid: string;
  onlyWithinCurrentVisit: boolean;
  orderBy: 'ascending' | 'descending';
  limit: number;
  label?: string;
}

export interface IdentifierElementConfig {
  id: string;
  showIdentifierLabel: boolean;
}

export interface PatientAddressElementConfig {
  id: string;
  fields: Array<AddressField>;
}

export interface AdmissionRequestNoteElementConfig {
  id: string;
  conceptUuid: string;
}

export interface WardDefinition {
  id: string;
  appliedTo?: Array<{
    /**
     * locationUuid. If given, only applies to patients at the specified ward locations. (If not provided, applies to all locations)
     */
    location: string;
  }>;
}
export interface ColoredObsTagsElementConfig {
  /**
   * Required. Identifies the concept to use to identify the desired observations.
   */
  conceptUuid: string;

  /**
   * Optional. The custom label or i18n key to the translated label to display for the summary tag. The summary tag
   * shows the count of the number of answers that are present but not configured to show as their own tags. If not
   * provided, defaults to the name of the concept.
   */
  summaryLabel?: string;

  /**
   * The color of the summary tag.
   * See https://react.carbondesignsystem.com/?path=/docs/components-tag--overview for a list of supported colors
   */
  summaryLabelColor?: string;

  /**
   * An array specifying concept sets and color. Observations with coded values that are members of the specified concept sets
   * will be displayed as their own tags with the specified color. Any observation with coded values not belonging to
   * any concept sets specified will be summarized as a count in the summary tag. If a concept set is listed multiple times,
   * the first matching applied-to rule takes precedence.
   */
  tags: Array<ColoredObsTagConfig>;
}

export interface ColoredObsTagConfig {
  /**
   * Color of the tag. See https://react.carbondesignsystem.com/?path=/docs/components-tag--overview for a list of supported colors.
   */
  color: string;

  /**
   * The concept sets which the color applies to. Observations with coded values that are members of the specified concept sets
   * will be displayed as their own tag with the specified color.
   * If an observation's coded value belongs to multiple concept sets, the first matching applied-to rule takes precedence.
   */
  appliedToConceptSets: Array<string>;
}
