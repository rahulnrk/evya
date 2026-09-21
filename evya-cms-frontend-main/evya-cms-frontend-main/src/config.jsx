const CompanyName = "EWE"
const AppName = "evya"
const Description = "Where ever Current"

// Prefer Vite env (see .env.example). Fallbacks are local/dev only — no production secrets.
const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:8800'
const baseOCPPURL = import.meta.env.VITE_BASE_OCPP_URL || 'https://ocpp.evyaa.com'
const baseAlertsURL = import.meta.env.VITE_BASE_ALERTS_URL || 'http://localhost:8080/'
// ADR-003: the OCPI gateway's portal API. Localhost default for dev.
const baseOcpiURL = import.meta.env.VITE_BASE_OCPI_URL || 'http://localhost:8082'

const OrganizationID = Number(import.meta.env.VITE_ORGANIZATION_ID || 1)

const BackgroundImageHomeScreen =
  import.meta.env.VITE_BACKGROUND_IMAGE_HOME ||
  "url('https://img.freepik.com/free-vector/halftone-effect-gradient-background_23-2148593366.jpg')"

export {
  CompanyName,
  AppName,
  Description,
  BackgroundImageHomeScreen,
  baseURL,
  OrganizationID,
  baseOCPPURL,
  baseAlertsURL,
  baseOcpiURL,
}
