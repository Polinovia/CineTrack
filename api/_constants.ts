export const TITLE_TYPES = ['film', 'serie', 'anime'] as const
export const TITLE_STATUSES = ['a_voir', 'en_cours', 'vu'] as const

export type TitleType = (typeof TITLE_TYPES)[number]
export type TitleStatus = (typeof TITLE_STATUSES)[number]
