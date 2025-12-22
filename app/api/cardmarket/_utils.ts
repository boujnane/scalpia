// app/api/cardmarket/_utils.ts
export const API_HOST = 'cardmarket-api-tcg.p.rapidapi.com'
export const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com'

export const headers = (apiKey: string) => ({
  'x-rapidapi-host': API_HOST,
  'x-rapidapi-key': apiKey,
})
