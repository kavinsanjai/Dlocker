export const DOCUMENT_TYPES = [
  {
    value: 'aadhaar_card',
    label: 'Aadhaar Card',
    description: 'Unique identity proof issued by UIDAI.',
    required: true,
    imagePath: '/images/documents/aadhaar-card.png',
  },
  {
    value: 'driving_license',
    label: 'Driving License',
    description: 'Government-issued driving and identity document.',
    required: true,
    imagePath: '/images/documents/driving-license.png',
  },
  {
    value: 'voter_id',
    label: 'Voter ID',
    description: 'Election Commission voter identity proof.',
    required: true,
    imagePath: '/images/documents/voter-id.png',
  },
  {
    value: 'pan_card',
    label: 'PAN Card',
    description: 'Tax identity card for financial verification.',
    required: true,
    imagePath: '/images/documents/pan-card.png',
  },
  {
    value: 'passport',
    label: 'Passport',
    description: 'Travel document and strong address/identity proof.',
    required: false,
    imagePath: '/images/documents/passport.png',
  },
  {
    value: 'birth_certificate',
    label: 'Birth Certificate',
    description: 'Date-of-birth and personal details verification.',
    required: false,
    imagePath: '/images/documents/birth-certificate.png',
  },
  {
    value: 'utility_bill',
    label: 'Utility Bill',
    description: 'Address proof (electricity/water/gas bill).',
    required: false,
    imagePath: '/images/documents/utility-bill.png',
  },
  {
    value: 'other',
    label: 'Other Document',
    description: 'Any additional custom document.',
    required: false,
  },
]

export const DOCUMENT_TYPE_MAP = DOCUMENT_TYPES.reduce((accumulator, item) => {
  accumulator[item.value] = item
  return accumulator
}, {})

export const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.filter(
  (item) => item.required,
)
