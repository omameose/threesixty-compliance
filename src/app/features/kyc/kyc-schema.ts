/**
 * The 11 verification steps described as data. The wizard renders every step from these definitions, and the field names match
 * the request bodies of PUT /company/kyc/steps/{n} exactly (see company-service KycSections). Cross-field rules that the server
 * enforces are mirrored here as `required` / `showIf` functions so people find out before they press save.
 */
export type FieldType =
  | 'text' | 'textarea' | 'number' | 'percent' | 'date' | 'select' | 'country'
  | 'yesno' | 'bool' | 'email' | 'tel' | 'tags' | 'multi';

/** `model` is the object the field lives in (the step, or one list row); `all` is every step's current values. */
export type Rule = boolean | ((model: any, all: Record<number, any>) => boolean);

export interface KycField {
  key: string;
  label: string;
  type: FieldType;
  required?: Rule;
  showIf?: (model: any, all: Record<number, any>) => boolean;
  /** Name of the list in GET /company/kyc/options that supplies the choices. */
  options?: string;
  hint?: string;
  full?: boolean;
  min?: number;
  max?: number;
  /** For `date`: the date must not be in the future ('past') or must be before today ('before-today'). */
  dateRule?: 'not-future' | 'past';
}

export interface KycGroup {
  title?: string;
  description?: string;
  fields: KycField[];
}

export interface KycList {
  key: string;
  /** Sent to the server as the row count, e.g. numberOfDirectors. */
  countKey: string;
  singular: string;
  min: number;
  max: number;
  fields: KycField[];
}

export interface KycStepDef {
  number: number;
  title: string;
  intro: string;
  groups: KycGroup[];
  lists?: KycList[];
  /** Step 10 shows the document uploader. */
  documents?: boolean;
  /** Step 11 submits the application. */
  submits?: boolean;
}

const yes = (key: string, label: string, extra: Partial<KycField> = {}): KycField => ({ key, label, type: 'yesno', required: true, full: true, ...extra });
const pct = (key: string, label: string, extra: Partial<KycField> = {}): KycField => ({ key, label, type: 'percent', min: 0, max: 100, ...extra });

const personFields = (): KycField[] => [
  { key: 'firstName', label: 'First name', type: 'text', required: true },
  { key: 'lastName', label: 'Last name', type: 'text', required: true },
  { key: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true, dateRule: 'past' },
  { key: 'residentialAddress', label: 'Residential address', type: 'text', required: true, full: true },
  { key: 'isPoliticallyExposedPerson', label: 'Is this person a politically exposed person (PEP)?', type: 'bool', required: true, full: true },
  pct('uboOwnershipPercentage', 'UBO ownership (%)'),
  pct('directOwnershipPercentage', 'Direct ownership (%)'),
  { key: 'prospectRelationshipRole', label: 'Role in relation to the company', type: 'text' }
];

/** Question wording for the AML questionnaire (Q1 to Q27), in the order the form presents them. */
export const AML_QUESTIONS: [string, string][] = [
  ['amlProgramApprovedByBoardOrSeniorCommittee', 'Is your AML/CFT programme approved by your board or a senior committee?'],
  ['hasDesignatedAmlComplianceOfficer', 'Do you have a designated AML/CFT compliance officer?'],
  ['hasWrittenPoliciesForSuspiciousTransactions', 'Do you have written policies and procedures for detecting and reporting suspicious transactions?'],
  ['hasInternalAuditOrThirdPartyAmlAssessment', 'Is your AML/CFT programme assessed by internal audit or an independent third party?'],
  ['hasPolicyProhibitingShellBankRelationships', 'Do you have a policy prohibiting relationships with shell banks?'],
  ['hasPolicyToAvoidTransactionsWithShellBanks', 'Do you have a policy to avoid transactions with shell banks?'],
  ['hasPepPolicies', 'Do you have policies for identifying and managing politically exposed persons (PEPs)?'],
  ['hasRecordRetentionProcedures', 'Do you have record retention procedures for customer and transaction records?'],
  ['amlPoliciesAppliedToAllBranchesAndSubsidiaries', 'Do your AML/CFT policies apply to all branches and subsidiaries?'],
  ['hasRiskBasedCustomerAssessment', 'Do you assess customers using a risk-based approach?'],
  ['determinesEnhancedDueDiligenceForHighRisk', 'Do you determine when enhanced due diligence is needed for high-risk customers?'],
  ['hasCustomerIdentificationProcesses', 'Do you have processes to identify and verify your customers?'],
  ['collectsCustomerBusinessInformation', 'Do you collect information about your customers’ business activities?'],
  ['assessesCustomerAmlPolicies', 'Do you assess your customers’ AML/CFT policies where relevant?'],
  ['reviewsAndUpdatesHighRiskClientInfo', 'Do you regularly review and update information on high-risk clients?'],
  ['establishesRecordForEachNewCustomer', 'Do you establish a record for each new customer?'],
  ['completesRiskBasedNormalTransactionAssessment', 'Do you assess the normal expected transaction activity of each customer, based on risk?'],
  ['hasTransactionReportingPolicies', 'Do you have policies for reporting transactions to the regulator?'],
  ['identifiesStructuredTransactions', 'Do you have procedures to identify structured transactions?'],
  ['screensCustomersAgainstSanctionLists', 'Do you screen customers against sanctions lists?'],
  ['operatesOnlyWithLicensedCorrespondents', 'Do you deal only with licensed correspondents or partners?'],
  ['hasSuspiciousActivityMonitoringProgram', 'Do you have a programme for monitoring suspicious activity?'],
  ['providesAmlTrainingToEmployees', 'Do you provide AML/CFT training to your employees?'],
  ['retainsTrainingRecords', 'Do you keep records of AML/CFT training?'],
  ['communicatesAmlChangesToEmployees', 'Do you tell employees about changes to AML/CFT rules and policies?'],
  ['employsThirdPartiesForFunctions', 'Do you use third parties to carry out any AML/CFT functions?']
];

const isYes = (v: unknown) => v === 'YES';

export const KYC_STEPS: KycStepDef[] = [
  {
    number: 1, title: 'Company details', intro: 'Your registered business, licence and expected activity.',
    groups: [
      {
        title: 'Registration',
        fields: [
          { key: 'registeredBusinessName', label: 'Registered business name', type: 'text', required: true },
          { key: 'tradingName', label: 'Trading name', type: 'text' },
          { key: 'businessType', label: 'Business type', type: 'select', options: 'businessTypes', required: true },
          { key: 'countryOfIncorporation', label: 'Country of incorporation', type: 'country', required: true },
          { key: 'companyRegistrationNumber', label: 'Company registration number', type: 'text', required: true },
          { key: 'taxIdentificationNumber', label: 'Tax identification number', type: 'text', required: true },
          { key: 'dateOfIncorporation', label: 'Date of incorporation', type: 'date', required: true, dateRule: 'not-future' },
          { key: 'yearsTrading', label: 'Years trading', type: 'number', required: true, min: 0, max: 200 },
          { key: 'website', label: 'Website', type: 'text', hint: 'https://example.com' },
          { key: 'previousNames', label: 'Previous names', type: 'text', hint: 'Leave empty if none' }
        ]
      },
      {
        title: 'Addresses',
        fields: [
          { key: 'registeredAddress', label: 'Registered address', type: 'text', required: true, full: true },
          { key: 'businessAddress', label: 'Business (operating) address', type: 'text', required: true, full: true },
          { key: 'businessAddressCountry', label: 'Country', type: 'country', required: true },
          { key: 'businessAddressState', label: 'State / region', type: 'text' },
          { key: 'businessAddressCity', label: 'City', type: 'text' },
          { key: 'businessAddressLga', label: 'Local government area', type: 'text' }
        ]
      },
      {
        title: 'Licence',
        fields: [
          { key: 'licenceType', label: 'Licence type', type: 'select', options: 'licenceTypes', required: true },
          { key: 'licenceCategory', label: 'Licence category', type: 'select', options: 'licenceCategories', required: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE', showIf: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE' },
          { key: 'licenceOtherDescription', label: 'Describe the licence category', type: 'text', required: m => m.licenceCategory === 'OTHER', showIf: m => m.licenceType !== 'NO_LICENCE' && m.licenceCategory === 'OTHER' },
          { key: 'licenceNumber', label: 'Licence number', type: 'text', required: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE', showIf: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE' },
          { key: 'licensingAuthority', label: 'Licensing authority', type: 'text', required: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE', showIf: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE' },
          { key: 'licenceExpiryDate', label: 'Licence expiry date', type: 'date', showIf: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE' },
          { key: 'licenceJurisdiction', label: 'Licence jurisdiction', type: 'text', showIf: m => !!m.licenceType && m.licenceType !== 'NO_LICENCE' }
        ]
      },
      {
        title: 'Activity',
        fields: [
          { key: 'industrySector', label: 'Industry sector', type: 'select', options: 'industrySectors', required: true },
          { key: 'hasSecondaryIndustrySector', label: 'Do you operate in a second industry sector?', type: 'bool', required: true },
          { key: 'secondaryIndustrySector', label: 'Secondary industry sector', type: 'text', required: m => m.hasSecondaryIndustrySector === true, showIf: m => m.hasSecondaryIndustrySector === true },
          { key: 'businessActivitiesDescription', label: 'Describe your business activities', type: 'textarea', required: true, full: true, max: 2000 },
          { key: 'transactionOriginCountryCount', label: 'Countries your transactions come from', type: 'select', options: 'countryCounts', required: true },
          { key: 'marketsOfInterestCount', label: 'Markets you are interested in', type: 'select', options: 'countryCounts', required: true },
          { key: 'mobileOperatorPartnerships', label: 'Mobile operator partnerships', type: 'tags', full: true, hint: 'Separate several with commas. Leave empty if none.' },
          { key: 'estimatedMonthlyTransactionCount', label: 'Expected transactions per month', type: 'select', options: 'transactionCountRanges', required: true },
          { key: 'estimatedAnnualTransactionCount', label: 'Expected transactions per year', type: 'select', options: 'transactionCountRanges', required: true }
        ]
      }
    ]
  },
  {
    number: 2, title: 'Directors', intro: 'Everyone who sits on your board of directors.',
    groups: [],
    lists: [{ key: 'directors', countKey: 'numberOfDirectors', singular: 'Director', min: 1, max: 10,
      fields: [
        { key: 'firstName', label: 'First name', type: 'text', required: true },
        { key: 'lastName', label: 'Last name', type: 'text', required: true },
        { key: 'position', label: 'Position', type: 'text', required: true },
        { key: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true, dateRule: 'past' },
        { key: 'nationality', label: 'Nationality', type: 'country' },
        { key: 'residentialAddress', label: 'Residential address', type: 'text', required: true, full: true },
        { key: 'isPoliticallyExposedPerson', label: 'Is this person a politically exposed person (PEP)?', type: 'bool', required: true, full: true },
        pct('uboOwnershipPercentage', 'UBO ownership (%)'),
        pct('directOwnershipPercentage', 'Direct ownership (%)'),
        { key: 'prospectRelationshipRole', label: 'Role in relation to the company', type: 'text' }
      ] }]
  },
  {
    number: 3, title: 'Shareholders', intro: 'Individuals and companies that hold shares. Add at least one; together they cannot exceed 100%.',
    groups: [],
    lists: [
      { key: 'naturalPersonShareholders', countKey: 'numberOfNaturalPersonShareholders', singular: 'Individual shareholder', min: 0, max: 10,
        fields: [...personFields().slice(0, 4), pct('percentageOfShares', 'Shares held (%)', { required: true }), ...personFields().slice(4)] },
      { key: 'entityShareholders', countKey: 'numberOfEntityShareholders', singular: 'Company shareholder', min: 0, max: 10,
        fields: [
          { key: 'entityName', label: 'Company name', type: 'text', required: true },
          { key: 'entityRegistrationNumber', label: 'Registration number', type: 'text', required: true },
          { key: 'countryOfRegistration', label: 'Country of registration', type: 'country', required: true },
          pct('percentageOfShares', 'Shares held (%)', { required: true }),
          pct('uboOwnershipPercentage', 'UBO ownership (%)'),
          pct('directOwnershipPercentage', 'Direct ownership (%)'),
          { key: 'prospectRelationshipRole', label: 'Role in relation to the company', type: 'text' }
        ] }
    ]
  },
  {
    number: 4, title: 'Beneficial owners', intro: 'Every person who ultimately owns or controls 5% or more of the company.',
    groups: [],
    lists: [{ key: 'ubos', countKey: 'numberOfUbosWithFivePercentOrMore', singular: 'Beneficial owner', min: 1, max: 10,
      fields: [...personFields().slice(0, 4), pct('percentageOfEffectiveInterest', 'Effective interest (%)', { required: true }), ...personFields().slice(4)] }]
  },
  {
    number: 5, title: 'Contacts', intro: 'Who we speak to about this application and your compliance programme.',
    groups: [
      {
        title: 'Primary contact',
        fields: [
          { key: 'primaryContact.fullName', label: 'Full name', type: 'text', required: true },
          { key: 'primaryContact.jobTitle', label: 'Job title', type: 'text', required: true },
          { key: 'primaryContact.mobileNumber', label: 'Mobile number', type: 'tel', required: true, hint: 'Digits with an optional leading +' },
          { key: 'primaryContact.email', label: 'Email', type: 'email', required: true },
          pct('primaryContact.uboOwnershipPercentage', 'UBO ownership (%)'),
          pct('primaryContact.directOwnershipPercentage', 'Direct ownership (%)'),
          { key: 'primaryContact.prospectRelationshipRole', label: 'Role in relation to the company', type: 'text' }
        ]
      },
      {
        title: 'Alternative contact',
        fields: [
          { key: 'alternativeContact.hasAlternativeContact', label: 'Do you want to add an alternative contact?', type: 'bool', required: true, full: true },
          ...(['fullName:Full name:text', 'jobTitle:Job title:text', 'mobileNumber:Mobile number:tel', 'email:Email:email'] as string[]).map(s => {
            const [k, label, type] = s.split(':');
            return { key: 'alternativeContact.' + k, label, type: type as FieldType, required: (m: any) => m.alternativeContact?.hasAlternativeContact === true,
              showIf: (m: any) => m.alternativeContact?.hasAlternativeContact === true } as KycField;
          })
        ]
      },
      {
        title: 'Compliance officer',
        fields: [
          { key: 'complianceOfficer.fullName', label: 'Full name', type: 'text', required: true },
          { key: 'complianceOfficer.jobTitle', label: 'Job title', type: 'text', required: true },
          { key: 'complianceOfficer.mobileNumber', label: 'Mobile number', type: 'tel', required: true },
          { key: 'complianceOfficer.email', label: 'Email', type: 'email', required: true },
          { key: 'complianceOfficer.appointmentApprovedByBoard', label: 'Was the appointment approved by the board?', type: 'bool', required: true, full: true }
        ]
      }
    ]
  },
  {
    number: 6, title: 'AML questionnaire', intro: 'Questions 1 to 27 about your anti-money-laundering controls. Answer honestly: a No is fine, you can explain it in step 8.',
    groups: [{
      fields: [
        ...AML_QUESTIONS.map(([key, label], i) => yes(key, `${i + 1}. ${label}`)),
        yes('providesAmlTrainingToThirdParties', '27. Do you provide AML/CFT training to those third parties?', {
          required: m => isYes(m.employsThirdPartiesForFunctions), showIf: m => isYes(m.employsThirdPartiesForFunctions)
        })
      ]
    }]
  },
  {
    number: 7, title: 'Regulatory action', intro: 'Questions 28 and 29 about the last three years.',
    groups: [{
      fields: [
        yes('subjectToMoneyLaunderingOrTerroristFinancingActionsLastThreeYears', '28. In the last three years, has the company been subject to any money laundering or terrorist financing regulatory action?'),
        yes('subjectToTerrorismFinancingInvestigationLastThreeYears', '29. In the last three years, has the company or its owners been subject to any terrorism financing investigation?')
      ]
    }]
  },
  {
    number: 8, title: 'Explanations', intro: 'Only needed where you answered No to questions 1 to 27, or Yes to question 28 or 29.',
    groups: [{
      fields: [
        {
          key: 'noAnswerElaborationForQ1ToQ27', label: 'Explain each No answer in questions 1 to 27', type: 'textarea', full: true, max: 5000,
          required: (_m, all) => Object.values(all[6] ?? {}).some(v => v === 'NO'),
          hint: 'Required because at least one answer in step 6 is No.'
        },
        {
          key: 'yesAnswerDescriptionForQ28AndQ29', label: 'Describe each Yes answer in questions 28 and 29', type: 'textarea', full: true, max: 5000,
          required: (_m, all) => Object.values(all[7] ?? {}).some(v => v === 'YES'),
          hint: 'Required if you answered Yes to question 28 or 29.'
        }
      ]
    }]
  },
  {
    number: 9, title: 'Business operations', intro: 'How you take payments, register customers and safeguard funds.',
    groups: [{
      fields: [
        { key: 'paymentFormsAccepted', label: 'Payment forms you accept', type: 'multi', options: 'paymentForms', required: true, full: true },
        yes('hasConsumerProtectionPolicy', 'Do you have a consumer protection policy?'),
        yes('hasDataProtectionPolicy', 'Do you have a data protection policy?'),
        { key: 'amlTrainingCycleDescription', label: 'How often is AML/CFT training given?', type: 'text', required: true, full: true },
        { key: 'lastAmlTrainingCompletedDate', label: 'Last AML/CFT training completed', type: 'date', required: true, dateRule: 'not-future' },
        { key: 'africanCorridorExperience', label: 'Experience with African payment corridors', type: 'textarea', full: true },
        { key: 'foreignCountryLicencePresence', label: 'Licences or presence in other countries', type: 'select', options: 'foreignLicencePresence', required: true },
        { key: 'countriesExcludedFromTransactions', label: 'Countries you do not transact with', type: 'text', full: true },
        { key: 'primaryCustomerRegistrationMethod', label: 'Primary customer registration method', type: 'select', options: 'customerRegistrationMethods', required: true },
        yes('hasSecondaryCustomerRegistrationMethod', 'Do you have a secondary customer registration method?'),
        { key: 'secondaryCustomerRegistrationMethod', label: 'Secondary registration method', type: 'text', full: true, required: m => isYes(m.hasSecondaryCustomerRegistrationMethod), showIf: m => isYes(m.hasSecondaryCustomerRegistrationMethod) },
        yes('hasAdditionalCustomerRegistrationMethod', 'Do you have any additional customer registration method?'),
        { key: 'businessBankNames', label: 'Banks you operate with', type: 'text', required: true, full: true },
        yes('safeguardsClientFundsWithSameBank', 'Do you keep client funds with the same bank as your own funds?'),
        yes('hasCryptoExposure', 'Does the company have any exposure to crypto-assets?')
      ]
    }]
  },
  {
    number: 10, title: 'Documents', intro: 'Upload the documents we need, then confirm you are done.',
    documents: true,
    groups: [{
      fields: [
        yes('allRequiredDocumentsUploaded', 'I have uploaded all the required documents'),
        { key: 'notes', label: 'Notes for the reviewer', type: 'textarea', full: true }
      ]
    }]
  },
  {
    number: 11, title: 'Declaration', intro: 'Confirm and sign. Saving this step submits your application for review.', submits: true,
    groups: [{
      fields: [
        yes('allInformationIsCorrect', 'All the information provided is correct and complete'),
        yes('authorisedToSignOnBehalfOfCompany', 'I am authorised to sign on behalf of the company'),
        yes('acknowledgesMaterialChangesNotificationObligation', 'We will tell 360 Compliance about any material change to this information'),
        yes('agreesToIdentityChecks', 'We agree to identity verification checks on the company and the people named'),
        yes('confirmsNoFatfHighRiskJurisdictionRelations', 'The company has no relations with FATF high-risk jurisdictions'),
        { key: 'signatoryName', label: 'Signatory name', type: 'text', required: true },
        { key: 'signatoryTitle', label: 'Signatory title', type: 'text', required: true },
        { key: 'signatureDate', label: 'Date', type: 'date', required: true, dateRule: 'not-future' }
      ]
    }]
  }
];
